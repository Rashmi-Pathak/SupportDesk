'use client';
// ============================================================================
// SUPPORTDESK CRM — AUTH CONTEXT (3-Role: Admin / Agent / Customer)
// ============================================================================
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('sdcrm_token');
    const cached = localStorage.getItem('sdcrm_user');
    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch { /* ignore */ }
    }
    setIsLoading(false);

    // Background validate
    if (token) {
      api.getMe().then(res => {
        if (!res.success) {
          localStorage.removeItem('sdcrm_token');
          localStorage.removeItem('sdcrm_user');
          setUser(null);
        }
      }).catch(() => {});
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      const u: User = {
        userId: res.data.userId,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role as 'Admin' | 'Agent' | 'Customer',
        agentId: res.data.agentId || undefined,
        customerId: res.data.customerId || undefined,
        token: res.data.token,
      };
      localStorage.setItem('sdcrm_token', res.data.token);
      localStorage.setItem('sdcrm_user', JSON.stringify(u));
      setUser(u);
      return { success: true, role: u.role };
    }
    return { success: false, error: res.error?.message || 'Login failed' };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    if (res.success && res.data) {
      const u: User = {
        userId: res.data.userId,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role as 'Admin' | 'Agent' | 'Customer',
        agentId: res.data.agentId || undefined,
        customerId: res.data.customerId || undefined,
        token: res.data.token,
      };
      localStorage.setItem('sdcrm_token', res.data.token);
      localStorage.setItem('sdcrm_user', JSON.stringify(u));
      setUser(u);
      return { success: true, role: u.role };
    }
    return { success: false, error: res.error?.message || 'Registration failed' };
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    localStorage.removeItem('sdcrm_token');
    localStorage.removeItem('sdcrm_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';
  const isCustomer = user?.role === 'Customer';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, isAgent, isCustomer, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
