export const TransactionType = {
  CREDITO: 'CREDITO',
  DEBITO: 'DEBITO',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const ReconciliationStatus = {
  PENDENTE: 'PENDENTE',
  CONCILIADO: 'CONCILIADO',
  IGNORADO: 'IGNORADO',
  DUPLICADO: 'DUPLICADO',
} as const;
export type ReconciliationStatus = (typeof ReconciliationStatus)[keyof typeof ReconciliationStatus];

export const CategoryKind = {
  RECEITA: 'RECEITA',
  DESPESA: 'DESPESA',
  INVESTIMENTO: 'INVESTIMENTO',
  FINANCIAMENTO: 'FINANCIAMENTO',
} as const;
export type CategoryKind = (typeof CategoryKind)[keyof typeof CategoryKind];

export const ImportSource = {
  CSV: 'CSV',
  OFX: 'OFX',
} as const;
export type ImportSource = (typeof ImportSource)[keyof typeof ImportSource];

export const ImportStatus = {
  PROCESSANDO: 'PROCESSANDO',
  CONCLUIDO: 'CONCLUIDO',
  PARCIAL: 'PARCIAL',
  FALHOU: 'FALHOU',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export const PartyKind = {
  FORNECEDOR: 'FORNECEDOR',
  CLIENTE: 'CLIENTE',
  AMBOS: 'AMBOS',
} as const;
export type PartyKind = (typeof PartyKind)[keyof typeof PartyKind];

export const RuleField = {
  DESCRICAO: 'DESCRICAO',
  HISTORICO: 'HISTORICO',
  DOCUMENTO: 'DOCUMENTO',
} as const;
export type RuleField = (typeof RuleField)[keyof typeof RuleField];

export const RuleMatchType = {
  CONTAINS: 'CONTAINS',
  REGEX: 'REGEX',
  EQUALS: 'EQUALS',
} as const;
export type RuleMatchType = (typeof RuleMatchType)[keyof typeof RuleMatchType];

export const CategorySource = {
  MANUAL: 'MANUAL',
  REGRA: 'REGRA',
} as const;
export type CategorySource = (typeof CategorySource)[keyof typeof CategorySource];

export const DFCLine = {
  RECEBIMENTOS_CLIENTES: 'RECEBIMENTOS_CLIENTES',
  OUTRAS_RECEITAS: 'OUTRAS_RECEITAS',
  MATERIA_PRIMA: 'MATERIA_PRIMA',
  FOLHA: 'FOLHA',
  IMPOSTOS: 'IMPOSTOS',
  SERVICOS: 'SERVICOS',
  COMERCIAL: 'COMERCIAL',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  DESPESAS_FIXAS: 'DESPESAS_FIXAS',
  APLICACOES: 'APLICACOES',
  COMPRA_MAQUINAS: 'COMPRA_MAQUINAS',
  COMPRA_VEICULOS: 'COMPRA_VEICULOS',
  IMOVEIS: 'IMOVEIS',
  VENDA_ATIVOS: 'VENDA_ATIVOS',
  EMPRESTIMOS: 'EMPRESTIMOS',
  PARCELAMENTOS: 'PARCELAMENTOS',
  CAPITAL: 'CAPITAL',
  DIVIDENDOS: 'DIVIDENDOS',
} as const;
export type DFCLine = (typeof DFCLine)[keyof typeof DFCLine];
