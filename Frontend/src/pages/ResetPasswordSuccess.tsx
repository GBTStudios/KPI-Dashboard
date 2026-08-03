import { useNavigate } from "react-router-dom";
import logo from "../assets/logo2.png";
import "../styles/ResetPasswordSuccess.css";

export default function ResetPasswordSuccess() {
  const navigate = useNavigate();

  return (
    <div className="reset-success-page">
      <div className="reset-success-card">
        <img src={logo} alt="Groundbreaker Talents logo" className="reset-success-logo" />
        <p className="reset-success-brand">Groundbreaker Talents</p>

        <h2 className="reset-success-title">Password Reset Successful</h2>
        <p className="reset-success-subtitle">
          Your account security has been updated. You can now use your new password to sign in
          to your dashboard.
        </p>

        <button
          type="button"
          className="reset-success-btn"
          onClick={() => navigate("/login")}
        >
          Proceed to Sign In
        </button>
      </div>
    </div>
  );
}