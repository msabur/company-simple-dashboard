import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    try {
      await resetPassword(code, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setStatus("Invalid or expired reset link.");
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
        onChange={e => setNewPassword(e.target.value)}
        placeholder="New password"
        required
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />
      <button type="submit" style={{ width: "100%", padding: 8 }}>Reset Password</button>
      <div style={{ color: "red", marginTop: 8 }}>{status}</div>
    </form>
  );
}
