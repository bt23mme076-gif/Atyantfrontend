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
  // backend can take a moment before the record is queryable.
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

  // ── OTP-based signup (2-step) ─────────────────────────────────────────────
  // Step 1: send OTP — returns { message }. Does NOT log the user in.
  const signupInitiate = useCallback(async (username, email, password, phone, role) => {
    return await authAPI.signupInitiate(username, email, password, phone, role);
  }, []);

  // Step 2: verify OTP → JWT → log user in
  const signupVerify = useCallback(async (email, otp) => {
    const data = await authAPI.signupVerify(email, otp);
    localStorage.setItem('atyant_token', data.token);
    const fullUser = await loadFullUser(data.user);
    setUser(fullUser);
    return fullUser;
  }, [loadFullUser]);

  // Resend OTP during signup
  const signupResendOtp = useCallback(async (email) => {
    return await authAPI.signupResendOtp(email);
  }, []);

  // Legacy signup (kept for backward compatibility / Google flows)
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
    <AuthContext.Provider value={{
      user, loading,
      login,
      signup,             // legacy
      signupInitiate,     // NEW — step 1
      signupVerify,       // NEW — step 2
      signupResendOtp,    // NEW — resend
      logout,
      refreshUser,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

