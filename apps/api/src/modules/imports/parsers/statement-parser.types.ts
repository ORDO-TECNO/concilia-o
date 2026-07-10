export interface ParsedTransaction {
  date: string; // YYYY-MM-DD, data pura sem timezone
  amount: number; // positivo = crédito, negativo = débito
  description: string;
  historico?: string;
  document?: string;
  fitId?: string;
  balanceAfter?: number;
}

export interface ParsedStatement {
  bankCode?: string;
  bankName?: string;
  agencia?: string;
  conta?: string;
  startDate?: string;
  endDate?: string;
  startBalance?: number;
  endBalance?: number;
  transactions: ParsedTransaction[];
}
