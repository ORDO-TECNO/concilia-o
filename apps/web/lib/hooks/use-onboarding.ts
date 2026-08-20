'use client';

import * as React from 'react';
import type { TourStep } from '@/components/onboarding/onboarding-tour';

const STORAGE_PREFIX = 'conciliacao-onboarding-seen-';

export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo à Conciliação Bancária Inteligente',
    description:
      'Em poucos passos você importa extratos, classifica lançamentos e acompanha a DFC da sua empresa. Vamos mostrar por onde começar.',
  },
  {
    id: 'importar',
    target: 'nav-importar',
    title: 'Importe seus extratos',
    description: 'Envie arquivos CSV ou OFX do banco. O sistema detecta duplicados automaticamente.',
  },
  {
    id: 'lancamentos',
    target: 'nav-lancamentos',
    title: 'Revise os lançamentos',
    description: 'Filtre, classifique em lote e acompanhe o status de conciliação de cada movimentação.',
  },
  {
    id: 'regras',
    target: 'nav-regras',
    title: 'Automatize com regras',
    description: 'Crie regras de classificação para que novas importações já entrem categorizadas.',
  },
  {
    id: 'dfc',
    target: 'nav-dfc',
    title: 'Acompanhe a DFC',
    description: 'A Demonstração do Fluxo de Caixa é montada automaticamente a partir das categorias.',
  },
  {
    id: 'dashboard',
    target: 'nav-dashboard',
    title: 'Indicadores em tempo real',
    description: 'O Dashboard resume receitas, despesas e saldo com gráficos atualizados a cada importação.',
  },
  {
    id: 'help',
    target: 'help-button',
    title: 'Precisa rever isso?',
    description: 'Clique aqui a qualquer momento para reabrir este tour.',
  },
];

export function useOnboarding(userId: string | undefined) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    const seen = window.localStorage.getItem(STORAGE_PREFIX + userId);
    if (!seen) {
      const timer = window.setTimeout(() => setOpen(true), 500);
      return () => window.clearTimeout(timer);
    }
  }, [userId]);

  const close = React.useCallback(() => {
    setOpen(false);
    if (userId) window.localStorage.setItem(STORAGE_PREFIX + userId, '1');
  }, [userId]);

  const start = React.useCallback(() => setOpen(true), []);

  return { open, close, start };
}
