import { statementMatchesAccount } from './account-match';

describe('statementMatchesAccount', () => {
  it.each([
    ['12345-6', { conta: '12345', contaDigito: '6' }],
    ['000123456', { conta: '12345', contaDigito: '6' }],
    ['12345', { conta: '12345-6' }],
    ['0001/12345-6', { conta: '12345', contaDigito: '6' }],
  ])('aceita ACCTID %s para a conta cadastrada', (acctId, account) => {
    expect(statementMatchesAccount(acctId, account)).toBe(true);
  });

  it('rejeita extrato de outra conta', () => {
    expect(statementMatchesAccount('98765-4', { conta: '12345', contaDigito: '6' })).toBe(false);
  });

  it('não bloqueia quando o arquivo não informa a conta', () => {
    expect(statementMatchesAccount(undefined, { conta: '12345' })).toBe(true);
  });
});
