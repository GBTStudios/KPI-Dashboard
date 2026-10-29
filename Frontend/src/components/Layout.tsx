import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LogoutModal from "../components/LogoutModal";
import ProfileModal from "../components/ProfileModal";
import { api, getAccessToken } from "../services/api";
import { logout as logoutRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "../styles/Layout.css";

interface CurrentUser {
  full_name: string;
  email: string;
  avatar_url: string | null;
  theme_preference: string;
  notifications_enabled: boolean;
}

export default function Layout() {
  const navigate = useNavigate();
  const { clearAuthenticated } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Load current user (theme + avatar + name/email) on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api.get<CurrentUser>("/users/me/settings");
        setCurrentUser(data);

        const theme = data.theme_preference || "light";
        const themeToApply =
          theme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : theme;
        document.documentElement.setAttribute("data-theme", themeToApply);
        localStorage.setItem("theme", themeToApply);
      } catch {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
    };
    loadUser();
  }, []);

  // CHANGED: this used to be `localStorage.removeItem("authToken")` +
  // `navigate("/login")` — it left refreshToken behind, never told the
  // backend to revoke the session, and didn't use `replace`, so pressing
  // Back afterwards could land back on /dashboard with a stale-but-present
  // refresh token still in storage.
  //
  // Now: authService.logout() is the single source of truth for clearing
  // session state (it revokes server-side, then clears BOTH tokens in a
  // finally so local state is always cleared even if the network call
  // fails). We await it, then flip the shared auth context so every
  // ProtectedRoute re-renders immediately, then replace-navigate to
  // /login so /dashboard isn't a Back target anymore. Even if it were,
  // ProtectedRoute would still refuse to render it once isAuthenticated
  // is false — this replace is just tidiness, not the security boundary.
  async function handleConfirmLogout() {
    setShowLogoutModal(false);
    try {
      await logoutRequest();
    } catch {
      // logoutRequest() already clears local tokens in its own finally
      // block regardless of whether the backend call succeeded — a failed
      // revoke shouldn't trap the user in a "still looks logged in" state.
    } finally {
      clearAuthenticated();
      navigate("/login", { replace: true });
    }
  }

  async function handleSaveProfile(data: {
    fullName: string;
    avatarFile: File | null;
  }) {
    try {
      // 1. Update profile name if changed
      if (data.fullName) {
        await api.patch<{ full_name: string }>("/users/me/profile", {
          full_name: data.fullName,
        });

        setCurrentUser((prev) =>
          prev ? { ...prev, full_name: data.fullName } : prev,
        );
      }

      // 2. Upload avatar if provided
      if (data.avatarFile) {
        const formData = new FormData();
        formData.append("file", data.avatarFile);

        // CHANGED: was a raw localStorage.getItem("authToken") — reuses
        // the same helper api.ts already exports instead of a second
        // place that has to know the storage key.
        const token = getAccessToken();

        const response = await fetch(
          "http://localhost:8000/api/v1/users/me/avatar",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to upload avatar");
        }

        const { avatar_url } = await response.json();

        setCurrentUser((prev) => (prev ? { ...prev, avatar_url } : prev));
      }

      // Show success toast
      setShowToast(true);

      // Automatically hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      setShowProfileModal(false);
    } catch (error) {
      console.error("Failed to update profile:", error);

      throw new Error(
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        onSignOut={() => setShowLogoutModal(true)}
        onAvatarClick={() => setShowProfileModal(true)}
        userName={currentUser?.full_name ?? "User"}
        userAvatar={currentUser?.avatar_url ?? undefined}
      />
      <div className="app-main">
        <Header
          onAvatarClick={() => setShowProfileModal(true)}
          userAvatar={currentUser?.avatar_url ?? undefined}
          userName={currentUser?.full_name ?? "User"}
        />
        <div className="app-content">
          <Outlet
            context={{
              openProfileModal: () => setShowProfileModal(true),
              openLogoutModal: () => setShowLogoutModal(true),
            }}
          />
        </div>
        <Footer />
      </div>

      {showLogoutModal && (
        <LogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmLogout}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          currentName={currentUser?.full_name ?? ""}
          currentEmail={currentUser?.email ?? ""}
          currentAvatarUrl={currentUser?.avatar_url ?? undefined}
          onCancel={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
        />
      )}

      {showToast && (
        <div className="success-toast" role="status">
          <div className="success-toast-icon">✓</div>
          <div>
            <strong>Profile updated</strong>
            <span>Your profile has been updated successfully.</span>
          </div>
        </div>
      )}
    </div>
  );
}