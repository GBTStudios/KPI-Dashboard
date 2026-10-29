/**
 * Single source of truth for "is there a logged-in session right now".
 *
 * Why this exists: getAccessToken() (in services/api.ts) is a plain
 * localStorage read — it has no way to tell React "something changed,
 * re-render". Without a context, ProtectedRoute would only notice a
 * login/logout after some unrelated re-render happened to run. Login.tsx
 * and Layout.tsx's logout handler call setAuthenticated()/clearAuthenticated()
 * right after they touch localStorage, so every guard reading isAuthenticated
 * updates in the same tick.
 *
 * This does NOT replace the token-refresh logic in services/api.ts — that
 * still owns refreshing/expiring the access token. This context only tracks
 * "do we currently believe there's a session", derived from the same
 * storage keys authService.ts already writes.
 */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getAccessToken } from "../services/api";

interface AuthContextValue {
  /** True once we've done the initial synchronous check of localStorage. */
  isInitializing: boolean;
  isAuthenticated: boolean;
  /** Call right after storeAuthTokens() succeeds (login/signup/Google). */
  setAuthenticated: () => void;
  /** Call right after clearAuthTokens() (logout, or refresh-failure logout). */
  clearAuthenticated: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Read the current session state once on mount. This is deliberately
  // synchronous (a localStorage read), so isInitializing only exists to
  // give guards a well-defined "not decided yet" render before the first
  // effect runs — it prevents the flash described in the requirements
  // (mount → "no token" → redirect → token was actually there all along).
  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());
    setIsInitializing(false);
  }, []);

  function setAuthenticated() {
    setIsAuthenticated(true);
  }

  function clearAuthenticated() {
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{ isInitializing, isAuthenticated, setAuthenticated, clearAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>.");
  }
  return ctx;
}