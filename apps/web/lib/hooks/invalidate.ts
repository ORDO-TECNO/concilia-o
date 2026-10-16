import type { QueryClient } from '@tanstack/react-query';

/**
 * Tudo que deriva dos lançamentos: a grade, a DFC e o dashboard. Qualquer
 * mutação que muda valor, status ou categoria de lançamento invalida os três.
 */
export function invalidateTransactionViews(queryClient: QueryClient, companyId: string | null) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions', companyId] }),
    queryClient.invalidateQueries({ queryKey: ['dfc', companyId] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] }),
  ]);
}
