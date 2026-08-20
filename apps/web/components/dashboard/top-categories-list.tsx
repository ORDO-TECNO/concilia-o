'use client';

import { formatBRL } from '@conciliacao/shared';

const BAR_COLORS = ['#0D9488', '#4F46E5', '#D97706', '#E11D48', '#0284C7'];

export function TopCategoriesList({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem lançamentos classificados.</p>;
  }

  const max = Math.max(...data.map((d) => d.total));

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{formatBRL(d.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(d.total / max) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
