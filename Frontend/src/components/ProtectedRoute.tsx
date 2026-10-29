/**
 * Guards every route nested under it (used to wrap <Layout /> in App.tsx).
 *
 * Reads LIVE context state, not a one-time localStorage check done at
 * mount. That's what makes browser Back/Forward safe after logout: when
 * the browser restores a history entry for e.g. /dashboard, BrowserRouter
 * intercepts the popstate event and re-renders the route tree — this
 * component re-runs, sees isAuthenticated is false (because logout already
 * called clearAuthenticated()), and redirects. No history.replaceState or
 * popstate hacks needed; this is just "don't render protected children
 * when there's no session", which is the actual security boundary.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // Don't redirect before we've even checked localStorage once — avoids
  // punting a genuinely logged-in user to /login during the first render.
  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    // state.from lets /login send the user back to where they were
    // heading, if you want to wire that up later; harmless if unused.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}