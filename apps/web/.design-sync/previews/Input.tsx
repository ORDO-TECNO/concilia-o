import { Input, Label } from '@conciliacao/web';

export function ComRotulo() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 260 }}>
      <Label htmlFor="cnpj">CNPJ do fornecedor</Label>
      <Input id="cnpj" placeholder="00.000.000/0000-00" />
    </div>
  );
}

export function Estados() {
  return (
    <div style={{ display: 'grid', gap: 10, width: 260 }}>
      <Input placeholder="Buscar lançamento…" />
      <Input type="number" defaultValue="4820" />
      <Input placeholder="Campo desabilitado" disabled />
    </div>
  );
}
