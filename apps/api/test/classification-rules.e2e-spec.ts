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

  it.each([
    ['sem categoria nem fornecedor', () => ({ name: 'Vazia', pattern: 'X' })],
    ['com regex inválida', () => ({ name: 'Regex', pattern: '(', matchType: 'REGEX', categoryId: leafId })],
  ])('rejeita regra %s', async (_label, body) => {
    expect((await createRule(body())).status).toBe(400);
  });

  it('rejeita categoria ou fornecedor de outra empresa', async () => {
    const foreignCat = await ctx.prisma.category.create({
      data: { companyId: other.companyId, name: 'Alheia', kind: 'DESPESA', dfcLine: 'FOLHA' },
    });
    const foreignParty = await ctx.prisma.party.create({ data: { companyId: other.companyId, name: 'Alheio' } });
    expect((await createRule({ name: 'A', pattern: 'A', categoryId: foreignCat.id })).status).toBe(400);
    expect((await createRule({ name: 'B', pattern: 'B', partyId: foreignParty.id })).status).toBe(400);
  });

  it('PATCH não pode deixar a regra sem alvo', async () => {
    const rule = await createRule({ name: 'Luz', pattern: 'LUZ', categoryId: leafId });
    const res = await api(ctx.app, tenant.token).patch(`/rules/${rule.body.id}`).send({ categoryId: null });
    expect(res.status).toBe(400);
  });

  it('reaplicar classifica pendentes e não marca regra só-de-fornecedor como classificação', async () => {
    const party = await ctx.prisma.party.create({ data: { companyId: tenant.companyId, name: 'Energisa' } });
    await createRule({ name: 'Fornecedor', pattern: 'CEMIG', partyId: party.id, priority: 50 });
    await createRule({ name: 'Categoria', pattern: 'CONTA DE LUZ', categoryId: leafId, priority: 1 });
    const both = await newTransaction('CONTA DE LUZ CEMIG');
    const partyOnly = await newTransaction('CEMIG OUTROS');

    const res = await api(ctx.app, tenant.token).post(`/companies/${tenant.companyId}/rules/apply`);
    expect(res.status).toBe(201);

    const [a, b] = await Promise.all([
      ctx.prisma.transaction.findUnique({ where: { id: both.id } }),
      ctx.prisma.transaction.findUnique({ where: { id: partyOnly.id } }),
    ]);
    expect(a).toMatchObject({ categoryId: leafId, partyId: party.id, categorySource: 'REGRA' });
    expect(b).toMatchObject({ categoryId: null, partyId: party.id, categorySource: null });
  });
});
