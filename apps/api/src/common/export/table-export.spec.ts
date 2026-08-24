import { buildCsvBuffer, streamCsvExport, streamXlsxExport, type ExportRow } from './table-export';
import { TransactionsService } from '../../modules/transactions/transactions.service';
import { PassThrough, Writable } from 'stream';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRows(count: number): ExportRow[] {
  return Array.from({ length: count }, (_, i) => [
    `01/0${(i % 9) + 1}/2026`,
    `Descrição ${i}`,
    '',
    `DOC-${i}`,
    i % 2 === 0 ? 100.5 : -50.0,
    i % 2 === 0 ? 'CREDITO' : 'DEBITO',
    'Categoria A',
    'Fornecedor X',
    'PENDENTE',
    'Conta Corrente',
    '01/2026',
  ]);
}

async function* batchIterable(rows: ExportRow[], batchSize = 10): AsyncIterable<ExportRow[]> {
  for (let i = 0; i < rows.length; i += batchSize) {
    yield rows.slice(i, i + batchSize);
  }
}

/**
 * Creates a Writable that collects all written chunks.
 * The returned Writable is a proper Node.js stream (not a shim).
 */
function makeCollector(): { writable: Writable; getBuffer: () => Buffer } {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk: Buffer | string, _enc: string, cb: () => void) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });
  return {
    writable,
    getBuffer: () => Buffer.concat(chunks),
  };
}

// ---------------------------------------------------------------------------
// toExportRow
// ---------------------------------------------------------------------------

describe('TransactionsService.toExportRow', () => {
  it('maps all eleven columns in order', () => {
    const fakeRow = {
      date: new Date('2026-03-15'),
      description: 'Test payment',
      historico: 'Hist note',
      document: 'NF-001',
      // Prisma Decimal coerces to number via valueOf; Number() uses that path
      amount: { valueOf: () => 1234.56 } as unknown as import('@prisma/client').Prisma.Decimal,
      type: 'CREDITO',
      category: { name: 'Receita' } as { name: string } | null,
      party: { name: 'Cliente ABC' } as { name: string } | null,
      status: 'PENDENTE',
      bankAccount: { apelido: 'PJ Itaú', conta: '12345-6' } as {
        apelido: string | null;
        conta: string;
      },
      competenceMonth: 3,
      competenceYear: 2026,
    } as Parameters<typeof TransactionsService.toExportRow>[0];

    const row = TransactionsService.toExportRow(fakeRow);

    expect(row).toHaveLength(11);
    expect(row[0]).toBe('15/03/2026');
    expect(row[1]).toBe('Test payment');
    expect(row[2]).toBe('Hist note');
    expect(row[3]).toBe('NF-001');
    expect(row[4]).toBeCloseTo(1234.56);
    expect(row[5]).toBe('CREDITO');
    expect(row[6]).toBe('Receita');
    expect(row[7]).toBe('Cliente ABC');
    expect(row[8]).toBe('PENDENTE');
    expect(row[9]).toBe('PJ Itaú');      // apelido preferred over conta
    expect(row[10]).toBe('03/2026');
  });

  it('falls back to conta when apelido is null, and nulls become empty strings', () => {
    const fakeRow = {
      date: new Date('2026-01-01'),
      description: 'D',
      historico: null,
      document: null,
      amount: { valueOf: () => 0 } as unknown as import('@prisma/client').Prisma.Decimal,
      type: 'DEBITO',
      category: null,
      party: null,
      status: 'PENDENTE',
      bankAccount: { apelido: null, conta: '99999-0' } as { apelido: string | null; conta: string },
      competenceMonth: 1,
      competenceYear: 2026,
    } as Parameters<typeof TransactionsService.toExportRow>[0];

    const row = TransactionsService.toExportRow(fakeRow);

    expect(row[2]).toBe('');    // historico null → ''
    expect(row[3]).toBe('');    // document null → ''
    expect(row[6]).toBe('');    // category null → ''
    expect(row[7]).toBe('');    // party null → ''
    expect(row[9]).toBe('99999-0');
  });
});

// ---------------------------------------------------------------------------
// buildCsvBuffer (sanity — buffered path still works)
// ---------------------------------------------------------------------------

describe('buildCsvBuffer', () => {
  it('produces a UTF-8 BOM + semicolon-delimited CSV', async () => {
    const headers = ['A', 'B'];
    const rows: ExportRow[] = [['hello', 1], ['world', 2]];
    const buf = await buildCsvBuffer(headers, rows);
    const text = buf.toString('utf8');
    expect(text.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(text).toContain('A;B');
    expect(text).toContain('hello;1');
    expect(text).toContain('world;2');
  });
});

// ---------------------------------------------------------------------------
// streamCsvExport
// ---------------------------------------------------------------------------

describe('streamCsvExport', () => {
  it('writes BOM + header + all rows from multiple batches', async () => {
    const headers = TransactionsService.EXPORT_HEADERS as unknown as string[];
    const rows = makeRows(25);
    const { writable, getBuffer } = makeCollector();

    await streamCsvExport(writable, headers, batchIterable(rows, 10));

    const text = getBuffer().toString('utf8');
    expect(text.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(text).toContain(headers.join(';'));
    // All 25 rows should appear
    expect(text.split('\n').filter(Boolean)).toHaveLength(26); // header + 25 rows
  });

  it('handles an empty data set (only header written)', async () => {
    const headers = ['Data', 'Valor'];
    const { writable, getBuffer } = makeCollector();

    await streamCsvExport(writable, headers, batchIterable([]));

    const text = getBuffer().toString('utf8');
    expect(text).toContain('Data;Valor');
    // Only header line after BOM
    expect(text.split('\n').filter(Boolean)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// streamXlsxExport
// ---------------------------------------------------------------------------

describe('streamXlsxExport', () => {
  it('writes a non-empty XLSX stream (PK magic bytes)', async () => {
    const headers = TransactionsService.EXPORT_HEADERS as unknown as string[];
    const rows = makeRows(5);

    // ExcelJS WorkbookWriter needs a real Node.js Writable; PassThrough satisfies that.
    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];
    passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<void>((resolve) => passThrough.on('end', resolve));

    await streamXlsxExport(passThrough, headers, 'Lançamentos', batchIterable(rows, 5));
    // WorkbookWriter.commit() finishes writing but does NOT call .end() on the
    // stream; we end it ourselves so the PassThrough emits 'end'.
    passThrough.end();
    await done;

    const buf = Buffer.concat(chunks);
    // XLSX files are ZIP archives; they start with the PK magic bytes.
    expect(buf[0]).toBe(0x50); // 'P'
    expect(buf[1]).toBe(0x4b); // 'K'
    expect(buf.length).toBeGreaterThan(1000);
  });
});
