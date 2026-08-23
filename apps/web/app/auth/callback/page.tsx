'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { refreshAccessToken } from '@/lib/api-client';

/**
 * Destino do redirect do callback OAuth. O cookie httpOnly de refresh já foi
 * setado pela API; aqui trocamos ele por um access token via o singleton
 * refreshAccessToken() (nunca chamar /auth/refresh direto — ver CLAUDE.md).
 *
 * Fica FORA do route group (auth) de propósito: o layout de (auth) renderiza a
 * landing e só mostra children dentro de um dropdown (open=false por padrão),
 * o que impediria este efeito de rodar.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      const ok = await refreshAccessToken();
      router.replace(ok ? '/dashboard' : '/login?error=oauth');
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center py-16">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
