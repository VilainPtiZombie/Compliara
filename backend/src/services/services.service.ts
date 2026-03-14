import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      include: {
        _count: { select: { declarations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!service) throw new NotFoundException('Service introuvable');
    return service;
  }

  create(data: { name: string; url: string; description?: string }, tenantId: string) {
    return this.prisma.service.create({
      data: { ...data, tenantId },
    });
  }

  async update(id: string, data: { name?: string; url?: string; description?: string }, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.service.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.service.delete({ where: { id } });
  }
}
