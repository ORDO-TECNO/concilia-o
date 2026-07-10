'use client';

import * as React from 'react';
import { apiFetch, ApiError, refreshAccessToken } from '../api-client';
import { setAccessToken } from './token-store';

export interface AuthCompany {
  id: string;
  name: string;
  role: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  companies: AuthCompany[];
}

interface LoginResponse {
  user: { id: string; name: string; email: string };
  accessToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  currentCompanyId: string | null;
  setCurrentCompanyId: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentCompanyId, setCurrentCompanyId] = React.useState<string | null>(null);

  const loadMe = React.useCallback(async () => {
    const me = await apiFetch<AuthUser>('/auth/me');
    setUser(me);
    setCurrentCompanyId((prev) => prev ?? me.companies[0]?.id ?? null);
  }, []);

  React.useEffect(() => {
    // Usa o singleton de dedup de refreshAccessToken (não apiFetch direto) para que o
    // duplo-disparo do efeito em React.StrictMode (dev) vire uma única requisição de
    // rede em voo, em vez de duas chamadas concorrentes de refresh — a segunda delas
    // usaria um refresh token já rotacionado pela primeira e acionaria a detecção de
    // reuso no backend, derrubando a sessão inteira.
    (async () => {
      try {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          setUser(null);
          return;
        }
        await loadMe();
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuthRetry: true,
      });
      setAccessToken(data.accessToken);
      await loadMe();
    },
    [loadMe],
  );

  const register = React.useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiFetch<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        skipAuthRetry: true,
      });
      setAccessToken(data.accessToken);
      await loadMe();
    },
    [loadMe],
  );

  const logout = React.useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setCurrentCompanyId(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      currentCompanyId,
      setCurrentCompanyId,
      login,
      register,
      logout,
      refetchMe: loadMe,
    }),
    [user, loading, currentCompanyId, login, register, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  return 'Erro inesperado. Tente novamente.';
}
