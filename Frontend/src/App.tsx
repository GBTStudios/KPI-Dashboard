import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import KpiEntry from "./pages/KpiEntry";
import ImportData from "./pages/ImportData";
import ImportHistory from "./pages/ImportHistory";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import ResetPasswordSuccess from "./pages/ResetPasswordSuccess";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailCode from "./pages/VerifyEmailCode";
import KpiUpdate from "./pages/KpiUpdate";
// import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { getAccessToken } from "./services/api";
import "./index.css";

/**
 * Route-level guard for /user-management.
 *
 * This is a UX nicety only, not the security boundary — the backend's
 * require_admin dependency (checked on every /admin/users/* call) is what
 * actually enforces access; UserManagement.tsx already redirects to
 * /dashboard if that call comes back 403. All this does is skip rendering
 * the page for someone with no session at all, instead of letting it mount
 * and fail on its first fetch. Uses the same "authToken" key that
 * authService.ts's storeAuthTokens() writes on login.
 *
 * NOTE: your commented-out `ProtectedRoute` import above suggests you
 * already have (or planned) a fuller auth-guard component. I don't have
 * that file, so I kept this narrowly scoped to the one route that needs
 * backend-verified admin access rather than guessing at its shape. If you
 * want the whole <Layout /> group gated behind login the same way, share
 * that component and I'll wire it in properly instead of this.
 */
function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/reset-password-success"
          element={<ResetPasswordSuccess />}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-code" element={<VerifyEmailCode />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kpi-entry" element={<KpiEntry />} />
          <Route path="/kpi-update" element={<KpiUpdate />} />
          <Route path="/import-data" element={<ImportData />} />
          <Route path="/import-history" element={<ImportHistory />} />
          <Route
            path="/user-management"
            element={
              <AdminRouteGuard>
                <UserManagement />
              </AdminRouteGuard>
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}