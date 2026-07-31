import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, Save } from "lucide-react";
import type { LayoutContext } from "../types/outletContext";
import ChangePasswordModal from "../components/ChangePasswordModal";
import "../styles/Settings.css";

type Theme = "dark" | "light" | "system";

export default function Settings() {
  const { openProfileModal, openLogoutModal } = useOutletContext<LayoutContext>();

  const [theme, setTheme] = useState<Theme>("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // TODO: persist settings once backend endpoint exists
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your workspace configuration, notification preferences, and system appearance.</p>
        </div>
        <button type="button" className="settings-save-btn" onClick={handleSave} disabled={saving}>
          <Save size={15} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="settings-tabs">
        <button type="button" className="settings-tab active">
          <Building2 size={15} />
          General Settings
        </button>
      </div>

      <div className="settings-card">
        <h2>Appearance</h2>
        <span className="settings-card-subtitle">Theme</span>

        {(["dark", "light", "system"] as Theme[]).map((option, i, arr) => (
          <div
            key={option}
            className={`settings-row ${i === arr.length - 1 ? "no-border" : ""}`}
          >
            <span className="settings-row-label">
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </span>
            <button
              type="button"
              className={`settings-toggle ${theme === option ? "on" : ""}`}
              onClick={() => setTheme(option)}
              aria-pressed={theme === option}
              aria-label={`Use ${option} theme`}
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        ))}
      </div>

      <div className="settings-card">
        <h2>Account</h2>
        <button type="button" className="settings-link-row" onClick={() => setShowChangePassword(true)}>
          Change Password
        </button>
        <button type="button" className="settings-link-row no-border" onClick={openProfileModal}>
          Update Profile
        </button>
      </div>

      <div className="settings-card">
        <h2>Notifications</h2>
        <div className="settings-row">
          <span className="settings-row-label">Allow Notifications</span>
          <button
            type="button"
            className={`settings-toggle ${notificationsEnabled ? "on" : ""}`}
            onClick={() => setNotificationsEnabled((v) => !v)}
            aria-pressed={notificationsEnabled}
            aria-label="Toggle notifications"
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>

        <h2 className="settings-subheading">Session</h2>
        <button type="button" className="settings-link-row danger no-border" onClick={openLogoutModal}>
          Sign Out
        </button>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onCancel={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}