import { useState } from "react";
import type { FormEvent } from "react";
import { X, Lock, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "../services/api";
import "../styles/Modal.css";
import "../styles/ChangePasswordModal.css";

interface ChangePasswordModalProps {
  onCancel: () => void;
}

export default function ChangePasswordModal({ onCancel }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate
    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/users/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setSaving(false);

      // Close modal after successful change with a small delay
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errorCode === "INCORRECT_PASSWORD") {
          setError("Current password is incorrect.");
        } else if (err.errorCode === "WEAK_PASSWORD") {
          setError("Password is too weak. Please use at least 8 characters with uppercase, lowercase, number, and special character.");
        } else {
          setError(err.message || "Could not update password. Please try again.");
        }
      } else {
        setError("Could not update password. Please try again.");
      }
      setSaving(false);
    }
  }

  return (
    <div className="app-modal-overlay" onClick={onCancel}>
      <div className="app-modal cp-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="app-modal-close" onClick={onCancel} aria-label="Close">
          <X size={16} />
        </button>

        <h2 className="app-modal-title">Change password</h2>
        <p className="app-modal-description">Enter your current password and choose a new one.</p>

        <form onSubmit={handleSubmit}>
          <div className="cp-form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="cp-input-with-icon">
              <Lock size={14} className="cp-input-icon" />
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                disabled={saving}
              />
              <button
                type="button"
                className="cp-toggle-visibility"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label="Toggle current password visibility"
                disabled={saving}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="cp-form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="cp-input-with-icon">
              <Lock size={14} className="cp-input-icon" />
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={saving}
              />
              <button
                type="button"
                className="cp-toggle-visibility"
                onClick={() => setShowNew((v) => !v)}
                aria-label="Toggle new password visibility"
                disabled={saving}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <small className="cp-hint">Must be at least 8 characters with uppercase, lowercase, number, and special character.</small>
          </div>

          <div className="cp-form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="cp-input-with-icon">
              <Lock size={14} className="cp-input-icon" />
              <input
                id="confirmPassword"
                type={showNew ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
          </div>

          {error && <p className="cp-error">{error}</p>}
          {success && <p className="cp-success">Password updated successfully!</p>}

          <div className="app-modal-actions">
            <button type="button" className="app-btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="app-btn-primary" disabled={saving}>
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}