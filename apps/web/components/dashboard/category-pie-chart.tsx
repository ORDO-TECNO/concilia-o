'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatBRL } from '@conciliacao/shared';

const CATEGORICAL_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948'];
const OUTROS_COLOR = '#c3c2b7';

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
        >
          {data.map((d, i) => (
            <Cell
              key={d.name}
              fill={d.name === 'Outros' ? OUTROS_COLOR : CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
