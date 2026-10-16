/**
 * e2e: regras de negócio da árvore de categorias.
 */
import { api, bootApp, createTenant, destroyTenant, type E2EContext, type E2ETenant } from './helpers';

describe('Categories', () => {
  let ctx: E2EContext;
  let tenant: E2ETenant;
  let other: E2ETenant;

  const url = () => `/companies/${tenant.companyId}/categories`;
  const create = (body: Record<string, unknown>) => api(ctx.app, tenant.token).post(url()).send(body);

  beforeAll(async () => {
    ctx = await bootApp();
    tenant = await createTenant(ctx.app, 'categories');
    other = await createTenant(ctx.app, 'categories-other');
  });

  afterAll(async () => {
    await destroyTenant(ctx.prisma, tenant);
    await destroyTenant(ctx.prisma, other);
    await ctx.app.close();
  });

  it('PATCH aceita atualização parcial e permite desativar', async () => {
    const created = await create({ name: 'Energia', kind: 'DESPESA', dfcLine: 'DESPESAS_FIXAS' });
    expect(created.status).toBe(201);

    const renamed = await api(ctx.app, tenant.token).patch(`/categories/${created.body.id}`).send({ name: 'Energia elétrica' });
    expect(renamed.status).toBe(200);
    expect(renamed.body).toMatchObject({ name: 'Energia elétrica', kind: 'DESPESA', dfcLine: 'DESPESAS_FIXAS' });

    const deactivated = await api(ctx.app, tenant.token).patch(`/categories/${created.body.id}`).send({ isActive: false });
    expect(deactivated.status).toBe(200);
    const list = await api(ctx.app, tenant.token).get(`${url()}?flat=true`);
    expect(list.body.map((c: { id: string }) => c.id)).not.toContain(created.body.id);
  });

  it('não aceita como pai uma categoria de outra empresa', async () => {
    const foreign = await api(ctx.app, other.token)
      .post(`/companies/${other.companyId}/categories`)
      .send({ name: 'Alheia', kind: 'DESPESA' });
    const mine = await create({ name: 'Minha', kind: 'DESPESA', dfcLine: 'FOLHA' });

    const res = await api(ctx.app, tenant.token).patch(`/categories/${mine.body.id}`).send({ parentId: foreign.body.id });
    expect(res.status).toBe(400);
  });

  it('impede ciclos ao mover uma categoria para baixo de um descendente', async () => {
    const avo = await create({ name: 'Avô', kind: 'DESPESA' });
    const pai = await create({ name: 'Pai', kind: 'DESPESA', parentId: avo.body.id });
    const neto = await create({ name: 'Neto', kind: 'DESPESA', parentId: pai.body.id });

    const res = await api(ctx.app, tenant.token).patch(`/categories/${avo.body.id}`).send({ parentId: neto.body.id });
    expect(res.status).toBe(400);
  });

  it('exige linha da DFC compatível com o tipo da categoria', async () => {
    expect((await create({ name: 'Receita errada', kind: 'RECEITA', dfcLine: 'DIVIDENDOS' })).status).toBe(400);

    const ok = await create({ name: 'Receita certa', kind: 'RECEITA', dfcLine: 'OUTRAS_RECEITAS' });
    expect(ok.status).toBe(201);
    const changedKind = await api(ctx.app, tenant.token).patch(`/categories/${ok.body.id}`).send({ kind: 'DESPESA' });
    expect(changedKind.status).toBe(400);
  });
});
