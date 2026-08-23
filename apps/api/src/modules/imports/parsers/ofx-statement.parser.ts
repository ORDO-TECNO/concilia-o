import { XMLParser } from 'fast-xml-parser';
import { BadRequestException } from '@nestjs/common';
import { ParsedStatement, ParsedTransaction } from './statement-parser.types';

/** Shapes returned by fast-xml-parser for OFX files — all fields are opaque strings or nested objects. */
interface OfxRawTransaction {
  DTPOSTED?: string;
  TRNAMT?: string;
  NAME?: string;
  MEMO?: string;
  PAYEE?: string;
  CHECKNUM?: string;
  FITID?: string;
}

interface OfxRawBankAcct {
  BANKID?: string;
  BRANCHID?: string;
  ACCTID?: string;
}

interface OfxRawBankTranList {
  DTSTART?: string;
  DTEND?: string;
  STMTTRN?: OfxRawTransaction | OfxRawTransaction[];
}

interface OfxRawLedgerBal {
  BALAMT?: string;
}

interface OfxRawStmtrs {
  BANKACCTFROM?: OfxRawBankAcct;
  CCACCTFROM?: OfxRawBankAcct;
  BANKTRANLIST?: OfxRawBankTranList;
  LEDGERBAL?: OfxRawLedgerBal;
}

interface OfxRawDoc {
  OFX?: {
    BANKMSGSRSV1?: { STMTTRNRS?: { STMTRS?: OfxRawStmtrs } };
    CREDITCARDMSGSRSV1?: { CCSTMTTRNRS?: { CCSTMTRS?: OfxRawStmtrs } };
  };
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * OFX 1.x (SGML) não é XML bem-formado: tags-folha como <DTPOSTED>20240115 não
 * têm fechamento. Normaliza linha a linha, fechando qualquer tag-folha que
 * ainda não esteja fechada na própria linha. Idempotente para OFX 2.x (XML já
 * bem-formado) — se a tag já tem fechamento na linha, não mexe.
 */
function normalizeSgmlToXml(body: string): string {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      const match = trimmed.match(/^<(\w+)>([^<]+)$/);
      if (match) {
        const [, tag, value] = match;
        return `<${tag}>${value.trim()}</${tag}>`;
      }
      return trimmed;
    })
    .filter(Boolean)
    .join('\n');
}

/** Datas OFX vêm como YYYYMMDD[HHMMSS[...]] — extrai só a data pura (sem timezone). */
function parseOfxDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = raw.trim().slice(0, 8);
  if (digits.length !== 8) return undefined;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function parseOfxAmount(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const num = Number(String(raw).replace(',', '.'));
  return Number.isFinite(num) ? num : undefined;
}

export function parseOfxStatement(rawContent: string): ParsedStatement {
  const ofxStart = rawContent.search(/<OFX>/i);
  if (ofxStart === -1) {
    throw new BadRequestException('Arquivo OFX inválido: tag <OFX> não encontrada');
  }

  const body = rawContent.slice(ofxStart);
  const normalized = normalizeSgmlToXml(body);

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

  let doc: OfxRawDoc;
  try {
    doc = parser.parse(normalized) as OfxRawDoc;
  } catch (err) {
    throw new BadRequestException('Falha ao interpretar o arquivo OFX');
  }

  const ofx = doc?.OFX;
  if (!ofx) {
    throw new BadRequestException('Arquivo OFX inválido: estrutura <OFX> ausente');
  }

  const stmtrs =
    ofx?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS ?? ofx?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS;

  if (!stmtrs) {
    throw new BadRequestException('Arquivo OFX inválido: extrato (STMTRS) não encontrado');
  }

  const bankAcctFrom = stmtrs.BANKACCTFROM ?? stmtrs.CCACCTFROM ?? {};
  const bankTranList = stmtrs.BANKTRANLIST ?? {};
  const ledgerBal = stmtrs.LEDGERBAL ?? {};

  const rawTransactions = toArray(bankTranList.STMTTRN);

  const transactions: ParsedTransaction[] = rawTransactions
    .map((t: OfxRawTransaction): ParsedTransaction | null => {
      const date = parseOfxDate(t.DTPOSTED);
      const amount = parseOfxAmount(t.TRNAMT);
      if (!date || amount === undefined) return null;

      const description = (t.NAME ?? t.MEMO ?? t.PAYEE ?? 'Sem descrição').toString().trim();
      const historico = t.MEMO && t.MEMO !== description ? String(t.MEMO).trim() : undefined;

      return {
        date,
        amount,
        description,
        historico,
        document: t.CHECKNUM ? String(t.CHECKNUM).trim() : undefined,
        fitId: t.FITID ? String(t.FITID).trim() : undefined,
      };
    })
    .filter((t: ParsedTransaction | null): t is ParsedTransaction => t !== null);

  return {
    bankCode: bankAcctFrom.BANKID ? String(bankAcctFrom.BANKID).trim() : undefined,
    agencia: bankAcctFrom.BRANCHID ? String(bankAcctFrom.BRANCHID).trim() : undefined,
    conta: bankAcctFrom.ACCTID ? String(bankAcctFrom.ACCTID).trim() : undefined,
    startDate: parseOfxDate(bankTranList.DTSTART),
    endDate: parseOfxDate(bankTranList.DTEND),
    endBalance: parseOfxAmount(ledgerBal.BALAMT),
    transactions,
  };
}
