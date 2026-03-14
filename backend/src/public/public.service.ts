import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async findByToken(token: string) {
    const decl = await this.prisma.declaration.findUnique({
      where: { publicToken: token },
      include: {
        service: { select: { name: true, url: true } },
        auditedPages: { orderBy: { order: 'asc' } },
        criterionResults: {
          orderBy: { criterionRef: 'asc' },
          include: { affectedPages: { select: { id: true, name: true } } },
        },
      },
    });

    if (!decl) throw new NotFoundException('Déclaration introuvable');
    return decl;
  }
}
