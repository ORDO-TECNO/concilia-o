'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatBRL } from '@conciliacao/shared';

const CATEGORICAL_COLORS = ['#0D9488', '#4F46E5', '#D97706', '#E11D48', '#0284C7', '#7C3AED'];
const OUTROS_COLOR = 'hsl(var(--muted-foreground) / 0.5)';

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem lançamentos classificados.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
          labelLine={false}
          fontSize={11}
          fill="hsl(var(--muted-foreground))"
        >
          {data.map((d, i) => (
            <Cell
              key={d.name}
              fill={d.name === 'Outros' ? OUTROS_COLOR : CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatBRL(value)}
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
