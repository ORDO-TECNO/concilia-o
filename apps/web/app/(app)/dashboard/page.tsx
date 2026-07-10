'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDashboardSummary } from '@/lib/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthlyFlowChart } from '@/components/dashboard/monthly-flow-chart';
import { MonthlyBalanceChart } from '@/components/dashboard/monthly-balance-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { TopCategoriesList } from '@/components/dashboard/top-categories-list';
import { formatBRL } from '@conciliacao/shared';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
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

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Receitas no ano</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-success">
                {formatBRL(totals?.receitas ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Despesas no ano</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-destructive">
                {formatBRL(totals?.despesas ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Saldo no ano</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatBRL(totals?.saldo ?? 0)}</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receitas x Despesas por mês</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyFlowChart data={data.monthly} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Saldo mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBalanceChart data={data.monthly} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={data.categoryDistribution} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <TopCategoriesList data={data.topCategories} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
