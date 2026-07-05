import React, { createContext, useContext, useState, useCallback } from 'react';

const TOKEN_KEY = 'gym_token';
const USER_KEY = 'gym_user';

interface AuthState {
  token: string | null;
  username: string | null;
}

interface AuthContextType {
  auth: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  authHeader: () => Record<string, string>;
}

function loadAuth(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USER_KEY);
    if (!token) return { token: null, username: null };

    // Decode the JWT payload and check expiry without a library
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { token: null, username: null };
    }
    return { token, username };
  } catch {
    return { token: null, username: null };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 401) throw new Error('Invalid username or password');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'Login failed');
    }

    const data = await res.json() as { access_token: string; username: string };
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, data.username);
    setAuth({ token: data.access_token, username: data.username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, username: null });
  }, []);

  /** Returns the Authorization header object to spread into fetch options */
  const authHeader = useCallback((): Record<string, string> => {
    if (!auth.token) return {};
    return { Authorization: `Bearer ${auth.token}` };
  }, [auth.token]);

  return (
    <AuthContext.Provider value={{ auth, login, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
