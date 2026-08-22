import { Badge } from '@conciliacao/web';

const row: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' };

export function Variantes() {
  return (
    <div style={row}>
      <Badge>Padrão</Badge>
      <Badge variant="secondary">Secundário</Badge>
      <Badge variant="success">Sucesso</Badge>
      <Badge variant="destructive">Erro</Badge>
      <Badge variant="outline">Contorno</Badge>
    </div>
  );
}

export function StatusDeConciliacao() {
  return (
    <div style={row}>
      <Badge variant="success">Conciliado</Badge>
      <Badge variant="outline">Pendente</Badge>
      <Badge variant="secondary">Classificado</Badge>
      <Badge variant="destructive">Duplicado</Badge>
    </div>
  );
}
