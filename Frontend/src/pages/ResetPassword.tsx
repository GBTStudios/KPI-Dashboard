import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/ResetPassword.css";

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "1 uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "1 numeric value", test: (pw) => /[0-9]/.test(pw) },
  { label: "1 special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function getStrength(password: string): { label: string; level: number; color: string } {
  const passed = requirements.filter((r) => r.test(password)).length;

  if (password.length === 0) return { label: "", level: 0, color: "#E2E8F0" };
  if (passed <= 1) return { label: "Weak", level: 1, color: "#DC2626" };
  if (passed === 2) return { label: "Fair", level: 2, color: "#D97706" };
  if (passed === 3) return { label: "Good", level: 3, color: "#2563EB" };
  return { label: "Strong", level: 4, color: "#16A34A" };
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (strength.level < 3) {
      setError("Please choose a stronger password.");
      return;
    }

    setLoading(true);
    try {
      // TODO: call resetPassword service once backend endpoint exists
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-panel">
          <img src={logo} alt="Groundbreaker Talents logo" className="reset-logo" />
          <p className="reset-copyright">© 2026 All rights reserved.</p>
        </div>

        <div className="reset-form-container">
          <div className="reset-form-wrapper">
            <h2>Create New Password</h2>
            <p className="reset-subtitle">
              Please enter your new credentials below. Ensure your password is strong and
              unique to protect your organization's data.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label="Toggle confirm password visibility"
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="strength-box">
                <div className="strength-header">
                  <span>Password strength</span>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strength-bar"
                      style={{
                        background: i <= strength.level ? strength.color : "#E2E8F0",
                      }}
                    />
                  ))}
                </div>
                <div className="requirements-grid">
                  {requirements.map((req) => {
                    const met = req.test(password);
                    return (
                      <div key={req.label} className={`requirement ${met ? "met" : ""}`}>
                        <span className="requirement-dot" />
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>

            <p className="reset-back-link">
              <Link to="/login">Back to Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}