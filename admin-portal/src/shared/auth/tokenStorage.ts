/**
 * Deliberately sessionStorage, not localStorage: an admin console handling
 * user moderation and payment data should not keep a live credential around
 * indefinitely on a shared/kiosk machine. Session ends -> token is gone.
 */
const TOKEN_KEY = 'primp-admin-token';

export const tokenStorage = {
  get(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  },
};
