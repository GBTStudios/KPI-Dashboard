import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, Save } from "lucide-react";
import type { LayoutContext } from "../types/outletContext";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { api, ApiError } from "../services/api";
import "../styles/Settings.css";

type Theme = "dark" | "light" | "system";

interface UserSettingsOut {
  full_name: string;
  email: string;
  avatar_url: string | null;
  theme_preference: Theme;
  notifications_enabled: boolean;
}

export default function Settings() {
  const { openProfileModal, openLogoutModal } = useOutletContext<LayoutContext>();

  const [theme, setTheme] = useState<Theme>("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<UserSettingsOut>("/users/me/settings");
        if (cancelled) return;
        setTheme(data.theme_preference);
        setNotificationsEnabled(data.notifications_enabled);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load your settings.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const data = await api.patch<UserSettingsOut>("/users/me/settings", {
        theme_preference: theme,
        notifications_enabled: notificationsEnabled,
      });
      setTheme(data.theme_preference);
      setNotificationsEnabled(data.notifications_enabled);

      // ✅ Apply theme immediately without refresh
      const themeToApply = data.theme_preference === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : data.theme_preference;
      document.documentElement.setAttribute("data-theme", themeToApply);
      localStorage.setItem("theme", themeToApply);

      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save settings. Please try again.");
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
        <button type="button" className="settings-save-btn" onClick={handleSave} disabled={saving || isLoading}>
          <Save size={15} />
          {saving ? "Saving..." : savedJustNow ? "Saved" : "Save Changes"}
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: "#b91c1c", marginBottom: 16 }}>
          {error}
        </p>
      )}

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
          <div key={option} className={`settings-row ${i === arr.length - 1 ? "no-border" : ""}`}>
            <span className="settings-row-label">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
            <button
              type="button"
              className={`settings-toggle ${theme === option ? "on" : ""}`}
              onClick={() => setTheme(option)}
              disabled={isLoading}
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
            disabled={isLoading}
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

      {showChangePassword && <ChangePasswordModal onCancel={() => setShowChangePassword(false)} />}
    </div>
  );
}