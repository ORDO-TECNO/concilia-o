/**
 * e2e: documentação servida pela API (manual interativo).
 */
import request from 'supertest';
import { bootApp, type E2EContext } from './helpers';

describe('Docs', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await bootApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('serve o manual em /docs/ledger-manual sem autenticação', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/docs/ledger-manual');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Manual do Ledger</title>');
  });

  it('/docs redireciona para o manual', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/docs');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/docs/ledger-manual');
  });
});
