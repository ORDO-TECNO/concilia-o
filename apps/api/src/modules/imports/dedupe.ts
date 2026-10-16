import { createHash } from 'crypto';
import type { ParsedTransaction } from './parsers/statement-parser.types';

export function normalizeDescription(description: string): string {
  return description.trim().toUpperCase().replace(/\s+/g, ' ');
}

function baseKey(bankAccountId: string, t: ParsedTransaction): string {
  return `${bankAccountId}|${t.date}|${t.amount.toFixed(2)}|${normalizeDescription(t.description)}`;
}

/**
 * Calcula o hash de deduplicação de cada lançamento do arquivo, na ordem.
 *
 * Dois lançamentos idênticos (mesma conta, data, valor e descrição) no mesmo
 * extrato são movimentações legítimas distintas (ex: duas tarifas de R$ 2,50
 * no mesmo dia). Por isso o hash carrega o índice da ocorrência: a 1ª
 * ocorrência usa a chave pura (compatível com os hashes já gravados), a 2ª
 * recebe o sufixo `|#1`, a 3ª `|#2`, e assim por diante. Reimportar o mesmo
 * extrato (ou um que se sobreponha a ele) gera os mesmos hashes e continua
 * sendo deduplicado.
 */
export function computeDedupeHashes(bankAccountId: string, transactions: ParsedTransaction[]): string[] {
  const occurrences = new Map<string, number>();
  return transactions.map((t) => {
    const key = baseKey(bankAccountId, t);
    const n = occurrences.get(key) ?? 0;
    occurrences.set(key, n + 1);
    return createHash('sha256')
      .update(n === 0 ? key : `${key}|#${n}`)
      .digest('hex');
  });
}
