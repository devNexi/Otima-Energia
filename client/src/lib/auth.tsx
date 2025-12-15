import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'sales' | 'ops';

interface User {
  id: number;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canAccess: (feature: 'ecos' | 'clients' | 'leads' | 'rfo' | 'benchmarks' | 'admin') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'admin_session';

const rolePermissions: Record<UserRole, string[]> = {
  admin: ['ecos', 'clients', 'leads', 'rfo', 'benchmarks', 'admin'],
  ops: ['ecos', 'clients', 'leads', 'rfo', 'benchmarks'],
  sales: ['clients', 'leads', 'rfo']
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.sessionId || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'x-session-id': sessionId }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser({
              id: data.user.id,
              username: data.user.username,
              role: data.user.role || 'admin'
            });
          } else {
            localStorage.removeItem(STORAGE_KEY);
            setSessionId(null);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setSessionId(null);
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [sessionId]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success && data.sessionId && data.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          sessionId: data.sessionId,
          expiresAt: data.expiresAt
        }));
        setSessionId(data.sessionId);
        setUser({
          id: data.user.id,
          username: data.user.username,
          role: data.user.role || 'admin'
        });
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = async () => {
    if (sessionId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'x-session-id': sessionId }
        });
      } catch {
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setUser(null);
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const canAccess = (feature: 'ecos' | 'clients' | 'leads' | 'rfo' | 'benchmarks' | 'admin'): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(feature) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      sessionId,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasRole,
      canAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
