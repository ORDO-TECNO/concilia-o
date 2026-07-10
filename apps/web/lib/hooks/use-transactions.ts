import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type {
  BulkTransactionAction,
  ReconciliationStatus,
  TransactionListResponse,
} from '@conciliacao/shared';

export interface TransactionFilters {
  bankAccountId?: string;
  year?: number;
  month?: number;
  categoryId?: string;
  status?: ReconciliationStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export function buildQuery(filters: Partial<TransactionFilters>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export function useTransactions(companyId: string | null, filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', companyId, filters],
    queryFn: () =>
      apiFetch<TransactionListResponse>(`/companies/${companyId}/transactions?${buildQuery(filters)}`),
    enabled: !!companyId,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateTransaction(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { categoryId?: string; partyId?: string; status?: ReconciliationStatus };
    }) => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', companyId] }),
  });
}

export function useBulkTransactions(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      action,
      categoryId,
    }: {
      ids: string[];
      action: BulkTransactionAction;
      categoryId?: string;
    }) =>
      apiFetch(`/companies/${companyId}/transactions/bulk`, {
        method: 'POST',
        body: JSON.stringify({ ids, action, categoryId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', companyId] }),
  });
}
