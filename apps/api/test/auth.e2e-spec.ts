/**
 * e2e: auth flow + tenant isolation
 *
 * Boots the Nest app with the full AppModule (real Postgres via DATABASE_URL
 * from .env / environment). Each test run uses unique e-mails so parallel runs
 * don't collide. The test cleans up the rows it creates in afterAll.
 *
 * To run: npm --workspace=apps/api run test:e2e
 */
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

// Unique suffix so concurrent runs don't collide.
const RUN_ID = Date.now();

function email(label: string) {
  return `e2e-${label}-${RUN_ID}@test.local`;
}

describe('Auth e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];
  const createdCompanyIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up e2e rows in dependency order.
    if (createdCompanyIds.length > 0) {
      await prisma.userCompany.deleteMany({ where: { companyId: { in: createdCompanyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: createdCompanyIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await app.close();
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 — cria usuário e retorna access token + cookie de refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'E2E User', email: email('reg'), password: 'senha12345' });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(email('reg'));
      expect(res.headers['set-cookie']).toBeDefined();

      createdUserIds.push(res.body.user.id);
    });

    it('409 — rejeita e-mail duplicado', async () => {
      const dupEmail = email('dup');
      const first = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Dup', email: dupEmail, password: 'senha12345' });
      createdUserIds.push(first.body.user.id);

      const second = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Dup2', email: dupEmail, password: 'senha12345' });

      expect(second.status).toBe(409);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('200 — retorna tokens em login com senha correta', async () => {
      // Register first so we have a known user.
      const loginEmail = email('login');
      const reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Login User', email: loginEmail, password: 'senha12345' });
      createdUserIds.push(reg.body.user.id);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: loginEmail, password: 'senha12345' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('401 — rejeita senha errada', async () => {
      const loginEmail = email('wrongpw');
      const reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'WrongPw', email: loginEmail, password: 'senha12345' });
      createdUserIds.push(reg.body.user.id);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: loginEmail, password: 'wrong' });

      expect(res.status).toBe(401);
    });
  });

  // ── tenant isolation ──────────────────────────────────────────────────────

  describe('Tenant isolation: GET /companies/:companyId/transactions', () => {
    it('403 — usuário sem associação à empresa recebe Forbidden', async () => {
      // Create two users: owner (with company) and outsider.
      const ownerEmail = email('owner');
      const outsiderEmail = email('outsider');

      const ownerReg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Owner', email: ownerEmail, password: 'senha12345' });
      createdUserIds.push(ownerReg.body.user.id);

      const outsiderReg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Outsider', email: outsiderEmail, password: 'senha12345' });
      createdUserIds.push(outsiderReg.body.user.id);

      const ownerToken: string = ownerReg.body.accessToken;
      const outsiderToken: string = outsiderReg.body.accessToken;

      // Owner creates a company.
      const companyRes = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `E2E Co ${RUN_ID}` });
      expect(companyRes.status).toBe(201);
      const companyId: string = companyRes.body.id;
      createdCompanyIds.push(companyId);

      // Owner can access their own company's transactions.
      const ownerAccess = await request(app.getHttpServer())
        .get(`/companies/${companyId}/transactions`)
        .set('Authorization', `Bearer ${ownerToken}`);
      // 200 or 400 (no query params) — but NOT 401/403.
      expect(ownerAccess.status).not.toBe(401);
      expect(ownerAccess.status).not.toBe(403);

      // Outsider must be denied.
      const outsiderAccess = await request(app.getHttpServer())
        .get(`/companies/${companyId}/transactions`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      expect(outsiderAccess.status).toBe(403);
    });
  });
});
