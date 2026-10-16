'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CategoryNode } from '@/lib/hooks/use-categories';
import { toCategoryOptions } from '@/lib/categories';

export function BulkActionsBar({
  count,
  categories,
  onConciliar,
  onIgnorar,
  onExcluir,
  onCategorizar,
  loading,
}: {
  count: number;
  categories: CategoryNode[] | undefined;
  onConciliar: () => void;
  onIgnorar: () => void;
  onExcluir: () => void;
  onCategorizar: (categoryId: string) => void;
  loading: boolean;
}) {
  const [bulkCategory, setBulkCategory] = React.useState<string>('');

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border bg-accent/40 px-3 py-2">
      <span className="text-sm font-medium">{count} selecionado(s)</span>
      <Button size="sm" variant="secondary" onClick={onConciliar} disabled={loading}>
        Conciliar
      </Button>
      <Button size="sm" variant="secondary" onClick={onIgnorar} disabled={loading}>
        Ignorar
      </Button>
      <Button size="sm" variant="destructive" onClick={onExcluir} disabled={loading}>
        Excluir
      </Button>
      <div className="flex items-center gap-2">
        <Select value={bulkCategory} onValueChange={setBulkCategory}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Categorizar como..." />
          </SelectTrigger>
          <SelectContent>
            {toCategoryOptions(categories).map((opt) => (
              <SelectItem key={opt.id} value={opt.id} disabled={!opt.selectable}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => bulkCategory && onCategorizar(bulkCategory)}
          disabled={loading || !bulkCategory}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
