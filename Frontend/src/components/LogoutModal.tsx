import { LogOut, X } from "lucide-react";
import "../styles/Modal.css";

interface LogoutModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ onCancel, onConfirm }: LogoutModalProps) {
  return (
    <div className="app-modal-overlay" onClick={onCancel}>
      <div className="app-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="app-modal-close" onClick={onCancel} aria-label="Close">
          <X size={16} />
        </button>

        <div className="app-modal-icon app-modal-icon-red">
          <LogOut size={20} />
        </div>

        <h2 className="app-modal-title">Log out?</h2>
        <p className="app-modal-description">
          You'll need to sign in again to access the dashboard and your KPI data.
        </p>

        <div className="app-modal-actions">
          <button type="button" className="app-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="app-btn-danger" onClick={onConfirm}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}