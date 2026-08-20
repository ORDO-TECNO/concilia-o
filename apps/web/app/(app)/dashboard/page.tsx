'use client';

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDashboardSummary } from '@/lib/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthlyFlowChart } from '@/components/dashboard/monthly-flow-chart';
import { MonthlyBalanceChart } from '@/components/dashboard/monthly-balance-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { TopCategoriesList } from '@/components/dashboard/top-categories-list';
import { formatBRL } from '@conciliacao/shared';

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: 'success' | 'destructive' | 'primary';
}) {
  const toneClasses = {
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    primary: 'bg-primary/10 text-primary',
  }[tone];

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-base-content">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-base-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-base-content">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return <div className="skeleton h-[240px] w-full rounded-lg bg-base-200" />;
}

export default function DashboardPage() {
  const { currentCompanyId } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = React.useState(currentYear);
  const { data, isLoading } = useDashboardSummary(currentCompanyId, year);
  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  const totals = data?.monthly.reduce(
    (acc, m) => ({ receitas: acc.receitas + m.receitas, despesas: acc.despesas + m.despesas, saldo: acc.saldo + m.saldo }),
    { receitas: 0, despesas: 0, saldo: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-base-content">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Panorama financeiro do ano selecionado</p>
        </div>
        <div className="w-32">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-[104px] w-full rounded-xl bg-base-200" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="Receitas no ano" value={formatBRL(totals?.receitas ?? 0)} icon={ArrowUpRight} tone="success" />
            <KpiCard label="Despesas no ano" value={formatBRL(totals?.despesas ?? 0)} icon={ArrowDownRight} tone="destructive" />
            <KpiCard label="Saldo no ano" value={formatBRL(totals?.saldo ?? 0)} icon={Scale} tone="primary" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Receitas x Despesas por mês" subtitle="Comparativo mensal do fluxo classificado">
              <MonthlyFlowChart data={data.monthly} />
            </ChartCard>
            <ChartCard title="Saldo mensal" subtitle="Resultado líquido mês a mês">
              <MonthlyBalanceChart data={data.monthly} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Distribuição por categoria" subtitle="Participação de cada categoria no total">
              <CategoryPieChart data={data.categoryDistribution} />
            </ChartCard>
            <ChartCard title="Top 5 categorias" subtitle="Maiores volumes classificados no ano">
              <TopCategoriesList data={data.topCategories} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
