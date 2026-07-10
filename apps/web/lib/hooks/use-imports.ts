import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { CsvPreviewResponse, ImportSummary } from '@conciliacao/shared';

export interface CsvMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  documentColumn?: string;
  balanceColumn?: string;
  creditDebitColumn?: string;
  delimiter: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  decimalSeparator: ',' | '.';
}

export function useCsvPreview(companyId: string | null) {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiFetch<CsvPreviewResponse & { delimiter: string }>(
        `/companies/${companyId}/imports/csv-preview`,
        { method: 'POST', body: form },
      );
    },
  });
}

export function useImportStatement(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      bankAccountId,
      source,
      mapping,
    }: {
      file: File;
      bankAccountId: string;
      source: 'CSV' | 'OFX';
      mapping?: CsvMapping;
    }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('bankAccountId', bankAccountId);
      form.append('source', source);
      if (mapping) {
        Object.entries(mapping).forEach(([key, value]) => {
          if (value !== undefined) form.append(key, value);
        });
      }
      return apiFetch<ImportSummary>(`/companies/${companyId}/imports`, {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports', companyId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', companyId] });
    },
  });
}

export function useImportHistory(companyId: string | null) {
  return useQuery({
    queryKey: ['imports', companyId],
    queryFn: () => apiFetch(`/companies/${companyId}/imports`),
    enabled: !!companyId,
  });
}
