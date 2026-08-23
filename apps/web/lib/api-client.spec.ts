/**
 * Tests for the refreshAccessToken() dedupe behavior.
 *
 * The key invariant: concurrent calls to refreshAccessToken() must share a
 * single in-flight fetch rather than sending multiple requests. Without this,
 * React.StrictMode's double-invocation in dev can trigger two refreshes in
 * quick succession — the second uses a token already rotated by the first,
 * trips reuse detection, and wipes the whole session.
 */

// Mock fetch globally before importing the module under test so the module
// captures the mock reference.
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { refreshAccessToken } from './api-client';
import { getAccessToken, setAccessToken } from './auth/token-store';

function makeJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('refreshAccessToken', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Clear token state between tests.
    setAccessToken(null);
  });

  it('chama fetch uma única vez e armazena o token retornado', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ accessToken: 'new-token' }));

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('new-token');
  });

  it('dedupe: N chamadas simultâneas disparam apenas um fetch', async () => {
    // Use a deferred promise to keep the in-flight request open long enough
    // that all N concurrent calls see refreshPromise !== null.
    let resolveRefresh!: (v: Response) => void;
    const refreshDone = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    mockFetch.mockReturnValueOnce(refreshDone);

    // Fire three concurrent calls before the fetch resolves.
    const [r1, r2, r3] = await Promise.all([
      (() => {
        const p = refreshAccessToken();
        // Resolve the fetch after all three callers have attached.
        resolveRefresh(makeJsonResponse({ accessToken: 'shared-token' }));
        return p;
      })(),
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(r3).toBe(true);
    expect(getAccessToken()).toBe('shared-token');
  });

  it('limpa o token e retorna false quando o servidor responde com erro', async () => {
    setAccessToken('stale-token');
    mockFetch.mockResolvedValueOnce(makeJsonResponse(null, false));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it('limpa o token e retorna false quando fetch lança (rede indisponível)', async () => {
    setAccessToken('stale-token');
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it('a segunda chamada após a primeira concluir dispara um novo fetch', async () => {
    mockFetch
      .mockResolvedValueOnce(makeJsonResponse({ accessToken: 'first-token' }))
      .mockResolvedValueOnce(makeJsonResponse({ accessToken: 'second-token' }));

    await refreshAccessToken();
    expect(getAccessToken()).toBe('first-token');

    await refreshAccessToken();
    expect(getAccessToken()).toBe('second-token');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
