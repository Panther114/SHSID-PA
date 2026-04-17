import { useState, useCallback } from 'react';

function parseJwt(token: string) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp: number; role?: 'admin' | 'student' };
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const p = parseJwt(token);
  return p != null && p.exp * 1000 > Date.now();
}

export function getTokenRole(token: string | null): 'admin' | 'student' | null {
  const payload = token ? parseJwt(token) : null;
  if (!payload || payload.exp * 1000 <= Date.now()) return null;
  return payload.role === 'admin' || payload.role === 'student' ? payload.role : null;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('jwt');
    if (!isTokenValid(stored)) {
      localStorage.removeItem('jwt');
      return null;
    }
    return stored;
  });
  const authed = isTokenValid(token);
  const role = getTokenRole(token);

  const login = useCallback((tok: string) => {
    localStorage.setItem('jwt', tok);
    setToken(tok);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setToken(null);
  }, []);

  return { token, authed, role, login, logout };
}
