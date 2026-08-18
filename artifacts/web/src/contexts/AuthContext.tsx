import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authApi,
  type AuthUser,
  type RegisterInput,
} from '@/services/auth';
import {
  clearAccessToken,
  getAccessToken,
  storeAccessToken,
} from '@/services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  /** Completes Google Sign-In from the one-time code returned by the backend. */
  loginWithGoogleCode: (code: string, remember?: boolean) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }

    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      return currentUser;
    } catch {
      clearAccessToken();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    void refreshUser().finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      const result = await authApi.login(email, password);
      storeAccessToken(result.token, remember);
      const currentUser = await authApi.me();
      setUser(currentUser);
      return currentUser;
    },
    [],
  );

  const loginWithGoogleCode = useCallback(async (code: string, remember = true) => {
    const result = await authApi.exchangeGoogleCode(code);
    storeAccessToken(result.token, remember);
    const currentUser = await authApi.me();
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authApi.register(input);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) await authApi.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogleCode,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, loginWithGoogleCode, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}