import { isValidCnpj, isValidCpf, isValidCpfOrCnpj, onlyDigits } from '@conciliacao/shared';

describe('documentos (packages/shared)', () => {
  it('remove a máscara', () => {
    expect(onlyDigits('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('valida CNPJ com e sem máscara', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });

  it('valida CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('529.982.247-24')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('isValidCpfOrCnpj decide pelo tamanho', () => {
    expect(isValidCpfOrCnpj('52998224725')).toBe(true);
    expect(isValidCpfOrCnpj('11222333000181')).toBe(true);
    expect(isValidCpfOrCnpj('123')).toBe(false);
  });
});
