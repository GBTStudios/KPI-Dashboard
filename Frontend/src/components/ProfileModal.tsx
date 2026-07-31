import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { X, Camera, User as UserIcon } from "lucide-react";
import "../styles/Modal.css";
import "../styles/ProfileModal.css";

interface ProfileModalProps {
  currentName: string;
  currentEmail: string;
  currentAvatarUrl?: string;
  onCancel: () => void;
  onSave: (data: { fullName: string; avatarFile: File | null }) => Promise<void> | void;
}

export default function ProfileModal({
  currentName,
  currentEmail,
  currentAvatarUrl,
  onCancel,
  onSave,
}: ProfileModalProps) {
  const [fullName, setFullName] = useState(currentName);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSave({ fullName, avatarFile });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-modal-overlay" onClick={onCancel}>
      <div className="app-modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="app-modal-close" onClick={onCancel} aria-label="Close">
          <X size={16} />
        </button>

        <h2 className="app-modal-title profile-modal-title">Edit profile</h2>
        <p className="app-modal-description">Update your photo and personal details.</p>

        <form onSubmit={handleSubmit}>
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrap">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback">
                  <UserIcon size={26} />
                </div>
              )}
              <button
                type="button"
                className="profile-avatar-edit"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
              >
                <Camera size={13} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
            <div className="profile-avatar-hint">
              <span className="profile-avatar-hint-title">Profile photo</span>
              <span className="profile-avatar-hint-sub">JPG or PNG, up to 5MB</span>
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="profile-input"
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={currentEmail}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>

          {error && <p className="profile-error">{error}</p>}

          <div className="app-modal-actions">
            <button type="button" className="app-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="app-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}