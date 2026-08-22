import { Button } from '@conciliacao/web';

const row: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' };

export function Variantes() {
  return (
    <div style={row}>
      <Button>Conciliar</Button>
      <Button variant="secondary">Classificar</Button>
      <Button variant="outline">Filtrar</Button>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="destructive">Excluir</Button>
      <Button variant="link">Ver detalhes</Button>
    </div>
  );
}

export function Tamanhos() {
  return (
    <div style={row}>
      <Button size="sm">Pequeno</Button>
      <Button size="default">Padrão</Button>
      <Button size="lg">Grande</Button>
    </div>
  );
}

export function Estados() {
  return (
    <div style={row}>
      <Button>Salvar alterações</Button>
      <Button disabled>Processando…</Button>
    </div>
  );
}
