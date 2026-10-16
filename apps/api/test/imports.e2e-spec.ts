/**
 * e2e: import endpoint — atomicity success path
 *
 * Boots the full Nest app, imports a small valid OFX file via HTTP, and
 * asserts the batch ends with status CONCLUIDO and correct counts.
 * This proves the transaction wrapping does not break the happy path.
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
import { ImportStatus } from '@prisma/client';

const RUN_ID = Date.now();

function email(label: string) {
  return `e2e-import-${label}-${RUN_ID}@test.local`;
}

// Minimal valid OFX with 2 transactions.
function makeOfxContent() {
  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<CURDEF>BRL
<BANKTRANLIST>
<DTSTART>20260101
<DTEND>20260131
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260110
<TRNAMT>500.00
<FITID>TRN-${RUN_ID}-1
<MEMO>Entrada de caixa
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260115
<TRNAMT>-200.00
<FITID>TRN-${RUN_ID}-2
<MEMO>Pagamento fornecedor
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
}

describe('Imports — atomicity success path', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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

    // Register user and create company
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Import Tester', email: email('user'), password: 'senha12345' });
    expect(reg.status).toBe(201);
    accessToken = reg.body.accessToken as string;
    createdUserIds.push(reg.body.user.id as string);

    const co = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Import Co ${RUN_ID}` });
    expect(co.status).toBe(201);
    companyId = co.body.id as string;
    createdCompanyIds.push(companyId);

    const ba = await prisma.bankAccount.create({
      data: { companyId, conta: `8888-${RUN_ID}`, apelido: 'Import Test Account' },
    });
    bankAccountId = ba.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { companyId } });
    await prisma.importBatchPeriod.deleteMany({
      where: { importBatch: { companyId } },
    });
    await prisma.importBatch.deleteMany({ where: { companyId } });
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

  it('imports an OFX file and returns a CONCLUIDO batch with correct counts', async () => {
    const ofxContent = makeOfxContent();

    const res = await request(app.getHttpServer())
      .post(`/companies/${companyId}/imports`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('bankAccountId', bankAccountId)
      .field('source', 'OFX')
      .attach('file', Buffer.from(ofxContent, 'utf-8'), {
        filename: 'extrato.ofx',
        contentType: 'application/octet-stream',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(ImportStatus.CONCLUIDO);
    expect(res.body.totalRecords).toBe(2);
    expect(res.body.newRecords).toBe(2);
    expect(res.body.duplicateRecords).toBe(0);

    // Transactions must be persisted in the DB
    const txCount = await prisma.transaction.count({ where: { companyId } });
    expect(txCount).toBe(2);
  });

  it('returns duplicateRecords > 0 on re-import of the same file', async () => {
    const ofxContent = makeOfxContent();

    const res = await request(app.getHttpServer())
      .post(`/companies/${companyId}/imports`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('bankAccountId', bankAccountId)
      .field('source', 'OFX')
      .attach('file', Buffer.from(ofxContent, 'utf-8'), {
        filename: 'extrato.ofx',
        contentType: 'application/octet-stream',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(ImportStatus.CONCLUIDO);
    expect(res.body.newRecords).toBe(0);
    expect(res.body.duplicateRecords).toBe(2);
  });

  function importCsv(content: string) {
    return request(app.getHttpServer())
      .post(`/companies/${companyId}/imports`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('bankAccountId', bankAccountId)
      .field('source', 'CSV')
      .field('dateColumn', 'Data')
      .field('descriptionColumn', 'Descricao')
      .field('amountColumn', 'Valor')
      .field('delimiter', ';')
      .attach('file', Buffer.from(content, 'utf-8'), {
        filename: 'extrato.csv',
        contentType: 'text/csv',
      });
  }

  it('keeps identical transactions of the same file (two equal fees on the same day)', async () => {
    const csv = ['Data;Descricao;Valor', '10/02/2026;TARIFA PIX;-2,50', '10/02/2026;TARIFA PIX;-2,50'].join('\n');

    const res = await importCsv(csv);
    expect(res.status).toBe(201);
    expect(res.body.newRecords).toBe(2);
    expect(res.body.duplicateRecords).toBe(0);

    const again = await importCsv(csv);
    expect(again.status).toBe(201);
    expect(again.body.newRecords).toBe(0);
    expect(again.body.duplicateRecords).toBe(2);
    expect(again.body.periods).toEqual([expect.objectContaining({ year: 2026, month: 2, recordCount: 0 })]);
  });

  it('inserts only the new occurrence when an overlapping statement has one more equal fee', async () => {
    const csv = [
      'Data;Descricao;Valor',
      '10/02/2026;TARIFA PIX;-2,50',
      '10/02/2026;TARIFA PIX;-2,50',
      '10/02/2026;TARIFA PIX;-2,50',
    ].join('\n');

    const res = await importCsv(csv);
    expect(res.status).toBe(201);
    expect(res.body.newRecords).toBe(1);
    expect(res.body.duplicateRecords).toBe(2);
  });

  it('counts balance lines as ignored instead of importing them', async () => {
    const csv = ['Data;Descricao;Valor', '28/02/2026;SALDO ANTERIOR;1000,00', '28/02/2026;PIX RECEBIDO;50,00'].join('\n');

    const res = await importCsv(csv);
    expect(res.status).toBe(201);
    expect(res.body.totalRecords).toBe(2);
    expect(res.body.newRecords).toBe(1);
    expect(res.body.ignoredRecords).toBe(1);
    expect(res.body.duplicateRecords).toBe(0);
  });

  it('history does not ship the raw file content', async () => {
    const res = await request(app.getHttpServer())
      .get(`/companies/${companyId}/imports`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty('rawContent');
    expect(res.body[0]).toHaveProperty('newRecords');
  });
});
