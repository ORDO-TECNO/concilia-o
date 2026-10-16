/**
 * e2e: cadastro de contas bancárias.
 */
import { ImportSource, TransactionType } from '@prisma/client';
import { api, bootApp, createTenant, destroyTenant, type E2EContext, type E2ETenant } from './helpers';

describe('Bank accounts', () => {
  let ctx: E2EContext;
  let tenant: E2ETenant;

  const create = (body: Record<string, unknown>) =>
    api(ctx.app, tenant.token).post(`/companies/${tenant.companyId}/bank-accounts`).send(body);

  beforeAll(async () => {
    ctx = await bootApp();
    tenant = await createTenant(ctx.app, 'bank-accounts');
  });

  afterAll(async () => {
    await destroyTenant(ctx.prisma, tenant);
    await ctx.app.close();
  });

  it('exclui conta sem histórico', async () => {
    const account = await create({ conta: '111' });
    expect((await api(ctx.app, tenant.token).delete(`/bank-accounts/${account.body.id}`)).status).toBe(200);
  });

  it('não exclui conta com lançamentos (a cascata apagaria o histórico)', async () => {
    const account = await create({ conta: '222' });
    await ctx.prisma.transaction.create({
      data: {
        companyId: tenant.companyId,
        bankAccountId: account.body.id,
        date: new Date('2026-01-01'),
        description: 'X',
        amount: 1,
        type: TransactionType.CREDITO,
        competenceYear: 2026,
        competenceMonth: 1,
        origin: ImportSource.CSV,
        dedupeHash: `ba-${account.body.id}`,
      },
    });

    const res = await api(ctx.app, tenant.token).delete(`/bank-accounts/${account.body.id}`);
    expect(res.status).toBe(400);
    expect(await ctx.prisma.transaction.count({ where: { bankAccountId: account.body.id } })).toBe(1);
  });
});
