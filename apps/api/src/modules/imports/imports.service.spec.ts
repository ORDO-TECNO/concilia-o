import { BadRequestException } from '@nestjs/common';
import { ImportSource, ImportStatus } from '@prisma/client';
import { ImportsService } from './imports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassificationRulesService } from '../classification-rules/classification-rules.service';

// Minimal OFX with one transaction so parsing succeeds and we reach the DB layer.
const MINIMAL_OFX = `OFXHEADER:100
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
<DTPOSTED>20260115
<TRNAMT>100.00
<FITID>TRN001
<MEMO>Test transaction
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

function buildImportRequestDto() {
  return {
    bankAccountId: 'ba-1',
    source: 'OFX' as ImportSource,
  };
}

function buildFile(content: string): Express.Multer.File {
  return {
    buffer: Buffer.from(content, 'utf-8'),
    originalname: 'test.ofx',
    mimetype: 'application/octet-stream',
    fieldname: 'file',
    encoding: '7bit',
    size: content.length,
    stream: null as never,
    destination: '',
    filename: '',
    path: '',
  };
}

function buildPrismaMock(overrides: Partial<Record<string, unknown>> = {}): PrismaService {
  const batchId = 'batch-1';

  return {
    bankAccount: {
      findUnique: jest.fn().mockResolvedValue({ id: 'ba-1', companyId: 'co-1', bankName: null, agencia: null, conta: '0001' }),
    },
    importBatch: {
      create: jest.fn().mockResolvedValue({ id: batchId }),
      update: jest.fn().mockResolvedValue({ id: batchId, status: ImportStatus.FALHOU }),
    },
    $transaction: jest.fn(),
    ...overrides,
  } as unknown as PrismaService;
}

function buildRulesMock(): ClassificationRulesService {
  return {
    applyToTransactions: jest.fn().mockResolvedValue(undefined),
  } as unknown as ClassificationRulesService;
}

describe('ImportsService — failure path', () => {
  it('marks batch as FALHOU with errorMessage and re-throws when $transaction rejects', async () => {
    const prisma = buildPrismaMock({
      $transaction: jest.fn().mockRejectedValue(new Error('DB exploded')),
    });
    const rules = buildRulesMock();
    const service = new ImportsService(prisma, rules);

    await expect(
      service.import('co-1', buildImportRequestDto(), buildFile(MINIMAL_OFX)),
    ).rejects.toThrow('DB exploded');

    expect(prisma.importBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'batch-1' },
        data: expect.objectContaining({
          status: ImportStatus.FALHOU,
          errorMessage: 'DB exploded',
        }),
      }),
    );
  });

  it('uses a fallback errorMessage when the thrown value is not an Error instance', async () => {
    const prisma = buildPrismaMock({
      $transaction: jest.fn().mockRejectedValue('string error'),
    });
    const rules = buildRulesMock();
    const service = new ImportsService(prisma, rules);

    await expect(
      service.import('co-1', buildImportRequestDto(), buildFile(MINIMAL_OFX)),
    ).rejects.toBe('string error');

    expect(prisma.importBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ImportStatus.FALHOU,
          errorMessage: 'Falha ao importar',
        }),
      }),
    );
  });

  it('does not call applyToTransactions when the transaction fails', async () => {
    const prisma = buildPrismaMock({
      $transaction: jest.fn().mockRejectedValue(new Error('timeout')),
    });
    const rules = buildRulesMock();
    const service = new ImportsService(prisma, rules);

    await expect(
      service.import('co-1', buildImportRequestDto(), buildFile(MINIMAL_OFX)),
    ).rejects.toThrow();

    expect(rules.applyToTransactions).not.toHaveBeenCalled();
  });
});

describe('ImportsService — missing file guard', () => {
  it('throws BadRequestException when file is absent', async () => {
    const prisma = buildPrismaMock();
    const rules = buildRulesMock();
    const service = new ImportsService(prisma, rules);

    await expect(
      service.import('co-1', buildImportRequestDto(), null as unknown as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
  });
});
