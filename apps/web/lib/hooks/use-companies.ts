import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface CompanyListItem {
  id: string;
  name: string;
  cnpj: string | null;
  role: string;
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => apiFetch<CompanyListItem[]>('/companies'),
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; cnpj?: string }) =>
      apiFetch('/companies', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
