import { parse as parseSync } from 'csv-parse/sync';
import { ParsedStatement, ParsedTransaction } from './statement-parser.types';

export interface CsvColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  documentColumn?: string;
  balanceColumn?: string;
  creditDebitColumn?: string;
  delimiter: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  decimalSeparator: ',' | '.';
}

export interface CsvPreviewResult {
  headers: string[];
  sampleRows: string[][];
  suggestedMapping: Partial<Record<'dateColumn' | 'descriptionColumn' | 'amountColumn' | 'documentColumn' | 'balanceColumn' | 'creditDebitColumn', string>>;
}

const ACCENTED_CHARS = 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ';
const PLAIN_CHARS = 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC';

function normalize(str: string): string {
  let result = str.toLowerCase().trim();
  for (let i = 0; i < ACCENTED_CHARS.length; i++) {
    result = result.split(ACCENTED_CHARS[i]).join(PLAIN_CHARS[i].toLowerCase());
  }
  return result;
}

function findHeaderMatching(headers: string[], keywords: string[]): string | undefined {
  return headers.find((h) => keywords.some((kw) => normalize(h).includes(kw)));
}

export function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] ?? '';
  const candidates = [';', ',', '\t', '|'];
  let best = ',';
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstLine.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

export function previewCsv(content: string, delimiter: string): CsvPreviewResult {
  const records: string[][] = parseSync(content, {
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const headers = records[0] ?? [];
  const sampleRows = records.slice(1, 6);

  const suggestedMapping = {
    dateColumn: findHeaderMatching(headers, ['data']),
    descriptionColumn: findHeaderMatching(headers, ['historico', 'descricao', 'lancamento', 'memo']),
    amountColumn: findHeaderMatching(headers, ['valor', 'montante']),
    documentColumn: findHeaderMatching(headers, ['documento', 'doc', 'cheque']),
    balanceColumn: findHeaderMatching(headers, ['saldo']),
    creditDebitColumn: findHeaderMatching(headers, ['tipo', 'natureza', 'd/c', 'dc']),
  };

  return { headers, sampleRows, suggestedMapping };
}

function parseDate(raw: string | undefined, format: CsvColumnMapping['dateFormat']): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();

  if (format === 'YYYY-MM-DD') {
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return undefined;
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (!m) return undefined;
  const [, a, b, rawYear] = m;
  const year = rawYear.length === 2 ? (Number(rawYear) > 50 ? `19${rawYear}` : `20${rawYear}`) : rawYear;
  const [day, month] = format === 'MM/DD/YYYY' ? [b, a] : [a, b];
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseAmount(raw: string | undefined, decimalSeparator: ',' | '.'): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;

  const negative = /^\(.*\)$/.test(s) || s.trim().startsWith('-');
  s = s.replace(/[()]/g, '').replace(/^-/, '').replace(/R\$/gi, '').trim();

  s = decimalSeparator === ',' ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');

  const num = Number(s);
  if (!Number.isFinite(num)) return undefined;
  return negative ? -Math.abs(num) : num;
}

export function parseCsvStatement(content: string, mapping: CsvColumnMapping): ParsedStatement {
  const records: Record<string, string>[] = parseSync(content, {
    delimiter: mapping.delimiter,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const transactions: ParsedTransaction[] = records
    .map((row): ParsedTransaction | null => {
      const date = parseDate(row[mapping.dateColumn], mapping.dateFormat);
      let amount = parseAmount(row[mapping.amountColumn], mapping.decimalSeparator);
      if (date === undefined || amount === undefined) return null;

      if (mapping.creditDebitColumn) {
        const cd = normalize(row[mapping.creditDebitColumn] ?? '');
        if (cd.startsWith('d') || cd === '-') amount = -Math.abs(amount);
        else if (cd.startsWith('c') || cd === '+') amount = Math.abs(amount);
      }

      const balanceAfter = mapping.balanceColumn
        ? parseAmount(row[mapping.balanceColumn], mapping.decimalSeparator)
        : undefined;

      return {
        date,
        amount,
        description: row[mapping.descriptionColumn]?.trim() || 'Sem descrição',
        document: mapping.documentColumn ? row[mapping.documentColumn]?.trim() || undefined : undefined,
        balanceAfter,
      };
    })
    .filter((t): t is ParsedTransaction => t !== null);

  const dates = transactions.map((t) => t.date).sort();
  const withBalance = transactions.filter((t) => t.balanceAfter !== undefined);

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    startBalance: withBalance[0]?.balanceAfter,
    endBalance: withBalance[withBalance.length - 1]?.balanceAfter,
    transactions,
  };
}
