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
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (username, email, password, phone) => {
    const data = await authAPI.signup(username, email, password, phone);
    localStorage.setItem('atyant_token', data.token);
    setUser(data.user);
    return data.user;
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
