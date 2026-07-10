'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatBRL, formatDateBR } from '@conciliacao/shared';
import type { TransactionDTO } from '@conciliacao/shared';
import type { CategoryNode } from '@/lib/hooks/use-categories';

const STATUS_VARIANT: Record<string, 'secondary' | 'success' | 'outline' | 'destructive'> = {
  PENDENTE: 'secondary',
  CONCILIADO: 'success',
  IGNORADO: 'outline',
  DUPLICADO: 'destructive',
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONCILIADO: 'Conciliado',
  IGNORADO: 'Ignorado',
  DUPLICADO: 'Duplicado',
};

function flattenCategories(nodes: CategoryNode[] = [], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id, label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenCategories(n.children, depth + 1),
  ]);
}

export function TransactionsTable({
  data,
  categories,
  rowSelection,
  onRowSelectionChange,
  onCategoryChange,
  onStatusChange,
}: {
  data: TransactionDTO[];
  categories: CategoryNode[] | undefined;
  rowSelection: RowSelectionState;
  onRowSelectionChange: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onCategoryChange: (id: string, categoryId: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const categoryOptions = React.useMemo(() => flattenCategories(categories), [categories]);

  const columns = React.useMemo<ColumnDef<TransactionDTO>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Selecionar linha"
          />
        ),
      },
      {
        accessorKey: 'date',
        header: 'Data',
        cell: ({ row }) => formatDateBR(row.original.date),
      },
      {
        accessorKey: 'description',
        header: 'Descrição',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <p className="truncate text-sm">{row.original.description}</p>
            {row.original.partyName && (
              <p className="truncate text-xs text-muted-foreground">{row.original.partyName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Valor',
        cell: ({ row }) => {
          const amount = Number(row.original.amount);
          return (
            <span className={amount >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
              {formatBRL(amount)}
            </span>
          );
        },
      },
      {
        id: 'category',
        header: 'Categoria',
        cell: ({ row }) => (
          <Select
            value={row.original.categoryId ?? ''}
            onValueChange={(v) => onCategoryChange(row.original.id, v)}
          >
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="Classificar..." />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Select value={row.original.status} onValueChange={(v) => onStatusChange(row.original.id, v)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue>
                <Badge variant={STATUS_VARIANT[row.original.status]}>
                  {STATUS_LABELS[row.original.status]}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ],
    [categoryOptions, onCategoryChange, onStatusChange],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange,
    getRowId: (row) => row.id,
    manualPagination: true,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
              Nenhum lançamento encontrado.
            </TableCell>
          </TableRow>
        )}
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
