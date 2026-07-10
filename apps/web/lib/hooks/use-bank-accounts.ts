import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface BankAccount {
  id: string;
  companyId: string;
  bankCode: string | null;
  bankName: string | null;
  agencia: string | null;
  conta: string;
  contaDigito: string | null;
  apelido: string | null;
  isActive: boolean;
}

export interface BankAccountInput {
  bankCode?: string;
  bankName?: string;
  agencia?: string;
  conta: string;
  contaDigito?: string;
  apelido?: string;
}

export function useBankAccounts(companyId: string | null) {
  return useQuery({
    queryKey: ['bank-accounts', companyId],
    queryFn: () => apiFetch<BankAccount[]>(`/companies/${companyId}/bank-accounts`),
    enabled: !!companyId,
  });
}

export function useCreateBankAccount(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BankAccountInput) =>
      apiFetch(`/companies/${companyId}/bank-accounts`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank-accounts', companyId] }),
  });
}

export function useUpdateBankAccount(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BankAccountInput> & { isActive?: boolean } }) =>
      apiFetch(`/bank-accounts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank-accounts', companyId] }),
  });
}

export function useDeleteBankAccount(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/bank-accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank-accounts', companyId] }),
  });
}
