'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dismissToast, getToasts, subscribeToasts, type ToastVariant } from '@/lib/toast';

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  error: 'border-destructive/40 bg-destructive text-destructive-foreground',
  success: 'border-success/40 bg-success text-success-foreground',
  info: 'border-border bg-card text-card-foreground',
};

const EMPTY: ReturnType<typeof getToasts> = [];

export function Toaster() {
  const items = React.useSyncExternalStore(subscribeToasts, getToasts, () => EMPTY);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2" role="region" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          className={cn('flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg', VARIANT_CLASSES[t.variant])}
        >
          <p className="flex-1">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} aria-label="Fechar" className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
