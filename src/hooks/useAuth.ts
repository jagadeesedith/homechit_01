import { useState, useCallback } from 'react';
import { isAuthenticated, setAuthenticated, logout as doLogout } from '@/lib/storage';

export function useAuth() {
  const [auth, setAuth] = useState(isAuthenticated);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin') {
      setAuthenticated(true);
      setAuth(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setAuth(false);
  }, []);

  return { isAuthenticated: auth, login, logout };
}
