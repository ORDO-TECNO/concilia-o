'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getPreferredTheme, type ThemeMode } from '@/lib/theme';

export function ThemeToggle() {
  const [mode, setMode] = React.useState<ThemeMode>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMode(getPreferredTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className="btn btn-ghost btn-circle btn-sm text-muted-foreground hover:text-foreground"
    >
      {mounted && mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
