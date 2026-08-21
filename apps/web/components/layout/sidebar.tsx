'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  Upload,
  TableProperties,
  Wand2,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tour: 'nav-dashboard' },
  { href: '/lancamentos', label: 'Lançamentos', icon: ListChecks, tour: 'nav-lancamentos' },
  { href: '/importar', label: 'Importar', icon: Upload, tour: 'nav-importar' },
  { href: '/dfc', label: 'DFC', icon: TableProperties, tour: 'nav-dfc' },
  { href: '/regras', label: 'Regras', icon: Wand2, tour: 'nav-regras' },
  { href: '/cadastros', label: 'Cadastros', icon: Settings, tour: 'nav-cadastros' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-base-300 bg-base-100 md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-content shadow-md shadow-primary/30">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-base-content">Ordo</p>
          <p className="text-[11px] text-muted-foreground">Bancária Inteligente</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-base-200 hover:text-base-content',
                active && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] text-muted-foreground/70">
        Fase 1 · MVP
      </div>
    </aside>
  );
}
