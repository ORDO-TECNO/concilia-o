'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useAuth, extractErrorMessage } from '@/lib/auth/auth-context';
import { GoogleButton } from '@/components/auth/google-button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(
    searchParams.get('error') === 'oauth'
      ? 'Não foi possível entrar com o Google. Tente novamente.'
      : null,
  );
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-white/10 bg-neutral p-7 shadow-2xl shadow-black/30">
        <h2 className="text-xl font-bold tracking-tight text-neutral-content">Bem-vindo de volta</h2>
        <p className="mt-1 text-sm text-neutral-content/60">Entre para acessar sua conciliação</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="form-control">
            <label className="label py-1" htmlFor="email">
              <span className="label-text text-xs font-medium text-neutral-content/60">E-mail</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="input input-bordered w-full border-white/15 bg-white/5 text-neutral-content placeholder:text-neutral-content/30 focus:input-primary"
              autoComplete="email"
            />
          </div>
          <div className="form-control">
            <label className="label py-1" htmlFor="password">
              <span className="label-text text-xs font-medium text-neutral-content/60">Senha</span>
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input input-bordered w-full border-white/15 bg-white/5 text-neutral-content placeholder:text-neutral-content/30 focus:input-primary"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</div>
          )}

          <button type="submit" className="btn btn-primary w-full gap-2 rounded-full" disabled={submitting}>
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-neutral-content/40">
          <span className="h-px flex-1 bg-white/10" />
          ou
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleButton label="Continuar com Google" />

        <p className="mt-6 text-center text-sm text-neutral-content/60">
          Não tem conta?{' '}
          <Link href="/register" className="link link-primary font-medium no-underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
