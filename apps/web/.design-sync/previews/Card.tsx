import { Card, CardHeader, CardTitle, CardContent } from '@conciliacao/web';

const muted = 'hsl(var(--muted-foreground))';

export function Indicador() {
  return (
    <Card style={{ width: 260 }}>
      <CardHeader>
        <CardTitle>Saldo conciliado</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>R$ 148.320,75</div>
        <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>+8,2% vs. mês anterior</div>
      </CardContent>
    </Card>
  );
}

export function Resumo() {
  return (
    <Card style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Importação de extrato</CardTitle>
      </CardHeader>
      <CardContent style={{ fontSize: 14, lineHeight: 1.5 }}>
        128 lançamentos importados · 96 conciliados automaticamente · 32 pendentes de revisão.
      </CardContent>
    </Card>
  );
}
