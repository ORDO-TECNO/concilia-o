'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useAuth, extractErrorMessage } from '@/lib/auth/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
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
        <h2 className="text-xl font-bold tracking-tight text-neutral-content">Criar conta</h2>
        <p className="mt-1 text-sm text-neutral-content/60">
          Comece a conciliar seus lançamentos em minutos
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="form-control">
            <label className="label py-1" htmlFor="name">
              <span className="label-text text-xs font-medium text-neutral-content/60">Nome</span>
            </label>
            <input
              id="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="input input-bordered w-full border-white/15 bg-white/5 text-neutral-content placeholder:text-neutral-content/30 focus:input-primary"
              autoComplete="name"
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 8 caracteres"
              className="input input-bordered w-full border-white/15 bg-white/5 text-neutral-content placeholder:text-neutral-content/30 focus:input-primary"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</div>
          )}

          <button type="submit" className="btn btn-primary w-full gap-2 rounded-full" disabled={submitting}>
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {submitting ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-content/60">
          Já tem conta?{' '}
          <Link href="/login" className="link link-primary font-medium no-underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
