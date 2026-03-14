import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeclarationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: {
      serviceId: string;
      rgaaVersion?: string;
      dateAudit?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
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
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
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
      },
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
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
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
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
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
}
