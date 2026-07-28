import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";
import logo from "../assets/logo.png";
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await requestPasswordReset({ email });
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="forgot-panel">
          <img src={logo} alt="Groundbreaker Talents logo" className="forgot-logo" />
          <p className="forgot-copyright">© 2026 All rights reserved.</p>
        </div>

        <div className="forgot-form-container">
          <div className="forgot-form-wrapper">
            <h2>Forgot your password?</h2>
            <p className="forgot-subtitle">No worries! Enter your email to receive an OTP.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Business Email Address</label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Sending..." : "Continue"}
              </button>
            </form>

            <p className="forgot-back-link">
              <Link to="/login">Back to Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}