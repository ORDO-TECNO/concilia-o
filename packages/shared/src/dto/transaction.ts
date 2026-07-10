import {
  CategorySource,
  ImportSource,
  ReconciliationStatus,
  TransactionType,
} from '../enums';

export interface TransactionDTO {
  id: string;
  companyId: string;
  bankAccountId: string;
  importBatchId: string | null;
  date: string; // YYYY-MM-DD
  settlementDate: string | null;
  description: string;
  historico: string | null;
  document: string | null;
  amount: string; // decimal serialized as string
  type: TransactionType;
  balanceAfter: string | null;
  competenceYear: number;
  competenceMonth: number;
  origin: ImportSource;
  status: ReconciliationStatus;
  categoryId: string | null;
  categoryName: string | null;
  partyId: string | null;
  partyName: string | null;
  categorySource: CategorySource | null;
}

export interface TransactionListFilters {
  companyId: string;
  bankAccountId?: string;
  year?: number;
  month?: number;
  categoryId?: string;
  status?: ReconciliationStatus;
  partyId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'amount' | 'description';
  sortDir?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  items: TransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export type BulkTransactionAction = 'CONCILIAR' | 'IGNORAR' | 'EXCLUIR' | 'CATEGORIZAR';

export interface BulkTransactionRequest {
  ids: string[];
  action: BulkTransactionAction;
  categoryId?: string;
}
