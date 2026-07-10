import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { RuleField, RuleMatchType } from '@conciliacao/shared';

export interface ClassificationRule {
  id: string;
  companyId: string;
  name: string;
  field: RuleField;
  matchType: RuleMatchType;
  pattern: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  partyId: string | null;
  party: { id: string; name: string } | null;
  priority: number;
  isActive: boolean;
}

export interface RuleInput {
  name: string;
  field: RuleField;
  matchType: RuleMatchType;
  pattern: string;
  categoryId?: string;
  partyId?: string;
  priority?: number;
  isActive?: boolean;
}

export function useRules(companyId: string | null) {
  return useQuery({
    queryKey: ['rules', companyId],
    queryFn: () => apiFetch<ClassificationRule[]>(`/companies/${companyId}/rules`),
    enabled: !!companyId,
  });
}

export function useCreateRule(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleInput) =>
      apiFetch(`/companies/${companyId}/rules`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules', companyId] }),
  });
}

export function useUpdateRule(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RuleInput> }) =>
      apiFetch(`/rules/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules', companyId] }),
  });
}

export function useDeleteRule(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules', companyId] }),
  });
}

export function useApplyRules(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ appliedCount: number }>(`/companies/${companyId}/rules/apply`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', companyId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', companyId] });
    },
  });
}
