import { dismissToast, getToasts, subscribeToasts, toast } from './toast';

describe('toast store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getToasts().forEach((t) => dismissToast(t.id));
  });
  afterEach(() => jest.useRealTimers());

  it('adiciona, notifica e remove automaticamente', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToasts(listener);
    toast('Falhou', 'error');
    expect(getToasts()).toEqual([expect.objectContaining({ message: 'Falhou', variant: 'error' })]);
    expect(listener).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(6000);
    expect(getToasts()).toHaveLength(0);
    unsubscribe();
  });

  it('não empilha a mesma mensagem duas vezes', () => {
    toast('Igual', 'error');
    toast('Igual', 'error');
    expect(getToasts()).toHaveLength(1);
  });
});
