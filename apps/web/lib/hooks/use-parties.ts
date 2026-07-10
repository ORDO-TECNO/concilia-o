import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { PartyKind } from '@conciliacao/shared';

export interface Party {
  id: string;
  companyId: string;
  name: string;
  document: string | null;
  kind: PartyKind;
}

export interface PartyInput {
  name: string;
  document?: string;
  kind?: PartyKind;
}

export function useParties(companyId: string | null, search?: string) {
  return useQuery({
    queryKey: ['parties', companyId, search],
    queryFn: () =>
      apiFetch<Party[]>(
        `/companies/${companyId}/parties${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      ),
    enabled: !!companyId,
  });
}

export function useCreateParty(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PartyInput) =>
      apiFetch(`/companies/${companyId}/parties`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parties', companyId] }),
  });
}

export function useUpdateParty(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PartyInput> }) =>
      apiFetch(`/parties/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parties', companyId] }),
  });
}

export function useDeleteParty(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/parties/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parties', companyId] }),
  });
}
