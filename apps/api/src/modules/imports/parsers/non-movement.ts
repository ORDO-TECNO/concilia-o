import type { ParsedTransaction } from './statement-parser.types';

const ACCENTS = /[̀-ͯ]/g;

// Linhas informativas de saldo que vários bancos (BB, Itaú, Caixa...) incluem
// no extrato — não são movimentações. Lista fechada de propósito: "SALDO"
// sozinho no início não basta ("SALDO DEVEDOR JUROS" é uma cobrança real).
const BALANCE_LINE =
  /^(SALDO|S A L D O)( (ANTERIOR|DO DIA|DIA|INICIAL|FINAL|ATUAL|TOTAL|DISPONIVEL|EM CONTA|EM C\/C|BLOQUEADO))?( [\d/.-]+)?$/;

function normalize(text: string): string {
  return text.normalize('NFD').replace(ACCENTS, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

/** Lançamento que não é movimentação de caixa: linha de saldo ou valor zero. */
export function isNonMovement(t: Pick<ParsedTransaction, 'amount' | 'description'>): boolean {
  if (t.amount === 0) return true;
  return BALANCE_LINE.test(normalize(t.description));
}
