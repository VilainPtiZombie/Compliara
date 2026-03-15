import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { RGAA_CRITERIA } from '../data/rgaa-criteria.data';

@Injectable()
export class DeclarationsService {
  constructor(private prisma: PrismaService) {}

  // ── CRUD de base ────────────────────────────────────────────────────────────

  async create(
    data: {
      serviceId: string;
      rgaaVersion?: string;
      dateAudit?: string;
      auditCompany?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      tools?: string;
      pages?: { name: string; url: string; pageType?: string }[];
    },
    tenantId: string,
  ) {
    return this.prisma.declaration.create({
      data: {
        tenantId,
        serviceId: data.serviceId,
        rgaaVersion: data.rgaaVersion ?? '4.1',
        dateAudit: data.dateAudit ? new Date(data.dateAudit) : null,
        auditCompany: data.auditCompany,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        tools: data.tools,
        auditedPages: data.pages?.length
          ? {
              create: data.pages.map((p, i) => ({
                name: p.name,
                url: p.url,
                pageType: (p.pageType ?? 'OTHER') as any,
                order: i + 1,
              })),
            }
          : undefined,
      } as any,
      include: { service: { select: { id: true, name: true } } },
    });
  }

  findAll(tenantId: string, serviceId?: string) {
    return this.prisma.declaration.findMany({
      where: { tenantId, ...(serviceId ? { serviceId } : {}) },
      include: {
        service: { select: { id: true, name: true, url: true } },
        _count: {
          select: { criterionResults: true, auditedPages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: {
      rgaaVersion?: string;
      dateAudit?: string;
      status?: string;
      auditCompany?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      tools?: string;
    },
    tenantId: string,
  ) {
    await this.findOne(id, tenantId);
    return this.prisma.declaration.update({
      where: { id },
      data: {
        ...(data.rgaaVersion && { rgaaVersion: data.rgaaVersion }),
        ...(data.dateAudit !== undefined && { dateAudit: data.dateAudit ? new Date(data.dateAudit) : null }),
        ...(data.status && { status: data.status as any }),
        ...(data.auditCompany !== undefined && { auditCompany: data.auditCompany }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.tools !== undefined && { tools: data.tools }),
      },
      include: { service: { select: { id: true, name: true } } },
    });
  }

  async stats(tenantId: string) {
    const [services, declarations, ncCount] = await Promise.all([
      this.prisma.service.count({ where: { tenantId, isActive: true } }),
      this.prisma.declaration.findMany({
        where: { tenantId },
        select: { status: true, complianceRate: true },
      }),
      this.prisma.criterionResult.count({
        where: {
          declaration: { tenantId },
          status: 'NON_CONFORME',
        },
      }),
    ]);

    const published = declarations.filter(d => d.status === 'PUBLISHED').length;
    const rates = declarations.map(d => d.complianceRate).filter((r): r is number => r !== null);
    const avgRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

    return {
      services,
      declarations: declarations.length,
      published,
      ncCount,
      avgRate,
    };
  }

  async findOne(id: string, tenantId: string) {
    const decl = await this.prisma.declaration.findFirst({
      where: { id, tenantId },
      include: {
        service: true,
        auditedPages: { orderBy: { order: 'asc' } },
        criterionResults: {
          include: {
            affectedPages: true,
            correctiveAction: true,
          },
          orderBy: { criterionRef: 'asc' },
        },
      },
    });

    if (!decl) throw new NotFoundException('Déclaration introuvable');
    return decl;
  }

  // ── Audit ───────────────────────────────────────────────────────────────────

  async initAudit(declarationId: string, tenantId: string) {
    const decl = await this.findOne(declarationId, tenantId);

    const existingRefs = new Set(decl.criterionResults.map(r => r.criterionRef));
    const toCreate = RGAA_CRITERIA.filter(c => !existingRefs.has(c.ref));

    if (toCreate.length > 0) {
      await this.prisma.criterionResult.createMany({
        data: toCreate.map(c => ({
          declarationId,
          criterionRef: c.ref,
          thematic: c.thematic,
          title: c.title,
          level: c.level,
          status: 'NON_AUDITE' as any,
        })),
      });
    }

    return this.findOne(declarationId, tenantId);
  }

  async updatePages(
    declarationId: string,
    tenantId: string,
    pages: { name: string; url: string; pageType?: string }[],
  ) {
    await this.findOne(declarationId, tenantId);

    // Supprimer toutes les pages existantes et recréer
    await this.prisma.auditedPage.deleteMany({ where: { declarationId } });

    if (pages.length > 0) {
      await this.prisma.auditedPage.createMany({
        data: pages.map((p, i) => ({
          declarationId,
          name: p.name,
          url: p.url,
          pageType: (p.pageType ?? 'OTHER') as any,
          order: i + 1,
        })),
      });
    }

    return this.prisma.auditedPage.findMany({
      where: { declarationId },
      orderBy: { order: 'asc' },
    });
  }

  async bulkUpdateCriteria(
    declarationId: string,
    tenantId: string,
    updates: {
      criterionRef: string;
      status: string;
      comment?: string;
      impact?: string;
      affectedPageIds?: string[];
    }[],
  ) {
    await this.findOne(declarationId, tenantId);

    for (const update of updates) {
      const criterion = await this.prisma.criterionResult.findFirst({
        where: { declarationId, criterionRef: update.criterionRef },
      });
      if (!criterion) continue;

      await this.prisma.criterionResult.update({
        where: { id: criterion.id },
        data: {
          status: update.status as any,
          comment: update.comment ?? null,
          impact: (update.impact || null) as any,
          ...(update.affectedPageIds !== undefined && {
            affectedPages: {
              set: update.affectedPageIds.map(id => ({ id })),
            },
          }),
        },
      });
    }

    await this.recalculateComplianceRate(declarationId);
    return this.findOne(declarationId, tenantId);
  }

  async updateCriterion(
    declarationId: string,
    criterionRef: string,
    tenantId: string,
    data: {
      status: string;
      comment?: string;
      impact?: string;
      affectedPageIds?: string[];
    },
  ) {
    await this.findOne(declarationId, tenantId);

    const criterion = await this.prisma.criterionResult.findFirst({
      where: { declarationId, criterionRef },
    });

    if (!criterion) throw new NotFoundException('Critère introuvable');

    const updated = await this.prisma.criterionResult.update({
      where: { id: criterion.id },
      data: {
        status: data.status as any,
        comment: data.comment ?? null,
        impact: (data.impact || null) as any,
        ...(data.affectedPageIds !== undefined && {
          affectedPages: {
            set: data.affectedPageIds.map(id => ({ id })),
          },
        }),
      },
      include: { affectedPages: true },
    });

    await this.recalculateComplianceRate(declarationId);
    return updated;
  }

  private async recalculateComplianceRate(declarationId: string) {
    const results = await this.prisma.criterionResult.findMany({
      where: { declarationId },
      select: { status: true },
    });

    const applicable = results.filter(r => (r.status as string) !== 'NON_AUDITE' && r.status !== 'NON_APPLICABLE');
    const conforme = applicable.filter(r => r.status === 'CONFORME');

    const rate =
      applicable.length > 0
        ? Math.round((conforme.length / applicable.length) * 1000) / 10
        : null;

    await this.prisma.declaration.update({
      where: { id: declarationId },
      data: { complianceRate: rate },
    });
  }
}
