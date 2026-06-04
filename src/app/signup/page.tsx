"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Mail, Key, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMocked, setIsMocked] = useState(false);
  
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setIsMocked(!!data.mocked);
        setMessage("A 6-digit verification code has been sent to your email.");
      } else {
        setError(data.error || "Failed to send verification code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Account verified successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || "Verification failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsMocked(!!data.mocked);
        setMessage("A new verification code has been sent.");
      } else {
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Sparkles size={40} />
          </div>
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">
            {step === 1 ? "Sign up to start chatting with AI models" : "Verify your email address"}
          </p>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="settings-message success" style={{ marginBottom: "20px" }}>
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="login-input"
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword" className="login-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Mail size={18} />
              )}
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="login-field">
              <div className="flex justify-between items-center" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="otp" className="login-label">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: 0, background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--accent)" }}
                >
                  <ArrowLeft size={10} /> Change email
                </button>
              </div>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="login-input"
                style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.25rem", fontWeight: "700" }}
                required
                autoFocus
              />
            </div>

            {isMocked && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", backgroundColor: "var(--bg-tertiary)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)", lineHeight: "1.4" }}>
                💡 <strong>Dev Mode Alert:</strong> SMTP is not configured. The verification code has been printed to the **Next.js server terminal** and saved to the **<code>otp.log</code>** file in the project folder.
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Key size={18} />
              )}
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="btn-ghost btn-sm"
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}
              >
                Didn't receive a code? <strong>Resend</strong>
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
