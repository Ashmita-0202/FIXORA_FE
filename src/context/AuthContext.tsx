import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setUnauthorizedHandler } from "@/lib/api-client";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, clearSession, writeToken } from "@/lib/storage";
import { getMyProfile } from "@/services/user.service";
import { login as loginRequest } from "@/services/auth.service";
import type { LoginResponse } from "@/types/api";
import { UserRole } from "@/types/enums";

/**
 * Session state.
 *
 * The token is the only durable source of truth on the client — there is no
 * refresh token and no /me endpoint. User details are cached in localStorage so
 * the shell can render a name immediately on reload, and refreshed from
 * GET /api/User/my-profile once the app mounts.
 *
 * NOTE: the role used for routing comes from the login response, not from the
 * JWT. The backend's role claim is misleading (see LoginResponse in types/api.ts),
 * so it must never be decoded client-side to make authorization decisions.
 */
/** Session user. The login response is already the complete shape we need. */
export type SessionUser = LoginResponse;

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  /** True until the persisted session has been verified against the API. */
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  /** Re-reads the profile after an update so the shell reflects new values. */
  refreshUser: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_CACHE_KEY = `${USER_STORAGE_KEY}.cache`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readCachedUser);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  }, []);

  // A 401 on any request means the stored token is dead. This is registered once
  // so api-client can trigger it without importing React or the router.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Verify the persisted token on first mount. No-op when there is no token.
  const refreshUser = useCallback(async (): Promise<SessionUser | null> => {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) return null;

    const profile = await getMyProfile();

    // my-profile returns UserRole as a string, so it is normalized back to the
    // numeric enum to keep the SessionUser shape identical to the login one.
    const numericRole = Number(profile.UserRole);
    const merged: SessionUser = {
      ...(user ?? {}),
      Id: profile.Id,
      FirstName: profile.FirstName,
      LastName: profile.LastName,
      Email: profile.Email,
      UserRole: (
        [1, 2, 3].includes(numericRole) ? numericRole : (user?.UserRole ?? UserRole.Customer)
      ) as UserRole,
    } as SessionUser;

    setUser(merged);
    cacheUser(merged);
    return merged;
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
        if (!cancelled) setIsInitializing(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        // A dead or expired token: drop it rather than leaving a broken session.
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Intentionally runs once — refreshUser identity would otherwise re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest({ Email: email, Password: password });
      writeToken(response.Token);
      setUser(response);
      cacheUser(response);
      return response;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      logout,
      refreshUser,
    }),
    [user, isInitializing, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

/**
 * Cached user, used for the very first paint so the shell does not flash a
 * placeholder name before my-profile resolves. Cleared on logout.
 */
function readCachedUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: SessionUser): void {
  try {
    // The token is deliberately not cached here — it lives under its own key.
    const { Token: _token, ...safe } = user;
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(safe));
  } catch {
    // A full or disabled localStorage must not break sign-in.
  }
}