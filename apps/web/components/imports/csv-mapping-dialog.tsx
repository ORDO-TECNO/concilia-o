'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CsvMapping } from '@/lib/hooks/use-imports';

interface CsvPreviewData {
  headers: string[];
  sampleRows: string[][];
  suggestedMapping: Partial<Record<keyof CsvMapping, string>>;
  delimiter: string;
}

const NONE = '__none__';

export function CsvMappingDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: CsvPreviewData | null;
  onConfirm: (mapping: CsvMapping) => void;
  submitting: boolean;
}) {
  const [dateColumn, setDateColumn] = React.useState<string>('');
  const [descriptionColumn, setDescriptionColumn] = React.useState<string>('');
  const [amountColumn, setAmountColumn] = React.useState<string>('');
  const [documentColumn, setDocumentColumn] = React.useState<string>(NONE);
  const [balanceColumn, setBalanceColumn] = React.useState<string>(NONE);
  const [creditDebitColumn, setCreditDebitColumn] = React.useState<string>(NONE);
  const [dateFormat, setDateFormat] = React.useState<CsvMapping['dateFormat']>('DD/MM/YYYY');
  const [decimalSeparator, setDecimalSeparator] = React.useState<CsvMapping['decimalSeparator']>(',');

  React.useEffect(() => {
    if (preview) {
      setDateColumn(preview.suggestedMapping.dateColumn ?? preview.headers[0] ?? '');
      setDescriptionColumn(preview.suggestedMapping.descriptionColumn ?? preview.headers[0] ?? '');
      setAmountColumn(preview.suggestedMapping.amountColumn ?? preview.headers[0] ?? '');
      setDocumentColumn(preview.suggestedMapping.documentColumn ?? NONE);
      setBalanceColumn(preview.suggestedMapping.balanceColumn ?? NONE);
      setCreditDebitColumn(preview.suggestedMapping.creditDebitColumn ?? NONE);
    }
  }, [preview]);

  if (!preview) return null;

  function handleConfirm() {
    if (!preview) return;
    onConfirm({
      dateColumn,
      descriptionColumn,
      amountColumn,
      documentColumn: documentColumn === NONE ? undefined : documentColumn,
      balanceColumn: balanceColumn === NONE ? undefined : balanceColumn,
      creditDebitColumn: creditDebitColumn === NONE ? undefined : creditDebitColumn,
      delimiter: preview.delimiter,
      dateFormat,
      decimalSeparator,
    });
  }

  const columnSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    allowNone = false,
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value={NONE}>(não usar)</SelectItem>}
          {preview.headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirme o mapeamento de colunas do CSV</DialogTitle>
        </DialogHeader>

        <div className="max-h-40 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {preview.headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.sampleRows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {columnSelect('Coluna de data', dateColumn, setDateColumn)}
          {columnSelect('Coluna de descrição/histórico', descriptionColumn, setDescriptionColumn)}
          {columnSelect('Coluna de valor', amountColumn, setAmountColumn)}
          {columnSelect('Coluna de documento', documentColumn, setDocumentColumn, true)}
          {columnSelect('Coluna de saldo', balanceColumn, setBalanceColumn, true)}
          {columnSelect('Coluna de tipo (C/D)', creditDebitColumn, setCreditDebitColumn, true)}

          <div className="space-y-1.5">
            <Label>Formato da data</Label>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as CsvMapping['dateFormat'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Separador decimal</Label>
            <Select
              value={decimalSeparator}
              onValueChange={(v) => setDecimalSeparator(v as CsvMapping['decimalSeparator'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Vírgula (1.234,56)</SelectItem>
                <SelectItem value=".">Ponto (1,234.56)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={submitting || !dateColumn || !descriptionColumn || !amountColumn}>
            {submitting ? 'Importando...' : 'Confirmar e importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
