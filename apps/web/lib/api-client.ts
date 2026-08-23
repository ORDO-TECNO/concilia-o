import { getAccessToken, setAccessToken } from './auth/token-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const HTTP_NO_CONTENT = 204;

function extractMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    return String((body as Record<string, unknown>).message);
  }
  return 'Erro na API';
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(extractMessage(body));
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null);
          return false;
        }
        const data = await res.json();
        setAccessToken(data.accessToken);
        return true;
      })
      .catch(() => {
        setAccessToken(null);
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface ApiFetchOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

async function fetchWithAuthRetry(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuthRetry, headers, ...rest } = options;
  const token = getAccessToken();

  const doFetch = (authToken: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(rest.body && !(rest.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
    });

  let res = await doFetch(token);

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch(getAccessToken());
    }
  }

  return res;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await fetchWithAuthRetry(path, options);

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }

  return res.json();
}

/** Baixa um arquivo (export CSV/XLSX) e dispara o download no navegador. */
export async function downloadFile(path: string, fallbackFilename: string): Promise<void> {
  const res = await fetchWithAuthRetry(path);

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(res.status, body);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export { refreshAccessToken };
