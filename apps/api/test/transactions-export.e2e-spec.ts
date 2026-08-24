/**
 * e2e: transactions export cursor pagination correctness
 *
 * Seeds 25 transactions with deliberately shuffled dates (so date-desc order
 * does NOT match insertion/id order), then drives `fetchExportBatches` with a
 * batch size of 10 — forcing three page fetches.
 *
 * Asserts:
 *   1. Total row count == 25 (no rows skipped or duplicated across pages).
 *   2. All descriptions are unique (no duplicates).
 *
 * This test would fail with the old `WHERE id > cursor` approach because
 * date-desc ordering means rows within a page boundary are not monotonically
 * related to id order — the filter would skip rows whose ids fall below the
 * cursor value but whose dates place them after the boundary.
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
import { TransactionsService } from '../src/modules/transactions/transactions.service';
import { ImportSource, TransactionType } from '@prisma/client';

const RUN_ID = Date.now();

function email(label: string) {
  return `e2e-export-${label}-${RUN_ID}@test.local`;
}

describe('Transactions export — cursor pagination correctness', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: TransactionsService;
  let accessToken: string;
  let companyId: string;
  let bankAccountId: string;

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
    service = moduleRef.get(TransactionsService);

    // Register user + company
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Export Tester', email: email('user'), password: 'senha12345' });
    expect(reg.status).toBe(201);
    accessToken = reg.body.accessToken as string;
    createdUserIds.push(reg.body.user.id as string);

    const co = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Export Co ${RUN_ID}` });
    expect(co.status).toBe(201);
    companyId = co.body.id as string;
    createdCompanyIds.push(companyId);

    // Create bank account directly via Prisma (no public endpoint needed)
    const ba = await prisma.bankAccount.create({
      data: { companyId, conta: `9999-${RUN_ID}`, apelido: 'Test Account' },
    });
    bankAccountId = ba.id;

    // Seed 25 transactions with deliberately shuffled dates:
    // row i=0 gets day 25, row i=24 gets day 1.
    // This means date-desc ordering is the REVERSE of insertion order, so
    // the natural id sequence and the date-desc sequence are opposite —
    // a naive `WHERE id > cursor` would skip rows across page boundaries.
    const BASE_DATE = new Date('2026-01-01');
    await prisma.transaction.createMany({
      data: Array.from({ length: 25 }, (_, i) => {
        const date = new Date(BASE_DATE);
        date.setDate(1 + (24 - i)); // i=0 → day 25; i=24 → day 1
        return {
          companyId,
          bankAccountId,
          date,
          description: `Tx-${String(i).padStart(2, '0')}`,
          amount: 100 + i,
          type: TransactionType.CREDITO,
          competenceYear: 2026,
          competenceMonth: 1,
          origin: ImportSource.CSV,
          dedupeHash: `hash-export-${RUN_ID}-${i}`,
        };
      }),
    });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { companyId } });
    await prisma.bankAccount.deleteMany({ where: { companyId } });
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

  it('fetches all 25 rows with no duplicates across pages (date-desc, batch 10)', async () => {
    const where = { companyId };
    const allRows: import('../src/common/export/table-export').ExportRow[] = [];

    // batchSize=10 forces 3 page fetches for 25 rows — exercises multi-page cursor logic
    for await (const batch of service['fetchExportBatches'](where, 'date', 'desc', 10)) {
      allRows.push(...batch);
    }

    expect(allRows).toHaveLength(25);

    // Description (col index 1) maps 1:1 to the seeded Tx-00..Tx-24 labels
    const descriptions = allRows.map((r) => r[1] as string);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(25);
  });

  it('fetches all 25 rows with no duplicates across pages (amount-asc, batch 10)', async () => {
    const where = { companyId };
    const allRows: import('../src/common/export/table-export').ExportRow[] = [];

    for await (const batch of service['fetchExportBatches'](where, 'amount', 'asc', 10)) {
      allRows.push(...batch);
    }

    expect(allRows).toHaveLength(25);

    const descriptions = allRows.map((r) => r[1] as string);
    expect(new Set(descriptions).size).toBe(25);
  });

  it('HTTP export endpoint returns 200 with CSV content-type for the seeded company', async () => {
    const res = await request(app.getHttpServer())
      .get(`/companies/${companyId}/transactions/export`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ format: 'csv', sortBy: 'date', sortDir: 'desc' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    // The response body should contain the header row
    expect(res.text).toContain('Data;Descrição');
  });
});
