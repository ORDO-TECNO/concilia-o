/**
 * e2e: cadastro e aplicação de regras de classificação.
 */
import { ImportSource, TransactionType } from '@prisma/client';
import { api, bootApp, createTenant, destroyTenant, type E2EContext, type E2ETenant } from './helpers';

describe('Classification rules', () => {
  let ctx: E2EContext;
  let tenant: E2ETenant;
  let other: E2ETenant;
  let bankAccountId: string;
  let leafId: string;
  let seq = 0;

  const createRule = (body: Record<string, unknown>) =>
    api(ctx.app, tenant.token).post(`/companies/${tenant.companyId}/rules`).send(body);

  async function newTransaction(description: string) {
    seq++;
    return ctx.prisma.transaction.create({
      data: {
        companyId: tenant.companyId,
        bankAccountId,
        date: new Date('2026-05-10'),
        description,
        amount: -50,
        type: TransactionType.DEBITO,
        competenceYear: 2026,
        competenceMonth: 5,
        origin: ImportSource.CSV,
        dedupeHash: `rule-${tenant.companyId}-${seq}`,
      },
    });
  }

  beforeAll(async () => {
    ctx = await bootApp();
    tenant = await createTenant(ctx.app, 'rules');
    other = await createTenant(ctx.app, 'rules-other');
    bankAccountId = (await ctx.prisma.bankAccount.create({ data: { companyId: tenant.companyId, conta: '1' } })).id;
    leafId = (
      await ctx.prisma.category.create({
        data: { companyId: tenant.companyId, name: 'Energia', kind: 'DESPESA', dfcLine: 'DESPESAS_FIXAS' },
      })
    ).id;
  });

  afterAll(async () => {
    await destroyTenant(ctx.prisma, tenant);
    await destroyTenant(ctx.prisma, other);
    await ctx.app.close();
  });

  it('PATCH aceita atualização parcial (ex: só desativar)', async () => {
    const rule = await createRule({ name: 'Energisa', pattern: 'ENERGISA', categoryId: leafId });
    expect(rule.status).toBe(201);
    const res = await api(ctx.app, tenant.token).patch(`/rules/${rule.body.id}`).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isActive: false, pattern: 'ENERGISA' });
  });
});
