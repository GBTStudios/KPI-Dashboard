/**
 * Inverse of ProtectedRoute: wraps routes that only make sense when
 * logged OUT (here: /login and /signup). If an already-authenticated user
 * lands on one of these — e.g. via a bookmark, or pressing Back to before
 * they logged in — send them to /dashboard instead of showing the form
 * again.
 *
 * Deliberately NOT applied to /forgot-password, /reset-password,
 * /verify-email, /verify-email-code: those flows can legitimately be
 * visited by someone who still has an old session token around (e.g.
 * resetting a password from a different device/tab), and redirecting them
 * away would break those flows for no benefit.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}