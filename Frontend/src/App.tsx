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
import DepartmentDashboard from "./pages/DepartmentDashboard";
import ParameterPerformancePage from "./pages/ParameterPerformancePage";
import KpiIndicatorsPage from "./pages/KpiIndicatorsPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import { AuthProvider } from "./context/AuthContext";
import { getAccessToken } from "./services/api";
import "./index.css";

// UNCHANGED behavior on purpose: this only checks "is there a token", same
// as before. It's nested inside <ProtectedRoute /> below now, so by the
// time it runs, authentication is already guaranteed — this guard's job is
// purely the admin-authorization concern, kept separate per the
// requirements. Swap the check inside here for a real role check
// (e.g. currentUser.role === "admin") once that's available on the
// frontend; the backend remains the actual enforcement boundary either way.
function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Logged-out-only pages: redirect to /dashboard if already authenticated */}
          <Route element={<GuestRoute />}>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Auth-adjacent flows: accessible whether or not there's a session */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password-success" element={<ResetPasswordSuccess />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-code" element={<VerifyEmailCode />} />

          {/* Everything below requires a session. ProtectedRoute wraps the
              whole Layout subtree instead of individual routes, so every
              page inside it is covered automatically — new pages added
              under here are protected by default, not by remembering to
              add a guard. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/department-dashboard" element={<DepartmentDashboard />} />
              <Route
                path="/department-dashboard/parameters"
                element={<ParameterPerformancePage />}
              />
              <Route path="/kpi-entry" element={<KpiEntry />} />
              <Route path="/kpi-update" element={<KpiUpdate />} />
              <Route path="/import-data" element={<ImportData />} />
              <Route path="/import-history" element={<ImportHistory />} />
              <Route
                path="/department-dashboard/kpis"
                element={<KpiIndicatorsPage />}
              />
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
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}