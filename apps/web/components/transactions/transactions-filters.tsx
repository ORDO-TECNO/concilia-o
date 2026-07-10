'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankAccounts } from '@/lib/hooks/use-bank-accounts';
import { useCategoriesFlat } from '@/lib/hooks/use-categories';
import { MONTH_LABELS, ReconciliationStatus } from '@conciliacao/shared';
import type { TransactionFilters } from '@/lib/hooks/use-transactions';

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONCILIADO: 'Conciliado',
  IGNORADO: 'Ignorado',
  DUPLICADO: 'Duplicado',
};

const ALL = '__all__';

export function TransactionsFilters({
  companyId,
  filters,
  onChange,
}: {
  companyId: string;
  filters: TransactionFilters;
  onChange: (patch: Partial<TransactionFilters>) => void;
}) {
  const { data: bankAccounts } = useBankAccounts(companyId);
  const { data: categories } = useCategoriesFlat(companyId);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-48 space-y-1">
        <label className="text-xs text-muted-foreground">Conta</label>
        <Select
          value={filters.bankAccountId ?? ALL}
          onValueChange={(v) => onChange({ bankAccountId: v === ALL ? undefined : v, page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as contas</SelectItem>
            {bankAccounts?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.apelido ?? acc.conta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-32 space-y-1">
        <label className="text-xs text-muted-foreground">Ano</label>
        <Select
          value={filters.year ? String(filters.year) : ALL}
          onValueChange={(v) => onChange({ year: v === ALL ? undefined : Number(v), page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40 space-y-1">
        <label className="text-xs text-muted-foreground">Mês</label>
        <Select
          value={filters.month ? String(filters.month) : ALL}
          onValueChange={(v) => onChange({ month: v === ALL ? undefined : Number(v), page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {MONTH_LABELS.map((label, i) => (
              <SelectItem key={label} value={String(i + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-48 space-y-1">
        <label className="text-xs text-muted-foreground">Categoria</label>
        <Select
          value={filters.categoryId ?? ALL}
          onValueChange={(v) => onChange({ categoryId: v === ALL ? undefined : v, page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40 space-y-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <Select
          value={filters.status ?? ALL}
          onValueChange={(v) =>
            onChange({ status: v === ALL ? undefined : (v as ReconciliationStatus), page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-64 space-y-1">
        <label className="text-xs text-muted-foreground">Buscar descrição</label>
        <SearchInput value={filters.search} onChange={(v) => onChange({ search: v, page: 1 })} />
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const [local, setLocal] = React.useState(value ?? '');

  React.useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (local !== (value ?? '')) onChange(local || undefined);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <Input
      placeholder="Ex: PIX, fornecedor..."
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}
