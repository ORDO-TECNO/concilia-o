'use client';

import { useRouter } from 'next/navigation';
import { HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/layout/theme-toggle';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Topbar({ onHelp }: { onHelp?: () => void }) {
  const router = useRouter();
  const { user, currentCompanyId, setCurrentCompanyId, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-base-300 bg-base-100 px-5">
      <div className="w-60">
        {user && user.companies.length > 0 ? (
          <Select value={currentCompanyId ?? undefined} onValueChange={setCurrentCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {user.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">Nenhuma empresa vinculada</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-tour="help-button"
          onClick={onHelp}
          aria-label="Reabrir tour de boas-vindas"
          className="btn btn-ghost btn-circle btn-sm text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <ThemeToggle />

        <div className="mx-2 h-6 w-px bg-base-300" />

        <div className="flex items-center gap-2 pr-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-content">
            {user ? initials(user.name) : ''}
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">{user?.name}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-outline btn-sm gap-1.5"
          aria-label="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
}
