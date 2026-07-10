import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { DFCReport } from '@conciliacao/shared';

export function useDfcReport(companyId: string | null, year: number) {
  return useQuery({
    queryKey: ['dfc', companyId, year],
    queryFn: () => apiFetch<DFCReport>(`/companies/${companyId}/dfc?year=${year}`),
    enabled: !!companyId,
  });
}
