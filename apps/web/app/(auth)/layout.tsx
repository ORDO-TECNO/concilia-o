'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { AuthMarketing } from '@/components/auth/auth-marketing';
import { applyDomOnlyTheme, getPreferredTheme } from '@/lib/theme';

const NAV_LINKS = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#roadmap', label: 'Roadmap' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname === '/register';
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // A tela de login/registro sempre usa o tema claro, mesmo se o modo
  // noturno estiver ativo dentro do app — ao sair, restaura a preferência.
  React.useEffect(() => {
    applyDomOnlyTheme('light');
    return () => {
      applyDomOnlyTheme(getPreferredTheme());
    };
  }, []);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-content shadow-md shadow-primary/30">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-base-content">Ordo</p>
              <p className="text-[11px] text-muted-foreground">Bancária Inteligente</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-base-content"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={isRegister ? '/login' : '/register'}
              className="hidden text-sm font-medium text-muted-foreground hover:text-base-content sm:inline"
            >
              {isRegister ? 'Já tem conta?' : 'Não tem conta?'}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn btn-primary btn-sm gap-1.5 rounded-full px-4"
              aria-expanded={open}
            >
              {isRegister ? 'Criar conta' : 'Entrar'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-4 top-16 z-50 mt-3 w-[calc(100%-2rem)] max-w-sm sm:right-6">
            {children}
          </div>
        </>
      )}

      <AuthMarketing onOpenAuth={() => setOpen(true)} />
    </div>
  );
}
