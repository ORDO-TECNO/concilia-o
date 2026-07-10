'use client';

import { formatBRL } from '@conciliacao/shared';

const BAR_COLOR = '#2a78d6';

export function TopCategoriesList({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem lançamentos classificados.</p>;
  }

  const max = Math.max(...data.map((d) => d.total));

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{formatBRL(d.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full"
              style={{ width: `${(d.total / max) * 100}%`, backgroundColor: BAR_COLOR }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
