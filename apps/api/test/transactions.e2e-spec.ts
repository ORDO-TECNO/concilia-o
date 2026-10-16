/**
 * e2e: edição e ações em lote de lançamentos — integridade entre empresas e
 * regras de classificação.
 */
import { ImportSource, TransactionType } from '@prisma/client';
import { api, bootApp, createTenant, destroyTenant, type E2EContext, type E2ETenant } from './helpers';

describe('Transactions', () => {
  let ctx: E2EContext;
  let tenant: E2ETenant;
  let other: E2ETenant;
  let bankAccountId: string;
  let leafId: string;
  let groupId: string;
  let foreignCategoryId: string;
  let foreignPartyId: string;
  let seq = 0;

  async function newTransaction(overrides: Record<string, unknown> = {}) {
    seq++;
    return ctx.prisma.transaction.create({
      data: {
        companyId: tenant.companyId,
        bankAccountId,
        date: new Date('2026-03-10'),
        description: `LANCAMENTO ${seq}`,
        amount: -100,
        type: TransactionType.DEBITO,
        competenceYear: 2026,
        competenceMonth: 3,
        origin: ImportSource.CSV,
        dedupeHash: `tx-${tenant.companyId}-${seq}`,
        ...overrides,
      },
    });
  }

  beforeAll(async () => {
    ctx = await bootApp();
    tenant = await createTenant(ctx.app, 'transactions');
    other = await createTenant(ctx.app, 'transactions-other');
    const { prisma } = ctx;
    bankAccountId = (await prisma.bankAccount.create({ data: { companyId: tenant.companyId, conta: '1' } })).id;
    const group = await prisma.category.create({ data: { companyId: tenant.companyId, name: 'Despesas', kind: 'DESPESA' } });
    groupId = group.id;
    leafId = (
      await prisma.category.create({
        data: { companyId: tenant.companyId, name: 'Folha', kind: 'DESPESA', dfcLine: 'FOLHA', parentId: group.id },
      })
    ).id;
    foreignCategoryId = (
      await prisma.category.create({
        data: { companyId: other.companyId, name: 'Alheia', kind: 'DESPESA', dfcLine: 'FOLHA' },
      })
    ).id;
    foreignPartyId = (await prisma.party.create({ data: { companyId: other.companyId, name: 'Fornecedor alheio' } })).id;
  });

  afterAll(async () => {
    await destroyTenant(ctx.prisma, tenant);
    await destroyTenant(ctx.prisma, other);
    await ctx.app.close();
  });

  describe('PATCH /transactions/:id', () => {
    it('classifica numa folha da própria empresa', async () => {
      const t = await newTransaction();
      const res = await api(ctx.app, tenant.token).patch(`/transactions/${t.id}`).send({ categoryId: leafId });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ categoryId: leafId, categorySource: 'MANUAL' });
    });

    it('rejeita categoria de outra empresa', async () => {
      const t = await newTransaction();
      const res = await api(ctx.app, tenant.token).patch(`/transactions/${t.id}`).send({ categoryId: foreignCategoryId });
      expect(res.status).toBe(400);
    });

    it('rejeita categoria agrupadora', async () => {
      const t = await newTransaction();
      const res = await api(ctx.app, tenant.token).patch(`/transactions/${t.id}`).send({ categoryId: groupId });
      expect(res.status).toBe(400);
    });

    it('rejeita fornecedor/cliente de outra empresa', async () => {
      const t = await newTransaction();
      const res = await api(ctx.app, tenant.token).patch(`/transactions/${t.id}`).send({ partyId: foreignPartyId });
      expect(res.status).toBe(400);
    });
  });

  describe('POST bulk', () => {
    const bulk = (body: Record<string, unknown>) =>
      api(ctx.app, tenant.token).post(`/companies/${tenant.companyId}/transactions/bulk`).send(body);

    it('CATEGORIZAR rejeita categoria de outra empresa', async () => {
      const t = await newTransaction();
      const res = await bulk({ ids: [t.id], action: 'CATEGORIZAR', categoryId: foreignCategoryId });
      expect(res.status).toBe(400);
    });

    it('CATEGORIZAR rejeita categoria agrupadora', async () => {
      const t = await newTransaction();
      const res = await bulk({ ids: [t.id], action: 'CATEGORIZAR', categoryId: groupId });
      expect(res.status).toBe(400);
    });
  });
});
