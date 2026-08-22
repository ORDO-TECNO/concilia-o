'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useBankAccounts } from '@/lib/hooks/use-bank-accounts';
import { useCsvPreview, useImportStatement, type CsvMapping } from '@/lib/hooks/use-imports';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CsvMappingDialog } from '@/components/imports/csv-mapping-dialog';
import { competenceLabel, formatBRL, MONTH_LABELS } from '@conciliacao/shared';
import { extractErrorMessage } from '@/lib/auth/auth-context';
import type { ImportSummary } from '@conciliacao/shared';

export default function ImportarPage() {
  const { currentCompanyId } = useAuth();
  const { data: bankAccounts } = useBankAccounts(currentCompanyId);
  const [bankAccountId, setBankAccountId] = React.useState<string>('');
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [mappingOpen, setMappingOpen] = React.useState(false);
  const [csvPreviewData, setCsvPreviewData] = React.useState<any>(null);
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const csvPreview = useCsvPreview(currentCompanyId);
  const importStatement = useImportStatement(currentCompanyId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !bankAccountId) return;
    setError(null);
    setSummary(null);

    const isOfx = /\.ofx$/i.test(file.name);
    try {
      if (isOfx) {
        const result = await importStatement.mutateAsync({ file, bankAccountId, source: 'OFX' });
        setSummary(result);
      } else {
        setPendingFile(file);
        const preview = await csvPreview.mutateAsync(file);
        setCsvPreviewData(preview);
        setMappingOpen(true);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleConfirmMapping(mapping: CsvMapping) {
    if (!pendingFile) return;
    setError(null);
    try {
      const result = await importStatement.mutateAsync({
        file: pendingFile,
        bankAccountId,
        source: 'CSV',
        mapping,
      });
      setSummary(result);
      setMappingOpen(false);
      setPendingFile(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Importar extrato</h1>

      <Card>
        <CardHeader>
          <CardTitle>Novo arquivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-1.5">
            <Label>Conta bancária</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.apelido ?? `${acc.bankName ?? ''} ${acc.conta}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Arquivo (.csv ou .ofx)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx"
              disabled={!bankAccountId || csvPreview.isPending || importStatement.isPending}
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
            />
          </div>

          {(csvPreview.isPending || importStatement.isPending) && (
            <p className="text-sm text-muted-foreground">Processando arquivo...</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da importação — {summary.originalFileName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryStat label="Total de registros" value={summary.totalRecords} />
              <SummaryStat label="Novos" value={summary.newRecords} highlight="success" />
              <SummaryStat label="Duplicados" value={summary.duplicateRecords} highlight="warning" />
              <SummaryStat label="Ignorados" value={summary.ignoredRecords} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Saldo inicial: </span>
                {summary.statementStartBalance !== null ? formatBRL(summary.statementStartBalance) : '—'}
              </div>
              <div>
                <span className="text-muted-foreground">Saldo final: </span>
                {summary.statementEndBalance !== null ? formatBRL(summary.statementEndBalance) : '—'}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Lançamentos</TableHead>
                  <TableHead>Saldo inicial</TableHead>
                  <TableHead>Saldo final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.periods?.map((p) => (
                  <TableRow key={`${p.year}-${p.month}`}>
                    <TableCell>
                      {MONTH_LABELS[p.month - 1]} de {p.year} ({competenceLabel(p.year, p.month)})
                    </TableCell>
                    <TableCell>{p.recordCount}</TableCell>
                    <TableCell>{p.openingBalance !== null ? formatBRL(p.openingBalance) : '—'}</TableCell>
                    <TableCell>{p.closingBalance !== null ? formatBRL(p.closingBalance) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CsvMappingDialog
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        preview={csvPreviewData}
        onConfirm={handleConfirmMapping}
        submitting={importStatement.isPending}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: 'success' | 'warning';
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          'text-2xl font-semibold ' +
          (highlight === 'success' ? 'text-success' : highlight === 'warning' ? 'text-amber-600' : '')
        }
      >
        {value}
      </p>
    </div>
  );
}
