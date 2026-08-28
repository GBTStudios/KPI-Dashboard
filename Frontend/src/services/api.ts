/**
 * Generic API client for non-auth backend calls (admin/users, users/me/*,
 * dashboard/overview, kpis, etc).
 *
 * Deliberately mirrors src/services/authService.ts exactly, so both files
 * agree on where the backend lives and how a logged-in session is stored:
 *   - Same API_BASE_URL fallback (`http://localhost:8000`) and `/api/v1` path.
 *   - Same token storage keys ("authToken" / "refreshToken") that
 *     storeAuthTokens() in authService.ts writes on login/signup/Google
 *     sign-in - so this client picks up whatever session authService.ts
 *     already established, no separate login step needed.
 *   - Same response envelope shape ({ success, message, data } on success;
 *     { success, message, error_code, details } on failure).
 *
 * CHANGED: this client used to throw straight through on any 401, even
 * though the backend already supports refresh-token rotation
 * (POST /api/v1/auth/refresh, implemented in AuthService.refresh). That
 * meant a still-valid session got treated as "logged out" the moment the
 * 15-minute access token expired. Every authenticated call in the app goes
 * through request() below, so this is the single place that needed fixing.
 */
import { refreshAccessToken, storeAuthTokens, clearAuthTokens } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE = `${API_BASE_URL}/api/v1`;

export function getAccessToken(): string | null {
  return localStorage.getItem("authToken");
}

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error_code: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

// NEW: single in-flight refresh promise shared across every caller. If
// several requests 401 at nearly the same moment (e.g. dashboard/overview
// and users/me/settings firing together, as in the logs), they all await
// the SAME refresh call instead of each starting their own - which would
// otherwise race and trigger the backend's refresh-token reuse detection
// (AuthService.refresh revokes the whole session if a refresh token is
// used twice). Cleared in .finally() so the next genuine expiry starts a
// fresh refresh.
let refreshPromise: ReturnType<typeof refreshAccessToken> | null = null;

function getOrStartRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .then((tokens) => {
        storeAuthTokens(tokens);
        return tokens;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// NEW: redirect-to-login used both when refresh fails outright and when
// the API returns a 401 that isn't a recoverable TOKEN_EXPIRED (e.g. no
// token at all, or a token the backend otherwise rejects). A plain
// location redirect is used - deliberately - rather than useNavigate(),
// since this module has no React component/context to call from and the
// project has no existing AuthContext to route through.
function redirectToLogin() {
  clearAuthTokens();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const err = json as ErrorResponse | null;
    const errorCode = err?.error_code ?? "UNKNOWN_ERROR";

    // The access token expired mid-session (exactly the AppException:
    // "Token has expired. (TOKEN_EXPIRED)" case from the backend logs).
    // Refresh once via the rotating refresh token and replay this exact
    // request. `isRetry` guards against looping if the freshly-refreshed
    // token somehow 401s again (requirement: no infinite refresh loop).
    if (response.status === 401 && errorCode === "TOKEN_EXPIRED" && !isRetry) {
      try {
        await getOrStartRefresh();
        return request<T>(path, options, true);
      } catch {
        // Refresh itself failed - the refresh token is genuinely expired,
        // revoked, or reused. This is the one case where logging the user
        // out is correct behavior, per the requirements.
        redirectToLogin();
        throw new ApiError(
          response.status,
          errorCode,
          "Your session has expired. Please sign in again.",
        );
      }
    }

    // Any other 401 through this authenticated client (missing token,
    // TOKEN_INVALID, or a retried request that still 401s) means the
    // session isn't recoverable - log out rather than retry again.
    if (response.status === 401) {
      redirectToLogin();
    }

    throw new ApiError(
      response.status,
      errorCode,
      err?.message || "Something went wrong. Please try again.",
    );
  }

  return (json as SuccessResponse<T>).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};