import { Label, Input, Checkbox } from '@conciliacao/web';

export function ComCampo() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="regra">Descrição da regra</Label>
      <Input id="regra" placeholder="Ex.: PIX recebido → Receita de Vendas" />
    </div>
  );
}

export function ComCheckbox() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Checkbox id="aplicar" defaultChecked />
      <Label htmlFor="aplicar">Aplicar regra aos lançamentos existentes</Label>
    </div>
  );
}
