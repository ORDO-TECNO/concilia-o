import { getAccessToken, setAccessToken } from './token-store';

describe('token-store', () => {
  afterEach(() => {
    // Reset module state between tests by clearing the token.
    setAccessToken(null);
  });

  it('retorna null antes de qualquer set', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('armazena e recupera o token corretamente', () => {
    setAccessToken('my-jwt-token');
    expect(getAccessToken()).toBe('my-jwt-token');
  });

  it('sobrescreve o token existente', () => {
    setAccessToken('first-token');
    setAccessToken('second-token');
    expect(getAccessToken()).toBe('second-token');
  });

  it('limpa o token ao receber null', () => {
    setAccessToken('some-token');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
