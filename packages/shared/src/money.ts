const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBRL(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return BRL_FORMATTER.format(Number.isFinite(num) ? num : 0);
}

export function toCents(value: number): number {
  return Math.round(value * 100);
}
