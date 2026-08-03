import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, RefreshCw } from "lucide-react";
import { resendVerificationEmail } from "../services/authService";
import logo from "../assets/logo2.png";
import "../styles/VerifyEmail.css";

interface LocationState {
  email?: string;
}

export default function VerifyEmail() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const email = state?.email;

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  async function handleResend() {
    if (!email) {
      setResendError("We don't have your email on this screen. Please sign up again to resend.");
      return;
    }
    setResending(true);
    setResendMessage("");
    setResendError("");
    try {
      await resendVerificationEmail({ email });
      setResendMessage("Verification email resent. Please check your inbox.");
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Could not resend email. Try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <img src={logo} alt="Groundbreaker Talents logo" className="verify-logo" />
        <p className="verify-brand">Groundbreaker Talents</p>

        <h2 className="verify-title">Check Your Email</h2>
        <p className="verify-subtitle">We've sent a verification link to your email address.</p>
        <p className="verify-subtitle">
          Please check your inbox and click the link to verify your email and activate your account.
        </p>

        {email && (
          <div className="verify-email-chip">
            <Mail size={16} />
            <span>{email}</span>
          </div>
        )}
        
        <p className="verify-resend-label">Didn't receive the email?</p>

        <button type="button" className="verify-resend-btn" onClick={handleResend} disabled={resending}>
          <RefreshCw size={15} className={resending ? "spin" : ""} />
          {resending ? "Resending..." : "Resend Verification Email"}
        </button>

        {resendMessage && <p className="verify-resend-success">{resendMessage}</p>}
        {resendError && <p className="verify-resend-error">{resendError}</p>}

        <p className="verify-back-link">
          <Link to="/signup">Back to Sign Up</Link>
        </p>
      </div>
    </div>
  );
}