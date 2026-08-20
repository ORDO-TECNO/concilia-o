'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatBRL, MONTH_LABELS } from '@conciliacao/shared';

const COLOR_RECEITAS = 'hsl(var(--success))';
const COLOR_DESPESAS = 'hsl(var(--destructive))';
const COLOR_GRID = 'hsl(var(--border))';
const COLOR_AXIS = 'hsl(var(--muted-foreground))';

export function MonthlyFlowChart({
  data,
}: {
  data: { month: number; receitas: number; despesas: number }[];
}) {
  const chartData = data.map((d) => ({
    month: MONTH_LABELS[d.month - 1].slice(0, 3),
    Receitas: d.receitas,
    Despesas: -d.despesas,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barCategoryGap={12}>
        <CartesianGrid vertical={false} stroke={COLOR_GRID} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: COLOR_AXIS }} axisLine={{ stroke: COLOR_GRID }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: COLOR_AXIS }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatBRL(v)}
          width={90}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatBRL(Math.abs(value)), name]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Receitas" fill={COLOR_RECEITAS} radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Despesas" fill={COLOR_DESPESAS} radius={[0, 0, 3, 3]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
