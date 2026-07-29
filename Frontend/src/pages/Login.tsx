import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { login } from "../services/authService";
import logo from "../assets/logo.png";
import "../styles/Login.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.7 27 35.7 24 35.7c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C41.5 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validateField(field: keyof FieldErrors, values = { email, password }) {
    switch (field) {
      case "email":
        if (!values.email) return "Email address is required.";
        return !validateEmail(values.email) ? "Enter a valid email address." : "";
      case "password":
        return !values.password ? "Password is required." : "";
      default:
        return "";
    }
  }

  function handleBlur(field: keyof FieldErrors) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }));
  }

  function handleChange(field: keyof FieldErrors, value: string) {
    const nextValues = { email, password, [field]: value };
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, nextValues) }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    const fields: (keyof FieldErrors)[] = ["email", "password"];
    const newErrors: FieldErrors = {};
    fields.forEach((f) => {
      const err = validateField(f);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await login({ email, password });
      localStorage.setItem("authToken", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-panel">
          <img src={logo} alt="Groundbreaker Talents logo" className="login-logo" />
          <p className="login-copyright">© 2026 All rights reserved.</p>
        </div>

        <div className="login-form-container">
          <div className="login-form-wrapper">
            <h2>Welcome back</h2>
            <p className="login-subtitle">
              Enter your credentials to access the dashboard.
            </p>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className={`input-with-icon ${errors.email ? "input-error" : ""}`}>
                  <Mail size={16} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    autoComplete="off"
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className={`input-with-icon ${errors.password ? "input-error" : ""}`}>
                  <Lock size={16} className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-checkbox">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>

              {submitError && <p className="form-error">{submitError}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="or-divider-line">
                <span>OR</span>
              </div>

              <button type="button" className="btn-google">
                <GoogleIcon /> Continue with Google
              </button>
            </form>

            <p className="login-signup-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}