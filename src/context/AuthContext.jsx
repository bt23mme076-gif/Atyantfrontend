import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);   // true while verifying stored token

  // On mount: verify stored token is still valid
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('atyant_token', urlToken);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    const token = localStorage.getItem('atyant_token');
    if (!token) { setLoading(false); return; }

    authAPI.me()
      .then(data => setUser(data))
      .catch(() => localStorage.removeItem('atyant_token'))
      .finally(() => setLoading(false));
  }, []);

  // Load the FULL profile via /me, retrying briefly. Right after auth the
  // backend can take a moment before the record is queryable, so a single
  // attempt may miss and leave us with the trimmed login/signup response
  // (no education/bio/etc.) until the next page refresh. Retrying rides that
  // out so every field is present on first render.
  const loadFullUser = useCallback(async (fallback) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await authAPI.me();
      } catch {
        await new Promise(r => setTimeout(r, 300));
      }
    }
    return fallback;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('atyant_token', data.token);
    const fullUser = await loadFullUser(data.user);
    setUser(fullUser);
    return fullUser;
  }, [loadFullUser]);

  const signup = useCallback(async (username, email, password, phone, role) => {
    const data = await authAPI.signup(username, email, password, phone, role);
    localStorage.setItem('atyant_token', data.token);
    const fullUser = await loadFullUser(data.user);
    setUser(fullUser);
    return fullUser;
  }, [loadFullUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('atyant_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(() =>
    authAPI.me().then(data => { setUser(data); return data; }),
  []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
