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
});
