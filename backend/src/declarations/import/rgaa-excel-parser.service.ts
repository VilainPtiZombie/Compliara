import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

// ─── Types internes du parser ─────────────────────────────────────────────────

export interface ParsedAuditedPage {
  ref: string;       // P01, P02...
  name: string;
  url: string;
  order: number;
}

export interface ParsedCriterionResult {
  criterionRef: string;     // ex: "1.1"
  thematic: string;         // ex: "IMAGES"
  level: string;            // A | AA
  title: string;
  status: 'CONFORME' | 'NON_CONFORME' | 'NON_APPLICABLE';
  hasWaiver: boolean;
  waiverReason: string | null;
  comment: string | null;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  affectedPageRefs: string[];
}

export interface ParsedDeclaration {
  siteName: string;
  siteUrl: string;
  dateAudit: Date | null;
  auditors: string;
  context: string;
  rgaaVersion: string;
  complianceRate: number | null;
  pages: ParsedAuditedPage[];
  criteria: ParsedCriterionResult[];
}

// ─── Statuts bruts dans Excel ─────────────────────────────────────────────────

type RawStatus = 'C' | 'NC' | 'NA' | '';

const STATUS_MAP: Record<string, 'CONFORME' | 'NON_CONFORME' | 'NON_APPLICABLE'> = {
  C: 'CONFORME',
  NC: 'NON_CONFORME',
  NA: 'NON_APPLICABLE',
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RgaaExcelParserService {
  parse(buffer: Buffer): ParsedDeclaration {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const pages = this.parseEchantillon(wb);
    const criteria = this.parseCriteria(wb, pages);
    const metadata = this.parseMetadata(wb);

    const complianceRate = this.computeComplianceRate(criteria);

    return {
      ...metadata,
      complianceRate,
      pages,
      criteria,
    };
  }

  // ── Onglet Echantillon ──────────────────────────────────────────────────────

  private parseMetadata(wb: XLSX.WorkBook): Omit<ParsedDeclaration, 'pages' | 'criteria' | 'complianceRate'> {
    const ws = wb.Sheets['Echantillon'];
    if (!ws) throw new BadRequestException("Onglet 'Echantillon' introuvable dans le fichier");

    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const raw = {
      dateRaw: rows[1]?.[1] ?? '',
      auditors: String(rows[2]?.[1] ?? ''),
      context: String(rows[3]?.[1] ?? ''),
      siteRaw: String(rows[4]?.[1] ?? ''),
    };

    // Date : Excel sériel ou objet Date
    let dateAudit: Date | null = null;
    if (raw.dateRaw instanceof Date) {
      dateAudit = raw.dateRaw;
    } else if (typeof raw.dateRaw === 'number') {
      dateAudit = XLSX.SSF.parse_date_code(raw.dateRaw) as any;
    }

    // Séparation nom / URL du site (format: "Nom - https://...")
    let siteName = raw.siteRaw;
    let siteUrl = '';
    const urlMatch = raw.siteRaw.match(/(https?:\/\/\S+)/);
    if (urlMatch) {
      siteUrl = urlMatch[1].replace(/\/$/, '');
      siteName = raw.siteRaw.replace(urlMatch[0], '').replace(/-\s*$/, '').trim();
    }

    // Version RGAA détectée dans la première cellule
    const headerCell = String(rows[0]?.[0] ?? '');
    const versionMatch = headerCell.match(/RGAA\s*([\d.]+)/i)
      || String(rows[0]?.[3] ?? '').match(/RGAA\s*([\d.]+)/i);
    const rgaaVersion = versionMatch ? versionMatch[1] : '4.1';

    return { siteName, siteUrl, dateAudit, auditors: raw.auditors, context: raw.context, rgaaVersion };
  }

  private parseEchantillon(wb: XLSX.WorkBook): ParsedAuditedPage[] {
    const ws = wb.Sheets['Echantillon'];
    if (!ws) throw new BadRequestException("Onglet 'Echantillon' introuvable");

    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const pages: ParsedAuditedPage[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const ref = String(row[0] ?? '').trim();
      if (/^P\d+$/i.test(ref)) {
        pages.push({
          ref: ref.toUpperCase(),
          name: String(row[1] ?? '').trim(),
          url: String(row[2] ?? '').trim(),
          order: pages.length + 1,
        });
      }
    }

    return pages;
  }

  // ── Onglets Pxx ────────────────────────────────────────────────────────────

  private parseCriteria(wb: XLSX.WorkBook, pages: ParsedAuditedPage[]): ParsedCriterionResult[] {
    // Récupérer les onglets P01, P02... présents dans le fichier
    const pageSheets = wb.SheetNames.filter(n => /^P\d+$/i.test(n));

    // Map critère → résultats par page
    const criteriaMap = new Map<string, {
      thematic: string;
      level: string;
      title: string;
      perPage: Map<string, { status: RawStatus; derogation: string; problems: string; comments: string }>;
    }>();

    for (const sheetName of pageSheets) {
      const ws = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      let currentThematic = '';

      // Les critères commencent à la ligne 3 (index 2), après l'en-tête
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        const ref = String(row[1] ?? '').trim();

        // Mise à jour de la thématique courante (colonne A, seulement sur 1ère ligne du groupe)
        const rawThematic = String(row[0] ?? '').trim();
        if (rawThematic) currentThematic = rawThematic;

        // Ignorer les lignes sans référence critère valide (ex: "1.1")
        if (!/^\d+\.\d+$/.test(ref)) continue;

        const status = String(row[4] ?? '').trim().toUpperCase() as RawStatus;
        const derogation = String(row[5] ?? '').trim().toUpperCase();
        const problems = String(row[6] ?? '').trim();
        const comments = String(row[7] ?? '').trim();
        const level = String(row[2] ?? '').trim();
        const title = String(row[3] ?? '').trim();

        if (!criteriaMap.has(ref)) {
          criteriaMap.set(ref, {
            thematic: currentThematic,
            level,
            title,
            perPage: new Map(),
          });
        } else {
          // Mettre à jour la thématique si elle était vide
          const entry = criteriaMap.get(ref)!;
          if (!entry.thematic && currentThematic) entry.thematic = currentThematic;
        }

        criteriaMap.get(ref)!.perPage.set(sheetName, { status, derogation, problems, comments });
      }
    }

    // Agréger par critère
    const results: ParsedCriterionResult[] = [];

    for (const [ref, data] of criteriaMap.entries()) {
      const statuses = Array.from(data.perPage.values()).map(p => p.status).filter(s => s !== '');

      // Règle d'agrégation : NC > C > NA
      let globalStatus: 'CONFORME' | 'NON_CONFORME' | 'NON_APPLICABLE' = 'NON_APPLICABLE';
      if (statuses.includes('NC')) {
        globalStatus = 'NON_CONFORME';
      } else if (statuses.includes('C')) {
        globalStatus = 'CONFORME';
      }

      const hasWaiver = Array.from(data.perPage.values()).some(p => p.derogation === 'OUI');
      const waiverReasons = Array.from(data.perPage.values())
        .filter(p => p.derogation === 'OUI' && p.comments)
        .map(p => p.comments);

      const allProblems = Array.from(data.perPage.values())
        .filter(p => p.problems)
        .map((p, idx) => {
          const pageName = pageSheets[idx] ?? '';
          return p.problems ? `[${pageName}] ${p.problems}` : '';
        })
        .filter(Boolean)
        .join('\n');

      // Impact basé sur le niveau et le statut
      let impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null = null;
      if (globalStatus === 'NON_CONFORME') {
        impact = data.level === 'A' ? 'CRITICAL' : 'HIGH';
      }

      // Pages concernées par une non-conformité
      const affectedPageRefs = Array.from(data.perPage.entries())
        .filter(([, v]) => v.status === 'NC')
        .map(([pageSheet]) => pageSheet.toUpperCase());

      results.push({
        criterionRef: ref,
        thematic: data.thematic,
        level: data.level,
        title: data.title,
        status: globalStatus,
        hasWaiver,
        waiverReason: waiverReasons.length > 0 ? waiverReasons.join('\n') : null,
        comment: allProblems || null,
        impact,
        affectedPageRefs,
      });
    }

    // Tri par référence numérique (1.1, 1.2, ..., 13.8)
    results.sort((a, b) => {
      const [aT, aC] = a.criterionRef.split('.').map(Number);
      const [bT, bC] = b.criterionRef.split('.').map(Number);
      return aT !== bT ? aT - bT : aC - bC;
    });

    return results;
  }

  // ── Calcul taux de conformité global ───────────────────────────────────────

  private computeComplianceRate(criteria: ParsedCriterionResult[]): number | null {
    const applicable = criteria.filter(c => c.status !== 'NON_APPLICABLE');
    if (applicable.length === 0) return null;

    const conformes = applicable.filter(c => c.status === 'CONFORME').length;
    return Math.round((conformes / applicable.length) * 10000) / 100;
  }
}
