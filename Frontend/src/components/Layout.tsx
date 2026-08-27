import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LogoutModal from "../components/LogoutModal";
import ProfileModal from "../components/ProfileModal";
import { api } from "../services/api";
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

  function handleConfirmLogout() {
    localStorage.removeItem("authToken");
    setShowLogoutModal(false);
    navigate("/login");
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

        const token = localStorage.getItem("authToken");

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
