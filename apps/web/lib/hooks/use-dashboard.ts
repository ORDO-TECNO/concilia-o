import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface DashboardSummary {
  year: number;
  monthly: { month: number; receitas: number; despesas: number; saldo: number }[];
  topCategories: { name: string; total: number }[];
  categoryDistribution: { name: string; value: number }[];
}

export function useDashboardSummary(companyId: string | null, year: number) {
  return useQuery({
    queryKey: ['dashboard', companyId, year],
    queryFn: () => apiFetch<DashboardSummary>(`/companies/${companyId}/dashboard/summary?year=${year}`),
    enabled: !!companyId,
  });
}
