import { isNonMovement } from './non-movement';

describe('isNonMovement', () => {
  it.each(['SALDO ANTERIOR', 'Saldo do dia', 'S A L D O', 'SALDO FINAL 31/07/2026', 'Saldo disponível', 'SALDO'])(
    'reconhece "%s" como linha de saldo',
    (description) => {
      expect(isNonMovement({ description, amount: 1500 })).toBe(true);
    },
  );

  it.each(['SALDO DEVEDOR JUROS', 'PIX RECEBIDO SALDO', 'TARIFA PACOTE'])('não descarta movimentação real "%s"', (description) => {
    expect(isNonMovement({ description, amount: -10 })).toBe(false);
  });

  it('descarta lançamentos de valor zero', () => {
    expect(isNonMovement({ description: 'AVISO', amount: 0 })).toBe(true);
  });
});
