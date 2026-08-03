import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { verifyEmail, resendVerificationEmail } from "../services/authService";
import logo from "../assets/logo2.png";
import "../styles/VerifyEmailCode.css";

interface LocationState {
  email?: string;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(name.length - 1, 3))}@${domain}`;
}

const CODE_LENGTH = 6;

export default function VerifyEmailCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const email = state?.email;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === CODE_LENGTH) handleVerify(pasted);
  }

  async function handleVerify(code: string) {
    setVerifying(true);
    setError("");
    try {
      await verifyEmail({ token: code });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("We don't have your email on this screen. Please sign up again to resend.");
      return;
    }
    setResending(true);
    setResendMessage("");
    setError("");
    try {
      await resendVerificationEmail({ email });
      setResendMessage("A new code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code. Try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="vc-page">
      <div className="vc-card">
        <img src={logo} alt="Groundbreaker Talents logo" className="vc-logo" />
        <p className="vc-brand">Groundbreaker Talents</p>

        <h2 className="vc-title">Verify Email</h2>
        <p className="vc-subtitle">We've sent a 6-digit verification code to</p>
        {email && <p className="vc-email">{maskEmail(email)}</p>}

        <p className="vc-code-label">Enter code</p>

        <div className="vc-code-row" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <>
              {i === 3 && <span className="vc-code-dash" key={`dash-${i}`} />}
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="vc-code-input"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={verifying}
              />
            </>
          ))}
        </div>

        {error && <p className="vc-error">{error}</p>}
        {resendMessage && <p className="vc-resend-success">{resendMessage}</p>}
        {verifying && <p className="vc-verifying">Verifying...</p>}

        <div className="vc-footer-row">
          <Link to="/forgot-password" className="vc-back-link">
            <ArrowLeft size={13} /> Back
          </Link>
          <span className="vc-resend-row">
            Didn't receive code?{" "}
            <button type="button" className="vc-resend-link" onClick={handleResend} disabled={resending}>
              {resending ? "Sending..." : "Resend"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}