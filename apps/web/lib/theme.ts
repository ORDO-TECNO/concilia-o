const STORAGE_KEY = 'conciliacao-theme';

export type ThemeMode = 'light' | 'dark';

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-theme', mode === 'dark' ? 'concilianight' : 'concilia');
  window.localStorage.setItem(STORAGE_KEY, mode);
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : null;
}

export function getPreferredTheme(): ThemeMode {
  return getStoredTheme() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var m=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.classList.toggle('dark',m==='dark');r.setAttribute('data-theme',m==='dark'?'concilianight':'concilia');}catch(e){}})();`;
