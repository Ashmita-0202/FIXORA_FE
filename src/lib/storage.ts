/**
 * Session persistence.
 *
 * Kept in one module so the storage keys are defined once — api-client.ts reads
 * the token on every request and AuthContext owns the rest.
 *
 * localStorage (not a cookie) is used because the backend is a bearer-token API
 * with no cookie support, and the JWT itself carries no role the client needs to
 * trust — it is read from the login response body instead.
 */

export const TOKEN_STORAGE_KEY = "fixora.token";
export const USER_STORAGE_KEY = "fixora.user";

export function readToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function writeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}