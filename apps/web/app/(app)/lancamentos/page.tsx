'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RowSelectionState } from '@tanstack/react-table';
import { useAuth } from '@/lib/auth/auth-context';
import { useCategoryTree } from '@/lib/hooks/use-categories';
import {
  buildQuery,
  useBulkTransactions,
  useTransactions,
  useUpdateTransaction,
  type TransactionFilters,
} from '@/lib/hooks/use-transactions';
import { TransactionsFilters } from '@/components/transactions/transactions-filters';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { BulkActionsBar } from '@/components/transactions/bulk-actions-bar';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api-client';

const PAGE_SIZE = 50;

function parseFiltersFromSearchParams(params: URLSearchParams): TransactionFilters {
  return {
    bankAccountId: params.get('bankAccountId') ?? undefined,
    year: params.get('year') ? Number(params.get('year')) : undefined,
    month: params.get('month') ? Number(params.get('month')) : undefined,
    categoryId: params.get('categoryId') ?? undefined,
    status: (params.get('status') as any) ?? undefined,
    search: params.get('search') ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
    pageSize: PAGE_SIZE,
  };
}

export default function LancamentosPage() {
  const { currentCompanyId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const filters = React.useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);

  const { data, isLoading, isFetching } = useTransactions(currentCompanyId, filters);
  const { data: categoryTree } = useCategoryTree(currentCompanyId);
  const updateTransaction = useUpdateTransaction(currentCompanyId);
  const bulkTransactions = useBulkTransactions(currentCompanyId);

  function handleFilterChange(patch: Partial<TransactionFilters>) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && key !== 'pageSize') params.set(key, String(value));
    });
    router.push(`/lancamentos?${params.toString()}`);
    setRowSelection({});
  }

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  async function handleBulk(action: 'CONCILIAR' | 'IGNORAR' | 'EXCLUIR' | 'CATEGORIZAR', categoryId?: string) {
    if (action === 'EXCLUIR' && !confirm(`Excluir ${selectedIds.length} lançamento(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }
    await bulkTransactions.mutateAsync({ ids: selectedIds, action, categoryId });
    setRowSelection({});
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    const query = buildQuery({ ...filters, page: undefined, pageSize: undefined } as any);
    await downloadFile(
      `/companies/${currentCompanyId}/transactions/export?format=${format}${query ? `&${query}` : ''}`,
      `lancamentos.${format}`,
    );
  }

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lançamentos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
            Exportar Excel
          </Button>
        </div>
      </div>

      <TransactionsFilters companyId={currentCompanyId} filters={filters} onChange={handleFilterChange} />

      <BulkActionsBar
        count={selectedIds.length}
        categories={categoryTree}
        loading={bulkTransactions.isPending}
        onConciliar={() => handleBulk('CONCILIAR')}
        onIgnorar={() => handleBulk('IGNORAR')}
        onExcluir={() => handleBulk('EXCLUIR')}
        onCategorizar={(categoryId) => handleBulk('CATEGORIZAR', categoryId)}
      />

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <TransactionsTable
            data={data?.items ?? []}
            categories={categoryTree}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onCategoryChange={(id, categoryId) => updateTransaction.mutate({ id, input: { categoryId } })}
            onStatusChange={(id, status) => updateTransaction.mutate({ id, input: { status: status as any } })}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} lançamento(s) — página {filters.page} de {totalPages}
          {isFetching && ' · atualizando...'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => handleFilterChange({ page: filters.page - 1 })}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages}
            onClick={() => handleFilterChange({ page: filters.page + 1 })}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
