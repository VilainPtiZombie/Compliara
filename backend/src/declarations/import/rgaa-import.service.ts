import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RgaaExcelParserService } from './rgaa-excel-parser.service';

@Injectable()
export class RgaaImportService {
  constructor(
    private prisma: PrismaService,
    private parser: RgaaExcelParserService,
  ) {}

  async importFromBuffer(
    buffer: Buffer,
    serviceId: string,
    tenantId: string,
  ) {
    // 1. Parser le fichier Excel
    const parsed = this.parser.parse(buffer);

    // 2. Vérifier que le service appartient au tenant
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });
    if (!service) throw new BadRequestException('Service introuvable');

    // 3. Créer la déclaration en transaction
    const declaration = await this.prisma.$transaction(async (tx) => {
      // Créer la déclaration
      const decl = await tx.declaration.create({
        data: {
          tenantId,
          serviceId,
          status: 'DRAFT',
          rgaaVersion: parsed.rgaaVersion,
          dateAudit: parsed.dateAudit,
          contactName: parsed.auditors,
          complianceRate: parsed.complianceRate,
          // Créer les pages auditées
          auditedPages: {
            create: parsed.pages.map(p => ({
              name: p.name,
              url: p.url,
              order: p.order,
            })),
          },
        },
        include: { auditedPages: true },
      });

      // Construire un map ref → id des pages créées
      const pageRefToId = new Map<string, string>();
      decl.auditedPages.forEach((page, idx) => {
        const ref = parsed.pages[idx]?.ref;
        if (ref) pageRefToId.set(ref, page.id);
      });

      // Créer les résultats de critères
      for (const criterion of parsed.criteria) {
        const affectedPageIds = criterion.affectedPageRefs
          .map(ref => pageRefToId.get(ref))
          .filter((id): id is string => !!id);

        await tx.criterionResult.create({
          data: {
            declarationId: decl.id,
            criterionRef: criterion.criterionRef,
            thematic: criterion.thematic,
            level: criterion.level,
            title: criterion.title,
            status: criterion.status,
            comment: criterion.comment,
            impact: criterion.impact,
            hasWaiver: criterion.hasWaiver,
            waiverReason: criterion.waiverReason,
            affectedPages: affectedPageIds.length > 0
              ? { connect: affectedPageIds.map(id => ({ id })) }
              : undefined,
          },
        });
      }

      return decl;
    });

    return {
      declarationId: declaration.id,
      publicToken: declaration.publicToken,
      pagesImported: parsed.pages.length,
      criteriaImported: parsed.criteria.length,
      complianceRate: parsed.complianceRate,
      siteName: parsed.siteName,
    };
  }
}
