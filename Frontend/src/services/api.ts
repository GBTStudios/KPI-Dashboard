/**
 * Generic API client for non-auth backend calls (admin/users, users/me/*).
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
 */

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    throw new ApiError(response.status, err?.error_code ?? "UNKNOWN_ERROR", err?.message || "Something went wrong. Please try again.");
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
