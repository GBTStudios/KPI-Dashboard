const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AUTH_BASE = `${API_BASE_URL}/api/v1/auth`;

// ---- Google Identity Services ambient types ----
// Declared once here (imported by both SignUp.tsx and Login.tsx) so we
// don't duplicate this global augmentation in multiple files.
//
// CHANGED: switched from the `accounts.id` One Tap / id_token flow to the
// `accounts.oauth2` OAuth2 popup *code* flow. One Tap has no way to force
// Google's account chooser (it silently reuses whatever Google account is
// already active in the browser) - the code flow supports
// `prompt: "select_account"`, which does force it every time. The tradeoff:
// we get a `code` back instead of an `id_token`, so the backend now
// exchanges that code for the id_token itself server-side (see
// google_oauth.py:exchange_auth_code_for_id_token - needs the Google Client
// Secret, which must never live on the frontend).
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            prompt: "select_account"; // forces the account chooser every time
            callback: (response: { code: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

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

export interface TokenPair {
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

// ---- Token storage ----
// Keys match what Login.tsx already uses for email/password login, so
// Google sign-in results in the exact same "logged in" state app-wide.
// Also the keys src/services/api.ts reads from directly (getAccessToken()
// there) and now reads/writes via refreshAccessToken() below too.
export function storeAuthTokens(tokens: TokenPair) {
  localStorage.setItem("authToken", tokens.access_token);
  localStorage.setItem("refreshToken", tokens.refresh_token);
}

// NEW: read the refresh token that storeAuthTokens() above persisted.
// api.ts never touches localStorage directly for this - it goes through
// refreshAccessToken() below, keeping all refresh-token handling in one
// place instead of duplicating storage-key knowledge into api.ts too.
export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

// NEW: full session teardown. Used by api.ts when a refresh attempt fails
// (i.e. the refresh token itself is expired/revoked/reused) so the user is
// dropped back to a clean logged-out state rather than looping on 401s.
export function clearAuthTokens() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
}

// NEW: calls the existing POST /api/v1/auth/refresh endpoint (already
// implemented server-side in AuthService.refresh - rotation + reuse
// detection included) and returns the new token pair. Reuses apiRequest()
// exactly like every other call in this file - no duplicate fetch logic.
//
// Throws (via apiRequest's existing error handling) if the refresh token
// is missing, expired, or has been revoked - e.g. after reuse detection
// revokes an entire session family. Callers (api.ts) are responsible for
// clearing tokens and redirecting to login when this rejects.
export async function refreshAccessToken(): Promise<TokenPair> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }
  return apiRequest<TokenPair>("/refresh", { refresh_token: refreshToken });
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

// ---- Google Sign-In / Sign-Up ----
// Used by BOTH SignUp.tsx ("Sign up with Google") and Login.tsx
// ("Continue with Google") - same backend endpoint handles both, per
// AuthService.google_auth on the backend. Now sends the OAuth2
// authorization `code` (see ambient types above), not an id_token.
interface GoogleAuthPayload {
  code: string;
  rememberMe?: boolean;
}

export async function googleAuth({ code, rememberMe = false }: GoogleAuthPayload) {
  return apiRequest<AuthResponseData>("/google", {
    code,
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

// ---- Verify reset code (forgot-password flow) ----
// Distinct from verifyEmail() below - this hits /verify-reset-code, which
// checks the 6-digit code sent by /forgot-password and returns a
// short-lived reset_token that ResetPassword.tsx needs to actually change
// the password.
interface VerifyResetCodePayload {
  email: string;
  code: string;
}

interface VerifyResetCodeResponseData {
  reset_token: string;
}

export async function verifyResetCode({ email, code }: VerifyResetCodePayload) {
  return apiRequest<VerifyResetCodeResponseData>("/verify-reset-code", { email, code });
}

// ---- Reset password ----
// Takes the reset_token returned by verifyResetCode() above, not a raw
// email/code - the backend re-validates the token server-side.
interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;

}

export async function resetPassword({ resetToken, newPassword, confirmPassword }: ResetPasswordPayload) {
  return apiRequest<null>("/reset-password", {
    reset_token: resetToken,
    new_password: newPassword,
    confirm_password: confirmPassword,

  });
}

// ---- Resend verification email ----
interface ResendVerificationPayload {
  email: string;
}

export async function resendVerificationEmail({ email }: ResendVerificationPayload) {
  return apiRequest<null>("/resend-verification", { email });
}

// NOTE: verifyEmail() below is currently unused. The backend verifies
// email links itself (GET /api/v1/auth/verify-email) and redirects
// straight to the login page - no frontend page needs to call this.
// Left in place in case a JSON-based verification flow is needed later.
interface VerifyEmailPayload {
  token: string;
}

export async function verifyEmail({ token }: VerifyEmailPayload) {
  return apiRequest<UserOut>("/verify-email", { token });
}

// ---- Logout ----
// NEW: calls the existing POST /api/v1/auth/logout (revokes the refresh
// token server-side) and always clears local tokens afterward, even if the
// network call fails - a logged-out UI should never depend on the backend
// being reachable.
export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest<null>("/logout", { refresh_token: refreshToken });
    }
  } finally {
    clearAuthTokens();
  }
}