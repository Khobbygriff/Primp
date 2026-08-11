/**
 * Decodes the JWT issued by user-service (see JwtUtil#generateToken in
 * user-service) to read its `role` / `userId` claims for UI purposes —
 * e.g. showing the admin's name, or hiding a nav link.
 *
 * IMPORTANT: This is NOT an authorization mechanism. Decoding a JWT
 * client-side proves nothing about its signature. As of this repo's current
 * state, no backend endpoint actually enforces role === 'ADMIN' (see the
 * endpoint analysis) — every admin-only screen in this portal is only as
 * safe as the backend authorization work that must land alongside it.
 * Treat every `isAdmin` check in this app as a UX convenience, not a
 * security boundary.
 */
export interface DecodedAdminToken {
  email: string;
  role: string;
  userId: number | null;
  exp: number | null;
}

export function decodeJwt(token: string): DecodedAdminToken | null {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;

    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as Record<string, unknown>;

    return {
      email: typeof payload.sub === 'string' ? payload.sub : '',
      role: typeof payload.role === 'string' ? payload.role : '',
      userId: typeof payload.userId === 'number' ? payload.userId : null,
      exp: typeof payload.exp === 'number' ? payload.exp : null,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(decoded: DecodedAdminToken | null): boolean {
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
