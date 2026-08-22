import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@conciliacao/web';

export function ContaBancaria() {
  return (
    <Select open defaultValue="itau">
      <SelectTrigger style={{ width: 260 }}>
        <SelectValue placeholder="Selecione a conta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="itau">Itaú · Conta Corrente</SelectItem>
        <SelectItem value="nubank">Nubank · PJ</SelectItem>
        <SelectItem value="bradesco">Bradesco · Poupança</SelectItem>
      </SelectContent>
    </Select>
  );
}
