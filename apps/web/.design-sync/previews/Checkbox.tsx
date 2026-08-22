import { Checkbox, Label } from '@conciliacao/web';

const item: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };

export function Estados() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={item}>
        <Checkbox id="c1" defaultChecked />
        <Label htmlFor="c1">Marcado como conciliado</Label>
      </div>
      <div style={item}>
        <Checkbox id="c2" />
        <Label htmlFor="c2">Ignorar lançamentos duplicados</Label>
      </div>
      <div style={item}>
        <Checkbox id="c3" defaultChecked disabled />
        <Label htmlFor="c3">Bloqueado pelo sistema</Label>
      </div>
    </div>
  );
}
