'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDfcReport } from '@/lib/hooks/use-dfc';
import { DfcPivotTable } from '@/components/dfc/dfc-pivot-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api-client';

export default function DfcPage() {
  const { currentCompanyId } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = React.useState(currentYear);
  const { data: report, isLoading } = useDfcReport(currentCompanyId, year);
  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    await downloadFile(
      `/companies/${currentCompanyId}/dfc/export?year=${year}&format=${format}`,
      `dfc-${year}.${format}`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-base-content">Demonstração do fluxo de caixa</h1>
          <p className="text-sm text-muted-foreground">DFC consolidada por mês e categoria</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
            Exportar Excel
          </Button>
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
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs text-muted-foreground">
        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        Saldo inicial e final representam o acumulado do fluxo de caixa classificado dentro do ano
        selecionado (não é o saldo bancário real da conta, que depende dos extratos importados).
      </div>

      {isLoading && <div className="skeleton h-96 w-full rounded-xl bg-base-200" />}
      {report && <DfcPivotTable report={report} />}
    </div>
  );
}
