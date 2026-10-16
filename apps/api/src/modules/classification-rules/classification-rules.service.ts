import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CategorySource, RuleMatchType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { assertAssignableCategory, assertPartyBelongsToCompany } from '../../common/domain/assignable';
import { ClassificationRuleDto, UpdateClassificationRuleDto } from './dto/classification-rule.dto';
import { resolveClassification } from './rule-matcher';

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

  /** Valida o estado final da regra (já mesclado com o que está gravado, no caso do PATCH). */
  private async validate(
    companyId: string,
    rule: { matchType?: RuleMatchType; pattern: string; categoryId?: string | null; partyId?: string | null },
  ) {
    if (!rule.categoryId && !rule.partyId) {
      throw new BadRequestException('A regra precisa definir uma categoria e/ou um fornecedor/cliente');
    }
    if (rule.matchType === RuleMatchType.REGEX) {
      try {
        new RegExp(rule.pattern, 'i');
      } catch {
        throw new BadRequestException('Expressão regular inválida');
      }
    }
    if (rule.categoryId) await assertAssignableCategory(this.prisma, companyId, rule.categoryId);
    if (rule.partyId) await assertPartyBelongsToCompany(this.prisma, companyId, rule.partyId);
  }

  async create(companyId: string, dto: ClassificationRuleDto) {
    await this.validate(companyId, dto);
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

  async update(userId: string, id: string, dto: UpdateClassificationRuleDto) {
    const rule = await this.prisma.classificationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, rule.companyId);
    await this.validate(rule.companyId, {
      matchType: dto.matchType ?? rule.matchType,
      pattern: dto.pattern ?? rule.pattern,
      categoryId: dto.categoryId !== undefined ? dto.categoryId : rule.categoryId,
      partyId: dto.partyId !== undefined ? dto.partyId : rule.partyId,
    });

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
      select: { id: true, description: true, historico: true, document: true, partyId: true },
    });

    // Agrupa lançamentos com o mesmo resultado para gravar com um updateMany
    // por combinação (regra, categoria, fornecedor) em vez de um UPDATE por linha.
    const batches = new Map<string, { categoryId: string | null; partyId: string | null; ruleId: string; ids: string[] }>();
    for (const t of transactions) {
      const resolution = resolveClassification(rules, t);
      if (!resolution) continue;
      const key = `${resolution.ruleId}|${resolution.categoryId}|${resolution.partyId}`;
      if (!batches.has(key)) batches.set(key, { ...resolution, ids: [] });
      batches.get(key)!.ids.push(t.id);
    }

    let appliedCount = 0;
    await this.prisma.$transaction(
      [...batches.values()].map((batch) => {
        appliedCount += batch.ids.length;
        return this.prisma.transaction.updateMany({
          where: { id: { in: batch.ids } },
          data: {
            ...(batch.categoryId
              ? { categoryId: batch.categoryId, categorySource: CategorySource.REGRA }
              : {}),
            ...(batch.partyId ? { partyId: batch.partyId } : {}),
            appliedRuleId: batch.ruleId,
          },
        });
      }),
    );

    return { appliedCount };
  }
}
