import { useState, useCallback } from 'react';

function parseJwt(token: string) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp: number };
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const p = parseJwt(token);
  return p != null && p.exp * 1000 > Date.now();
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt'));
  const authed = isTokenValid(token);

  const login = useCallback((tok: string) => {
    localStorage.setItem('jwt', tok);
    setToken(tok);
  }, []);

  return { token, authed, login };
}
