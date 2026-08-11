import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';

/**
 * Route guard. Redirects to /login if there's no session, or a decoded
 * role other than ADMIN. As noted in decodeJwt.ts, this is a UX guard, not
 * a security boundary — the API calls themselves are only as safe as the
 * backend authorization work landing alongside this app.
 */
export function RequireAdminRole({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
