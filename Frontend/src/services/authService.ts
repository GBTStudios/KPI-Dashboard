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
export function storeAuthTokens(tokens: TokenPair) {
  localStorage.setItem("authToken", tokens.access_token);
  localStorage.setItem("refreshToken", tokens.refresh_token);
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