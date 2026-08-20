'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatBRL, MONTH_LABELS } from '@conciliacao/shared';

const COLOR_POSITIVE = 'hsl(var(--primary))';
const COLOR_NEGATIVE = 'hsl(var(--destructive))';
const COLOR_GRID = 'hsl(var(--border))';
const COLOR_AXIS = 'hsl(var(--muted-foreground))';

export function MonthlyBalanceChart({ data }: { data: { month: number; saldo: number }[] }) {
  const chartData = data.map((d) => ({ month: MONTH_LABELS[d.month - 1].slice(0, 3), saldo: d.saldo }));

  return (
    <ResponsiveContainer width="100%" height={240}>
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
          formatter={(value: number) => [formatBRL(value), 'Saldo']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
          }}
        />
        <Bar dataKey="saldo" radius={[3, 3, 3, 3]} maxBarSize={28}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.saldo >= 0 ? COLOR_POSITIVE : COLOR_NEGATIVE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
