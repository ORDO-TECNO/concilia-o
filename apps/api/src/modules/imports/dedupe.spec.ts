import { createHash } from 'crypto';
import { computeDedupeHashes } from './dedupe';
import type { ParsedTransaction } from './parsers/statement-parser.types';

const tarifa: ParsedTransaction = { date: '2026-01-10', amount: -2.5, description: 'TARIFA PIX' };

describe('computeDedupeHashes', () => {
  it('mantém o hash da 1ª ocorrência igual ao formato legado (compatível com dados gravados)', () => {
    const legacy = createHash('sha256').update('ba-1|2026-01-10|-2.50|TARIFA PIX').digest('hex');
    expect(computeDedupeHashes('ba-1', [tarifa])).toEqual([legacy]);
  });

  it('gera hashes distintos para lançamentos idênticos no mesmo arquivo', () => {
    const [a, b, c] = computeDedupeHashes('ba-1', [tarifa, { ...tarifa }, { ...tarifa }]);
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('é determinístico: reimportar o mesmo extrato gera os mesmos hashes', () => {
    const file = [tarifa, { ...tarifa }, { date: '2026-01-11', amount: 10, description: 'PIX RECEBIDO' }];
    expect(computeDedupeHashes('ba-1', file)).toEqual(computeDedupeHashes('ba-1', file));
  });

  it('normaliza espaços e caixa da descrição', () => {
    const [a] = computeDedupeHashes('ba-1', [tarifa]);
    const [b] = computeDedupeHashes('ba-1', [{ ...tarifa, description: '  tarifa   pix ' }]);
    expect(a).toBe(b);
  });

  it('conta ocorrências por chave — lançamentos diferentes não interferem entre si', () => {
    const other: ParsedTransaction = { date: '2026-01-10', amount: -5, description: 'TARIFA TED' };
    const [, otherHash] = computeDedupeHashes('ba-1', [tarifa, other]);
    expect(otherHash).toBe(computeDedupeHashes('ba-1', [other])[0]);
  });
});
