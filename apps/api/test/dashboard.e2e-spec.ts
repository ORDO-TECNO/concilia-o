/**
 * e2e: resumo do dashboard — totais por mês e por categoria, excluindo
 * lançamentos ignorados/duplicados.
 */
import { ImportSource, ReconciliationStatus, TransactionType } from '@prisma/client';
import { api, bootApp, createTenant, destroyTenant, type E2EContext, type E2ETenant } from './helpers';

describe('Dashboard summary', () => {
  let ctx: E2EContext;
  let tenant: E2ETenant;

  beforeAll(async () => {
    ctx = await bootApp();
    tenant = await createTenant(ctx.app, 'dashboard');
    const { prisma } = ctx;
    const ba = await prisma.bankAccount.create({ data: { companyId: tenant.companyId, conta: '1' } });
    const vendas = await prisma.category.create({
      data: { companyId: tenant.companyId, name: 'Vendas', kind: 'RECEITA', dfcLine: 'RECEBIMENTOS_CLIENTES' },
    });
    const aluguel = await prisma.category.create({
      data: { companyId: tenant.companyId, name: 'Aluguel', kind: 'DESPESA', dfcLine: 'DESPESAS_FIXAS' },
    });

    const rows: [string, number, string | null, ReconciliationStatus][] = [
      ['2026-01-05', 1000, vendas.id, 'PENDENTE'],
      ['2026-01-06', -300, aluguel.id, 'CONCILIADO'],
      ['2026-01-07', 50, aluguel.id, 'PENDENTE'], // estorno parcial
      ['2026-01-08', -40, null, 'PENDENTE'],
      ['2026-02-01', -999, aluguel.id, 'IGNORADO'],
      ['2026-02-02', 999, vendas.id, 'DUPLICADO'],
      ['2026-02-03', 200.1, vendas.id, 'PENDENTE'],
      ['2025-12-31', 5000, vendas.id, 'PENDENTE'],
    ];
    await prisma.transaction.createMany({
      data: rows.map(([date, amount, categoryId, status], i) => ({
        companyId: tenant.companyId,
        bankAccountId: ba.id,
        date: new Date(date),
        description: `T${i}`,
        amount,
        type: amount >= 0 ? TransactionType.CREDITO : TransactionType.DEBITO,
        competenceYear: Number(date.slice(0, 4)),
        competenceMonth: Number(date.slice(5, 7)),
        origin: ImportSource.CSV,
        dedupeHash: `dash-${tenant.companyId}-${i}`,
        categoryId,
        status,
      })),
    });
  });

  afterAll(async () => {
    await destroyTenant(ctx.prisma, tenant);
    await ctx.app.close();
  });

  it('soma entradas/saídas por mês e ranqueia categorias, sem ignorados/duplicados', async () => {
    const res = await api(ctx.app, tenant.token).get(`/companies/${tenant.companyId}/dashboard/summary?year=2026`);
    expect(res.status).toBe(200);

    expect(res.body.monthly[0]).toEqual({ month: 1, receitas: 1050, despesas: 340, saldo: 710 });
    expect(res.body.monthly[1]).toEqual({ month: 2, receitas: 200.1, despesas: 0, saldo: 200.1 });
    expect(res.body.monthly[2]).toEqual({ month: 3, receitas: 0, despesas: 0, saldo: 0 });

    expect(res.body.topCategories).toEqual([
      { name: 'Vendas', total: 1200.1 },
      { name: 'Aluguel', total: 350 },
    ]);
    expect(res.body.categoryDistribution).toEqual([
      { name: 'Vendas', value: 1200.1 },
      { name: 'Aluguel', value: 350 },
    ]);
  });

  it('rejeita ano inválido com 400', async () => {
    const res = await api(ctx.app, tenant.token).get(`/companies/${tenant.companyId}/dashboard/summary?year=abc`);
    expect(res.status).toBe(400);
  });
});
