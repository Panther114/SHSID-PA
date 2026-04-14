import { useState, useCallback } from 'react';
import type { Theme } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = localStorage.getItem('pa-theme');
    return t === 'light' ? 'light' : t === 'pink' ? 'pink' : 'dark';
  });

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : prev === 'light' ? 'pink' : 'dark';
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (next === 'pink') document.documentElement.setAttribute('data-theme', 'pink');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('pa-theme', next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
