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

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('atyant_token', data.token);
    // Fetch the FULL profile so the user object matches the refresh path
    // (login response is trimmed and lacks education/interests/bio/etc.).
    const fullUser = await authAPI.me().catch(() => data.user);
    setUser(fullUser);
    return fullUser;
  }, []);

  const signup = useCallback(async (username, email, password, phone, role) => {
    const data = await authAPI.signup(username, email, password, phone, role);
    localStorage.setItem('atyant_token', data.token);
    // Same as login: load the complete profile so no field is missing on first render.
    const fullUser = await authAPI.me().catch(() => data.user);
    setUser(fullUser);
    return fullUser;
  }, []);

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
