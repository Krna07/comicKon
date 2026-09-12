import { useEffect, useState } from 'react';

const THEME_KEY = 'dhuaa_theme';

export function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-theme') || readTheme())
      : 'dark'
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggleTheme };
}
