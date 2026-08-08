import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { httpClient, onUnauthorized } from '@/shared/api/httpClient';
import { authResponseSchema, loginRequestSchema, type AuthResponse } from '@/shared/types/api-contracts';
import { tokenStorage } from '@/shared/auth/tokenStorage';
import { decodeJwt, isTokenExpired, type DecodedAdminToken } from '@/shared/auth/decodeJwt';
import { normalizeApiError } from '@/shared/api/apiError';

interface AuthContextValue {
  session: DecodedAdminToken | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loginError: string | null;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadInitialSession(): DecodedAdminToken | null {
  const token = tokenStorage.get();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded || isTokenExpired(decoded)) {
    tokenStorage.clear();
    return null;
  }
  return decoded;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DecodedAdminToken | null>(loadInitialSession);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setSession(null);
  }, []);

  useEffect(() => onUnauthorized(logout), [logout]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const payload = loginRequestSchema.parse({ email, password });
      // Auth is only issued by user-service, routed via the gateway's
      // /api/auth/** passthrough (see GatewayController#forwardAuth).
      const { data } = await httpClient.post<AuthResponse>('/api/auth/login', payload);
      const parsed = authResponseSchema.parse(data);

      const decoded = decodeJwt(parsed.token);
      if (!decoded) {
        throw new Error('Received a malformed token from the server.');
      }

      // Client-side UX gate only — see decodeJwt.ts. Real enforcement must
      // happen on the backend; this just avoids handing a non-admin user
      // a console full of buttons that will 403/silently no-op.
      if (decoded.role !== 'ADMIN') {
        throw new Error(
          'This account does not have admin access. Backend role enforcement for admin endpoints is still pending — contact engineering before granting portal access.',
        );
      }

      tokenStorage.set(parsed.token);
      setSession(decoded);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : normalizeApiError(err).message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      isAdmin: session?.role === 'ADMIN',
      login,
      logout,
      loginError,
      isLoggingIn,
    }),
    [session, login, logout, loginError, isLoggingIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
