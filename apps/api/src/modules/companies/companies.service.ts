import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.userCompany.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({ id: m.company.id, name: m.company.name, cnpj: m.company.cnpj, role: m.role }));
  }

  async create(userId: string, dto: CompanyDto) {
    const company = await this.prisma.company.create({
      data: { name: dto.name, cnpj: dto.cnpj ?? null },
    });
    await this.prisma.userCompany.create({
      data: { userId, companyId: company.id, role: 'ADMIN' },
    });
    return company;
  }

  async findOne(companyId: string) {
    return this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  }

  async update(companyId: string, dto: Partial<CompanyDto>) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { name: dto.name, cnpj: dto.cnpj },
    });
  }
}
