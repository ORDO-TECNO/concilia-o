/**
 * Datas de lançamento são tratadas como data pura (sem hora/timezone).
 * Nunca usar `new Date(isoString)` diretamente no client para exibir essas
 * datas — isso pode deslocar o dia dependendo do timezone do navegador.
 */

export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function competenceLabel(year: number, month: number): string {
  return `${String(month).padStart(2, '0')}/${year}`;
}
