const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AUTH_BASE = `${API_BASE_URL}/api/v1/auth`;

// ---- Shared envelope types ----
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

// ---- Domain types ----
interface UserOut {
  id: string;
  full_name: string;
  email: string;
  [key: string]: unknown;
}

interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthResponseData {
  user: UserOut;
  tokens: TokenPair;
}

// ---- Shared request helper ----
async function apiRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${AUTH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const err = json as ErrorResponse | null;
    throw new Error(err?.message || "Something went wrong. Please try again.");
  }

  const success = json as SuccessResponse<T>;
  return success.data;
}

// ---- Sign up ----
interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function signUp({
  fullName,
  email,
  password,
  confirmPassword,
}: SignUpPayload) {
  return apiRequest<AuthResponseData | null>("/signup", {
    full_name: fullName,
    email,
    password,
    confirm_password: confirmPassword,
  });
}

// ---- Login ----
interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function login({
  email,
  password,
  rememberMe = false,
}: LoginPayload) {
  return apiRequest<AuthResponseData>("/login", {
    email,
    password,
    remember_me: rememberMe,
  });
}

// ---- Forgot password ----
interface ForgotPasswordPayload {
  email: string;
}

export async function requestPasswordReset({ email }: ForgotPasswordPayload) {
  return apiRequest<null>("/forgot-password", { email });
}

interface ResendVerificationPayload {
  email: string;
}

export async function resendVerificationEmail({
  email,
}: ResendVerificationPayload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Could not resend verification email.");
  }

  return response.json();
}
