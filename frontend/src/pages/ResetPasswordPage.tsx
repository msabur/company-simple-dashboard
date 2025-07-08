import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { resetPassword } from "../api/user";

export default function ResetPasswordPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);

  function getStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      confirmRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await resetPassword(code, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setStatus("Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
        Password updated. Please <a href="/auth">log in</a> with your new password.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>Enter new password</h2>
      <input
        type="password"
        value={newPassword}
        onChange={e => {
          setNewPassword(e.target.value);
          setPasswordStrength(getStrength(e.target.value));
        }}
        placeholder="New password"
        required
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />
      <PasswordStrengthBar score={passwordStrength} />
      <input
        type="password"
        ref={confirmRef}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />
      <button type="submit" style={{ width: "100%", padding: 8 }} disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
      <div style={{ color: "red", marginTop: 8 }}>{status}</div>
    </form>
  );
}

function PasswordStrengthBar({ score }: { score: number }) {
  const colors = ["#e11d48", "#f59e42", "#fbbf24", "#84cc16", "#22c55e"];
  const labels = ["Very weak", "Weak", "Medium", "Strong", "Very strong"];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(score/5)*100}%`, height: 8, background: colors[score-1] || colors[0], transition: "width 0.2s" }} />
      </div>
      <div style={{ fontSize: 12, color: colors[score-1] || colors[0], marginTop: 2 }}>
        {score > 0 ? labels[score-1] : ""}
      </div>
    </div>
  );
}
