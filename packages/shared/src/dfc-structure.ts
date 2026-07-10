import { DFCLine } from './enums';

/**
 * Única fonte de verdade da hierarquia da Demonstração do Fluxo de Caixa (DFC).
 * Usada pelo backend (agregação) e pelo frontend (renderização do pivot e
 * formulários de categoria) para nunca divergirem.
 *
 * Convenção de sinal: Transaction.amount é positivo para CREDITO e negativo
 * para DEBITO, então cada subtotal é uma soma simples dos valores das linhas.
 */

export type DFCGroupKey = 'OPERACIONAL' | 'INVESTIMENTO' | 'FINANCIAMENTO';

export interface DFCLineDef {
  line: DFCLine;
  label: string;
}

export interface DFCSectionDef {
  key: string;
  label: string;
  lines: DFCLineDef[];
}

export interface DFCGroupDef {
  key: DFCGroupKey;
  label: string;
  sections: DFCSectionDef[];
  resultLabel: string;
}

export const DFC_STRUCTURE: DFCGroupDef[] = [
  {
    key: 'OPERACIONAL',
    label: 'Operacional',
    resultLabel: 'Resultado Operacional',
    sections: [
      {
        key: 'ENTRADAS',
        label: 'Entradas',
        lines: [
          { line: DFCLine.RECEBIMENTOS_CLIENTES, label: 'Recebimentos de Clientes' },
          { line: DFCLine.OUTRAS_RECEITAS, label: 'Outras Receitas' },
        ],
      },
      {
        key: 'SAIDAS',
        label: 'Saídas',
        lines: [
          { line: DFCLine.MATERIA_PRIMA, label: 'Matéria-Prima' },
          { line: DFCLine.FOLHA, label: 'Folha' },
          { line: DFCLine.IMPOSTOS, label: 'Impostos' },
          { line: DFCLine.SERVICOS, label: 'Serviços de Terceiros' },
          { line: DFCLine.COMERCIAL, label: 'Comercial' },
          { line: DFCLine.ADMINISTRATIVO, label: 'Administrativo' },
          { line: DFCLine.DESPESAS_FIXAS, label: 'Despesas Fixas' },
        ],
      },
    ],
  },
  {
    key: 'INVESTIMENTO',
    label: 'Investimento',
    resultLabel: 'Resultado Investimento',
    sections: [
      {
        key: 'MOVIMENTACOES',
        label: 'Movimentações',
        lines: [
          { line: DFCLine.APLICACOES, label: 'Aplicações' },
          { line: DFCLine.COMPRA_MAQUINAS, label: 'Compra de Máquinas' },
          { line: DFCLine.COMPRA_VEICULOS, label: 'Compra de Veículos' },
          { line: DFCLine.IMOVEIS, label: 'Imóveis' },
          { line: DFCLine.VENDA_ATIVOS, label: 'Venda de Ativos' },
        ],
      },
    ],
  },
  {
    key: 'FINANCIAMENTO',
    label: 'Financiamento',
    resultLabel: 'Resultado Financiamento',
    sections: [
      {
        key: 'MOVIMENTACOES',
        label: 'Movimentações',
        lines: [
          { line: DFCLine.EMPRESTIMOS, label: 'Empréstimos' },
          { line: DFCLine.PARCELAMENTOS, label: 'Parcelamentos' },
          { line: DFCLine.CAPITAL, label: 'Capital' },
          { line: DFCLine.DIVIDENDOS, label: 'Dividendos' },
        ],
      },
    ],
  },
];

export function allDFCLines(): DFCLineDef[] {
  return DFC_STRUCTURE.flatMap((group) => group.sections.flatMap((section) => section.lines));
}

export function findDFCGroupByLine(line: DFCLine): DFCGroupDef | undefined {
  return DFC_STRUCTURE.find((group) =>
    group.sections.some((section) => section.lines.some((l) => l.line === line)),
  );
}

export const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
