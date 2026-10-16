import { parse as parseSync } from 'csv-parse/sync';
import { ParsedStatement, ParsedTransaction } from './statement-parser.types';
import { isNonMovement } from './non-movement';

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

/** Monta YYYY-MM-DD só se a data existir no calendário (rejeita 31/02, mês 13 etc.). */
function toIsoDate(year: string, month: string, day: string): string | undefined {
  const [y, m, d] = [Number(year), Number(month), Number(day)];
  if (m < 1 || m > 12 || d < 1) return undefined;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > daysInMonth) return undefined;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseDate(raw: string | undefined, format: CsvColumnMapping['dateFormat']): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();

  if (format === 'YYYY-MM-DD') {
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return undefined;
    return toIsoDate(m[1], m[2], m[3]);
  }

  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (!m) return undefined;
  const [, a, b, rawYear] = m;
  const year = rawYear.length === 2 ? (Number(rawYear) > 50 ? `19${rawYear}` : `20${rawYear}`) : rawYear;
  const [day, month] = format === 'MM/DD/YYYY' ? [b, a] : [a, b];
  return toIsoDate(year, month, day);
}

/**
 * Aceita os formatos de valor mais comuns em extratos brasileiros:
 * "-1.234,56", "R$ -1.234,56", "(1.234,56)", "1.234,56-" e "1.234,56 D"/"C".
 */
function parseAmount(raw: string | undefined, decimalSeparator: ',' | '.'): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  let s = String(raw).replace(/R\$/gi, '').replace(/\s+/g, ' ').trim();
  if (!s) return undefined;

  let negative = false;
  const dcSuffix = s.match(/\s*([DC])$/i);
  if (dcSuffix) {
    negative = dcSuffix[1].toUpperCase() === 'D';
    s = s.slice(0, s.length - dcSuffix[0].length).trim();
  }
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1).trim();
  } else if (s.startsWith('+')) {
    s = s.slice(1).trim();
  }
  if (s.endsWith('-')) {
    negative = true;
    s = s.slice(0, -1).trim();
  }
  if (!/^[\d.,]+$/.test(s)) return undefined;

  s = decimalSeparator === ',' ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');

  const num = Number(s);
  if (!Number.isFinite(num)) return undefined;
  return negative ? -Math.abs(num) : num;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseCsvStatement(content: string, mapping: CsvColumnMapping): ParsedStatement {
  const records: Record<string, string>[] = parseSync(content, {
    delimiter: mapping.delimiter,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const parsed: ParsedTransaction[] = records
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

  const transactions = parsed.filter((t) => !isNonMovement(t));

  // Muitos bancos exportam do mais recente para o mais antigo. Normaliza para
  // ordem cronológica: os saldos de abertura/fechamento (do extrato e de cada
  // período) dependem da ordem dos lançamentos dentro do mesmo dia.
  if (transactions.length > 1 && transactions[0].date > transactions[transactions.length - 1].date) {
    transactions.reverse();
  }

  const dates = transactions.map((t) => t.date).sort();
  const withBalance = transactions.filter((t) => t.balanceAfter !== undefined);

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    // Saldo de abertura = saldo antes do 1º lançamento, não depois dele.
    startBalance: withBalance[0] ? round2(withBalance[0].balanceAfter! - withBalance[0].amount) : undefined,
    endBalance: withBalance[withBalance.length - 1]?.balanceAfter,
    transactions,
    ignoredCount: parsed.length - transactions.length,
  };
}
