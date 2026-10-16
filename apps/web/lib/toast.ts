/**
 * Store mínimo de notificações (sem dependência externa). Qualquer código —
 * inclusive fora de componentes, como o handler global de erro de mutação —
 * chama `toast()`; o <Toaster /> assina o store e renderiza.
 */
export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type Listener = (items: ToastItem[]) => void;

const DISMISS_AFTER_MS = 6000;
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(message: string, variant: ToastVariant = 'info'): number {
  const id = nextId++;
  // Mesma mensagem já visível (ex: duplo clique) não empilha.
  if (items.some((t) => t.message === message && t.variant === variant)) return id;
  items = [...items, { id, message, variant }];
  emit();
  setTimeout(() => dismissToast(id), DISMISS_AFTER_MS);
  return id;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): ToastItem[] {
  return items;
}
