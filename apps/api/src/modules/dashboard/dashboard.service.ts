import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(companyId: string, year: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: { companyId, competenceYear: year, status: { not: 'IGNORADO' } },
      include: { category: true },
    });

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      receitas: 0,
      despesas: 0,
      saldo: 0,
    }));

    const categoryTotals = new Map<string, { name: string; total: number }>();

    for (const t of transactions) {
      const amount = Number(t.amount);
      const bucket = monthly[t.competenceMonth - 1];
      if (amount >= 0) bucket.receitas += amount;
      else bucket.despesas += Math.abs(amount);
      bucket.saldo += amount;

      if (t.categoryId && t.category) {
        const key = t.categoryId;
        if (!categoryTotals.has(key)) categoryTotals.set(key, { name: t.category.name, total: 0 });
        categoryTotals.get(key)!.total += Math.abs(amount);
      }
    }

    const sortedCategories = [...categoryTotals.values()].sort((a, b) => b.total - a.total);
    const topCategories = sortedCategories.slice(0, 5);

    const topSix = sortedCategories.slice(0, 6);
    const restTotal = sortedCategories.slice(6).reduce((sum, c) => sum + c.total, 0);
    const categoryDistribution = [
      ...topSix.map((c) => ({ name: c.name, value: Math.round(c.total * 100) / 100 })),
      ...(restTotal > 0 ? [{ name: 'Outros', value: Math.round(restTotal * 100) / 100 }] : []),
    ];

    return {
      year,
      monthly: monthly.map((m) => ({
        month: m.month,
        receitas: Math.round(m.receitas * 100) / 100,
        despesas: Math.round(m.despesas * 100) / 100,
        saldo: Math.round(m.saldo * 100) / 100,
      })),
      topCategories,
      categoryDistribution,
    };
  }
}
