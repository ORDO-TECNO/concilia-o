import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@conciliacao/web';

const rows = [
  { data: '02/08', desc: 'PIX recebido — Cliente Aurora Ltda', valor: '+ R$ 4.820,00', status: 'Conciliado', v: 'success' as const },
  { data: '03/08', desc: 'Tarifa bancária mensal', valor: '- R$ 79,90', status: 'Classificado', v: 'secondary' as const },
  { data: '04/08', desc: 'Pagamento fornecedor — Nexus Papelaria', valor: '- R$ 1.240,50', status: 'Pendente', v: 'outline' as const },
  { data: '05/08', desc: 'Transferência recebida — TED', valor: '+ R$ 12.000,00', status: 'Duplicado', v: 'destructive' as const },
];

export function Lancamentos() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead style={{ textAlign: 'right' }}>Valor</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.desc}>
            <TableCell style={{ whiteSpace: 'nowrap', color: 'hsl(var(--muted-foreground))' }}>{r.data}</TableCell>
            <TableCell style={{ fontWeight: 500 }}>{r.desc}</TableCell>
            <TableCell style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.valor}</TableCell>
            <TableCell>
              <Badge variant={r.v}>{r.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
