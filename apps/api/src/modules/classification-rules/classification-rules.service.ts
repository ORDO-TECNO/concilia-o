import { Injectable, NotFoundException } from '@nestjs/common';
import { CategorySource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { ClassificationRuleDto } from './dto/classification-rule.dto';
import { ruleMatches } from './rule-matcher';

@Injectable()
export class ClassificationRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.classificationRule.findMany({
      where: { companyId },
      include: { category: true, party: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(companyId: string, dto: ClassificationRuleDto) {
    return this.prisma.classificationRule.create({
      data: {
        companyId,
        name: dto.name,
        field: dto.field,
        matchType: dto.matchType,
        pattern: dto.pattern,
        categoryId: dto.categoryId ?? null,
        partyId: dto.partyId ?? null,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(userId: string, id: string, dto: Partial<ClassificationRuleDto>) {
    const rule = await this.prisma.classificationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, rule.companyId);

    return this.prisma.classificationRule.update({
      where: { id },
      data: {
        name: dto.name,
        field: dto.field,
        matchType: dto.matchType,
        pattern: dto.pattern,
        categoryId: dto.categoryId,
        partyId: dto.partyId,
        priority: dto.priority,
        isActive: dto.isActive,
      },
    });
  }

  async remove(userId: string, id: string) {
    const rule = await this.prisma.classificationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, rule.companyId);

    await this.prisma.classificationRule.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Aplica as regras ativas (maior prioridade primeiro, primeira que bater
   * "vence") a transações PENDENTE sem categoria — usado tanto logo após a
   * importação (escopo = ids do lote) quanto na reaplicação manual.
   */
  async applyToTransactions(companyId: string, transactionIds?: string[]) {
    const rules = await this.prisma.classificationRule.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    if (rules.length === 0) return { appliedCount: 0 };

    const transactions = await this.prisma.transaction.findMany({
      where: {
        companyId,
        categoryId: null,
        status: 'PENDENTE',
        ...(transactionIds ? { id: { in: transactionIds } } : {}),
      },
      select: { id: true, description: true, historico: true, document: true },
    });

    let appliedCount = 0;
    for (const t of transactions) {
      const match = rules.find((r) => ruleMatches(r, t));
      if (!match) continue;

      await this.prisma.transaction.update({
        where: { id: t.id },
        data: {
          categoryId: match.categoryId,
          partyId: match.partyId ?? undefined,
          categorySource: CategorySource.REGRA,
          appliedRuleId: match.id,
        },
      });
      appliedCount++;
    }

    return { appliedCount };
  }
}
