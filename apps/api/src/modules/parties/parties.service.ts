import { Injectable, NotFoundException } from '@nestjs/common';
import { PartyKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { PartyDto } from './dto/party.dto';

@Injectable()
export class PartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, search?: string) {
    return this.prisma.party.findMany({
      where: {
        companyId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(companyId: string, dto: PartyDto) {
    return this.prisma.party.create({
      data: {
        companyId,
        name: dto.name,
        document: dto.document ?? null,
        kind: dto.kind ?? PartyKind.AMBOS,
      },
    });
  }

  async update(userId: string, id: string, dto: Partial<PartyDto>) {
    const party = await this.prisma.party.findUnique({ where: { id } });
    if (!party) throw new NotFoundException('Fornecedor/cliente não encontrado');
    await assertUserBelongsToCompany(this.prisma, userId, party.companyId);

    return this.prisma.party.update({
      where: { id },
      data: { name: dto.name, document: dto.document, kind: dto.kind },
    });
  }

  async remove(userId: string, id: string) {
    const party = await this.prisma.party.findUnique({ where: { id } });
    if (!party) throw new NotFoundException('Fornecedor/cliente não encontrado');
    await assertUserBelongsToCompany(this.prisma, userId, party.companyId);

    await this.prisma.party.delete({ where: { id } });
    return { success: true };
  }
}
