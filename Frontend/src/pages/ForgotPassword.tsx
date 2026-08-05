import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "../services/authService";
import logo from "../assets/logo.png";
import "../styles/ForgotPassword.css";

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(value: string) {
    if (!value) return "Email address is required.";
    return !validateEmail(value) ? "Enter a valid email address." : "";
  }

  function handleBlur() {
    setTouched(true);
    setFieldError(validate(email));
  }

  function handleChange(value: string) {
    setEmail(value);
    if (touched) {
      setFieldError(validate(value));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    const err = validate(email);
    setFieldError(err);
    setTouched(true);
    if (err) return;

    setLoading(true);
    try {
      await requestPasswordReset({ email });
      navigate("/verify-email-code", { state: { email } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              <div className="form-group">
                <label htmlFor="email">Business Email Address</label>
                <div className={`input-with-icon ${fieldError ? "input-error" : ""}`}>
                  <Mail size={14} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => handleChange(e.target.value)}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                </div>
                {fieldError && <span className="field-error">{fieldError}</span>}
              </div>

              {submitError && <p className="form-error">{submitError}</p>}

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