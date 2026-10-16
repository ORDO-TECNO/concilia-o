import { CategoryKind, DFCLine, allDFCLines, dfcLinesForKind, isDfcLineAllowedForKind } from '@conciliacao/shared';

describe('dfcLinesForKind (packages/shared)', () => {
  it('Receita só alimenta as entradas operacionais', () => {
    expect(dfcLinesForKind(CategoryKind.RECEITA).map((l) => l.line)).toEqual([
      DFCLine.RECEBIMENTOS_CLIENTES,
      DFCLine.OUTRAS_RECEITAS,
    ]);
  });

  it('Despesa não pode ir para linhas de investimento/financiamento', () => {
    expect(isDfcLineAllowedForKind(CategoryKind.DESPESA, DFCLine.FOLHA)).toBe(true);
    expect(isDfcLineAllowedForKind(CategoryKind.DESPESA, DFCLine.DIVIDENDOS)).toBe(false);
  });

  it('Investimento e Financiamento cobrem entradas e saídas do próprio grupo', () => {
    expect(isDfcLineAllowedForKind(CategoryKind.INVESTIMENTO, DFCLine.VENDA_ATIVOS)).toBe(true);
    expect(isDfcLineAllowedForKind(CategoryKind.FINANCIAMENTO, DFCLine.EMPRESTIMOS)).toBe(true);
    expect(isDfcLineAllowedForKind(CategoryKind.FINANCIAMENTO, DFCLine.APLICACOES)).toBe(false);
  });

  it('toda linha da DFC pertence a exatamente um tipo de categoria', () => {
    const kinds = Object.values(CategoryKind);
    for (const { line } of allDFCLines()) {
      expect(kinds.filter((k) => isDfcLineAllowedForKind(k, line))).toHaveLength(1);
    }
  });
});
