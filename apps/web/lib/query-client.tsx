'use client';

import * as React from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Toaster } from '@/components/ui/toaster';

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        // Toda mutação que falha mostra a mensagem da API (as regras de negócio
        // são validadas no backend e devolvem 400/409 com texto para o usuário).
        mutationCache: new MutationCache({
          onError: (error) => toast(error instanceof Error ? error.message : 'Não foi possível concluir a ação', 'error'),
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
