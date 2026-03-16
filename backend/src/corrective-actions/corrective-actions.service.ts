import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionStatus, ImpactLevel } from '@prisma/client';

@Injectable()
export class CorrectiveActionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters: {
      declarationId?: string;
      status?: string;
      sprint?: string;
      serviceId?: string;
    } = {},
  ) {
    return this.prisma.correctiveAction.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status as ActionStatus } : {}),
        ...(filters.sprint ? { sprint: { contains: filters.sprint, mode: 'insensitive' } } : {}),
        ...(filters.declarationId
          ? { criterionResult: { declarationId: filters.declarationId } }
          : {}),
        ...(filters.serviceId
          ? { criterionResult: { declaration: { serviceId: filters.serviceId } } }
          : {}),
      },
      include: {
        criterionResult: {
          include: {
            declaration: {
              include: {
                service: { select: { id: true, name: true } },
              },
            },
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const action = await this.prisma.correctiveAction.findFirst({
      where: { id, tenantId },
      include: {
        criterionResult: {
          include: {
            declaration: {
              include: {
                service: { select: { id: true, name: true } },
              },
            },
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!action) throw new NotFoundException('Action corrective introuvable');
    return action;
  }

  async create(
    dto: {
      criterionResultId: string;
      title?: string;
      description?: string;
      note?: string;
      priority?: ImpactLevel;
      status?: ActionStatus;
      assignedToId?: string;
      dueDate?: string;
      sprint?: string;
    },
    tenantId: string,
  ) {
    // Verify criterionResult belongs to this tenant
    const criterionResult = await this.prisma.criterionResult.findFirst({
      where: {
        id: dto.criterionResultId,
        declaration: { tenantId },
      },
    });
    if (!criterionResult) {
      throw new NotFoundException('Critère introuvable ou non autorisé');
    }

    const title = dto.title || `Corriger ${criterionResult.criterionRef}`;
    const priority = dto.priority || (criterionResult.impact as ImpactLevel) || ImpactLevel.MEDIUM;

    return this.prisma.correctiveAction.create({
      data: {
        criterionResultId: dto.criterionResultId,
        tenantId,
        title,
        description: dto.description,
        note: dto.note,
        priority,
        status: dto.status || ActionStatus.TODO,
        assignedToId: dto.assignedToId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        sprint: dto.sprint,
      },
      include: {
        criterionResult: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(
    id: string,
    dto: {
      title?: string;
      description?: string;
      note?: string;
      priority?: ImpactLevel;
      status?: ActionStatus;
      assignedToId?: string | null;
      dueDate?: string | null;
      sprint?: string;
      wontFixReason?: string;
    },
    tenantId: string,
  ) {
    await this.findOne(id, tenantId);

    if (dto.status === ActionStatus.WONT_FIX && !dto.wontFixReason) {
      throw new BadRequestException('wontFixReason est obligatoire pour le statut WONT_FIX');
    }

    let resolvedAt: Date | null | undefined = undefined;
    if (dto.status === ActionStatus.DONE) {
      resolvedAt = new Date();
    } else if (
      dto.status === ActionStatus.TODO ||
      dto.status === ActionStatus.IN_PROGRESS ||
      dto.status === ActionStatus.WONT_FIX
    ) {
      resolvedAt = null;
    }

    return this.prisma.correctiveAction.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.sprint !== undefined ? { sprint: dto.sprint } : {}),
        ...(dto.wontFixReason !== undefined ? { wontFixReason: dto.wontFixReason } : {}),
        ...(resolvedAt !== undefined ? { resolvedAt } : {}),
      },
      include: {
        criterionResult: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.correctiveAction.delete({ where: { id } });
  }

  async batchCreate(declarationId: string, tenantId: string) {
    // Verify declaration belongs to tenant
    const declaration = await this.prisma.declaration.findFirst({
      where: { id: declarationId, tenantId },
    });
    if (!declaration) throw new NotFoundException('Déclaration introuvable ou non autorisée');

    // Find all NC criteria without an existing corrective action
    const ncWithoutAction = await this.prisma.criterionResult.findMany({
      where: {
        declarationId,
        status: 'NON_CONFORME',
        correctiveAction: null,
      },
    });

    if (ncWithoutAction.length === 0) {
      return { created: 0, message: 'Toutes les NC ont déjà une action planifiée' };
    }

    await this.prisma.correctiveAction.createMany({
      data: ncWithoutAction.map((cr) => ({
        id: undefined,
        criterionResultId: cr.id,
        tenantId,
        title: `Corriger ${cr.criterionRef}`,
        priority: (cr.impact as ImpactLevel) || ImpactLevel.MEDIUM,
        status: ActionStatus.TODO,
      })),
      skipDuplicates: true,
    });

    return { created: ncWithoutAction.length };
  }

  async getTeamUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    });
  }

  async getStats(declarationId: string, tenantId: string) {
    // Verify declaration belongs to tenant
    const declaration = await this.prisma.declaration.findFirst({
      where: { id: declarationId, tenantId },
    });
    if (!declaration) throw new NotFoundException('Déclaration introuvable ou non autorisée');

    const ncTotal = await this.prisma.criterionResult.count({
      where: { declarationId, status: 'NON_CONFORME' },
    });

    const actions = await this.prisma.correctiveAction.groupBy({
      by: ['status'],
      where: { criterionResult: { declarationId }, tenantId },
      _count: { status: true },
    });

    const byStatus = Object.fromEntries(actions.map((a) => [a.status, a._count.status]));

    const planned =
      (byStatus['TODO'] || 0) +
      (byStatus['IN_PROGRESS'] || 0) +
      (byStatus['DONE'] || 0) +
      (byStatus['WONT_FIX'] || 0);

    return {
      total: ncTotal,
      planned,
      todo: byStatus['TODO'] || 0,
      inProgress: byStatus['IN_PROGRESS'] || 0,
      done: byStatus['DONE'] || 0,
      wontFix: byStatus['WONT_FIX'] || 0,
    };
  }
}
