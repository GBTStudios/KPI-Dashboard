import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LogoutModal from "../components/LogoutModal";
import ProfileModal from "../components/ProfileModal";
import "../styles/Layout.css";

export default function Layout() {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  function handleConfirmLogout() {
    localStorage.removeItem("authToken");
    setShowLogoutModal(false);
    navigate("/login");
  }

  async function handleSaveProfile(data: { fullName: string; avatarFile: File | null }) {
    // TODO: call profile update service once backend endpoint exists
    setShowProfileModal(false);
  }

  return (
    <div className="app-layout">
      <Sidebar onSignOut={() => setShowLogoutModal(true)} />
      <div className="app-main">
        <Header onAvatarClick={() => setShowProfileModal(true)} />
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
          currentName="Super Admin"
          currentEmail="admin@groundbreaker.org"
          onCancel={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}