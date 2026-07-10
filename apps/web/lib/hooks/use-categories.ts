import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { CategoryKind, DFCLine } from '@conciliacao/shared';

export interface CategoryNode {
  id: string;
  companyId: string;
  parentId: string | null;
  name: string;
  kind: CategoryKind;
  dfcLine: DFCLine | null;
  isActive: boolean;
  children: CategoryNode[];
}

export interface CategoryInput {
  parentId?: string | null;
  name: string;
  kind: CategoryKind;
  dfcLine?: DFCLine | null;
}

export function useCategoryTree(companyId: string | null) {
  return useQuery({
    queryKey: ['categories', companyId, 'tree'],
    queryFn: () => apiFetch<CategoryNode[]>(`/companies/${companyId}/categories`),
    enabled: !!companyId,
  });
}

export function useCategoriesFlat(companyId: string | null) {
  return useQuery({
    queryKey: ['categories', companyId, 'flat'],
    queryFn: () => apiFetch<CategoryNode[]>(`/companies/${companyId}/categories?flat=true`),
    enabled: !!companyId,
  });
}

export function useCreateCategory(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) =>
      apiFetch(`/companies/${companyId}/categories`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', companyId] }),
  });
}

export function useUpdateCategory(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      apiFetch(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', companyId] }),
  });
}

export function useDeleteCategory(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', companyId] }),
  });
}
