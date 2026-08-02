import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signUp } from "../services/authService";
import logo from "../assets/logo.png";
import "../styles/SignUp.css";

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.7 27 35.7 24 35.7c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C41.5 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validateField(field: keyof FieldErrors, values = { fullName, email, password, confirmPassword, agreed }) {
    switch (field) {
      case "fullName":
        return values.fullName.trim().length < 2 ? "Enter your full name." : "";
      case "email":
        if (!values.email) return "Email address is required.";
        return !validateEmail(values.email) ? "Enter a valid email address." : "";
      case "password":
        return values.password.length < 8 ? "Password must be at least 8 characters." : "";
      case "confirmPassword":
        return values.confirmPassword !== values.password ? "Passwords do not match." : "";
      case "agreed":
        return !values.agreed ? "You must agree to continue." : "";
      default:
        return "";
    }
  }

  function handleBlur(field: keyof FieldErrors) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }));
  }

  function handleChange(field: keyof FieldErrors, value: string | boolean) {
    const nextValues = { fullName, email, password, confirmPassword, agreed, [field]: value };
    if (field === "fullName") setFullName(value as string);
    if (field === "email") setEmail(value as string);
    if (field === "password") setPassword(value as string);
    if (field === "confirmPassword") setConfirmPassword(value as string);
    if (field === "agreed") setAgreed(value as boolean);

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, nextValues) }));
    }
    // re-check confirm password whenever password changes and confirm was already touched
    if (field === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: nextValues.confirmPassword !== nextValues.password ? "Passwords do not match." : "",
      }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    const fields: (keyof FieldErrors)[] = ["fullName", "email", "password", "confirmPassword", "agreed"];
    const newErrors: FieldErrors = {};
    fields.forEach((f) => {
      const err = validateField(f);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true, agreed: true });

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp({ fullName, email, password, confirmPassword });
      navigate("/login");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-panel">
          <img src={logo} alt="Groundbreaker Talents logo" className="signup-logo" />
          <p className="signup-copyright">© 2026 All rights reserved.</p>
        </div>

        <div className="signup-form-container">
          <div className="signup-form-wrapper">
            <h2>Join Groundbreaker</h2>
            <p className="signup-subtitle">
              Empower our team with the next generation of talent management tools.
            </p>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <div className={`input-with-icon ${errors.fullName ? "input-error" : ""}`}>
                    <User size={14} className="input-icon" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className={`input-with-icon ${errors.email ? "input-error" : ""}`}>
                    <Mail size={14} className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@groundbreaker.org"
                      value={email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className={`input-with-icon ${errors.password ? "input-error" : ""}`}>
                    <Lock size={14} className="input-icon" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className={`input-with-icon ${errors.confirmPassword ? "input-error" : ""}`}>
                    <Lock size={14} className="input-icon" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>
              </div>

              <span className="input-hint password-hint">
                At least 8 characters with a mix of letters and numbers.
              </span>


              {submitError && <p className="form-error">{submitError}</p>}

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
                <span className="or-divider">OR</span>
                <button type="button" className="btn-google">
                  <GoogleIcon /> Sign up with Google
                </button>
              </div>
            </form>

            <p className="signup-login-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}