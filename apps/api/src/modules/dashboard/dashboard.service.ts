import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CASHFLOW_EXCLUDED_STATUSES } from '@conciliacao/shared';
import { PrismaService } from '../../prisma/prisma.service';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Agrega no banco em vez de carregar todos os lançamentos do ano em memória.
   * Entradas e saídas são somadas separadamente (por sinal) tanto por mês
   * quanto por categoria — o total de uma categoria é o volume movimentado
   * (|entradas| + |saídas|), não o saldo líquido.
   */
  async getSummary(companyId: string, year: number) {
    const base: Prisma.TransactionWhereInput = {
      companyId,
      competenceYear: year,
      status: { notIn: [...CASHFLOW_EXCLUDED_STATUSES] },
    };
    const credits: Prisma.TransactionWhereInput = { ...base, amount: { gt: 0 } };
    const debits: Prisma.TransactionWhereInput = { ...base, amount: { lt: 0 } };

    const [creditsByMonth, debitsByMonth, creditsByCategory, debitsByCategory] = await Promise.all([
      this.prisma.transaction.groupBy({ by: ['competenceMonth'], where: credits, _sum: { amount: true } }),
      this.prisma.transaction.groupBy({ by: ['competenceMonth'], where: debits, _sum: { amount: true } }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...credits, categoryId: { not: null } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...debits, categoryId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, receitas: 0, despesas: 0, saldo: 0 }));
    for (const g of creditsByMonth) monthly[g.competenceMonth - 1].receitas = round2(Number(g._sum.amount ?? 0));
    for (const g of debitsByMonth) monthly[g.competenceMonth - 1].despesas = round2(Math.abs(Number(g._sum.amount ?? 0)));
    for (const m of monthly) m.saldo = round2(m.receitas - m.despesas);

    const volumeByCategory = new Map<string, number>();
    for (const g of [...creditsByCategory, ...debitsByCategory]) {
      const id = g.categoryId as string;
      volumeByCategory.set(id, round2((volumeByCategory.get(id) ?? 0) + Math.abs(Number(g._sum.amount ?? 0))));
    }

    const categories = await this.prisma.category.findMany({
      where: { id: { in: [...volumeByCategory.keys()] } },
      select: { id: true, name: true },
    });
    const sortedCategories = categories
      .map((c) => ({ name: c.name, total: volumeByCategory.get(c.id) ?? 0 }))
      .sort((a, b) => b.total - a.total);

    const topCategories = sortedCategories.slice(0, 5);
    const restTotal = round2(sortedCategories.slice(6).reduce((sum, c) => sum + c.total, 0));
    const categoryDistribution = [
      ...sortedCategories.slice(0, 6).map((c) => ({ name: c.name, value: c.total })),
      ...(restTotal > 0 ? [{ name: 'Outros', value: restTotal }] : []),
    ];

    return { year, monthly, topCategories, categoryDistribution };
  }
}
