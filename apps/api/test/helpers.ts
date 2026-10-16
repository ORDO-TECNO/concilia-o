import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

export interface E2EContext {
  app: INestApplication;
  prisma: PrismaService;
}

/** Sobe o app com a mesma configuração global de main.ts. */
export async function bootApp(): Promise<E2EContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return { app, prisma: moduleRef.get(PrismaService) };
}

export interface E2ETenant {
  userId: string;
  token: string;
  companyId: string;
}

/** Registra um usuário novo e cria uma empresa para ele. */
export async function createTenant(app: INestApplication, label: string): Promise<E2ETenant> {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name: `E2E ${label}`, email: `e2e-${label}-${runId}@test.local`, password: 'senha12345' });
  if (reg.status !== 201) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  const token = reg.body.accessToken as string;

  const co = await request(app.getHttpServer())
    .post('/companies')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `E2E ${label} ${runId}` });
  if (co.status !== 201) throw new Error(`company failed: ${co.status} ${JSON.stringify(co.body)}`);

  return { userId: reg.body.user.id as string, token, companyId: co.body.id as string };
}

/** Remove tudo que o tenant criou (empresa em cascata + usuário). */
export async function destroyTenant(prisma: PrismaService, tenant: E2ETenant): Promise<void> {
  await prisma.transaction.deleteMany({ where: { companyId: tenant.companyId } });
  await prisma.classificationRule.deleteMany({ where: { companyId: tenant.companyId } });
  await prisma.category.updateMany({ where: { companyId: tenant.companyId }, data: { parentId: null } });
  await prisma.company.deleteMany({ where: { id: tenant.companyId } });
  await prisma.user.deleteMany({ where: { id: tenant.userId } });
}

export function api(app: INestApplication, token: string) {
  const server = app.getHttpServer();
  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
  return {
    get: (url: string) => auth(request(server).get(url)),
    post: (url: string) => auth(request(server).post(url)),
    patch: (url: string) => auth(request(server).patch(url)),
    delete: (url: string) => auth(request(server).delete(url)),
  };
}
