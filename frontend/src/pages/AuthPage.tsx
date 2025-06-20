import { useState } from "react";
import { useLocation } from "wouter";
import { GoogleLogin } from "@react-oauth/google";
import { signup, login, googleAuth, checkEmail } from "../api/user";
import { authStore } from "../store/authStore";
import "./AuthPage.css"

export default function AuthPage() {
  const [step, setStep] = useState<"email" | "login" | "signup">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [, navigate] = useLocation();

  const heading =
    step === "login"
      ? "Login"
      : step === "signup"
        ? "Signup"
        : "Log in or sign up";

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChecking(true);
    setIsGoogleUser(false);
    try {
      const res = await checkEmail(email);
      if (res.isGoogleUser) {
        setIsGoogleUser(true);
        setStep("email");
      } else {
        setStep(res.exists ? "login" : "signup");
      }
    } catch (err: any) {
      setError(err.message || "Failed to check email");
    } finally {
      setChecking(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password });
      authStore.token = res.token;
      authStore.user = res.user;
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await signup({ email, full_name: fullName, username, password });
      authStore.token = res.token;
      authStore.user = res.user;
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    if (credentialResponse.credential) {
      try {
        const res = await googleAuth({ token: credentialResponse.credential });
        authStore.token = res.token;
        authStore.user = res.user;
        navigate("/");
      } catch (err: any) {
        setError(err.message || "Google login failed");
      }
    }
  };

  return (
    <div className="auth-form-container-outer">
      <img src="/logo.png" alt="logo" className="logo" />
      <div className="auth-form-container-inner">
        <h2>{heading}</h2>
        {error && <div className="auth-hint auth-hint--error">{error}</div>}
        {step === "email" && (
          <form className="auth-form" onSubmit={handleContinue}>
            <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                useOneTap
              />
            </div>
            {isGoogleUser && (
              <div className="auth-hint auth-hint--google">
                This email is registered with Google. Please use Google login above.
              </div>
            )}
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" />
            <button type="submit" disabled={checking}>{checking ? "Checking..." : "Continue"}</button>
          </form>
        )}
        {step === "login" && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="email">Email</label>
            <input type="text" id="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Password"
                autoFocus
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={0}
                role="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.08-4.13M9.5 9.5a3 3 0 0 1 4.24 4.24" /><path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" /><path d="M9.88 9.88L4.12 4.12" /><path d="M14.12 14.12l5.76 5.76" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </span>
            </div>
            <div className="auth-actions">
              <button type="submit">Log in</button>
              <a className="go-back-link" onClick={e => { e.preventDefault(); setStep("email"); }} href="#">Go back</a>
            </div>
          </form>
        )}
        {step === "signup" && (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <div className="auth-hint">No account found for <b>{email}</b>. Please fill in your details to sign up.</div>
            <label htmlFor="email">Email</label>
            <input type="text" id="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <label htmlFor="fullName">Full Name</label>
            <input type="text" id="fullName" name="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Full name" autoFocus />
            <label htmlFor="username">Username</label>
            <input type="text" id="username" name="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Username" />
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showSignupPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowSignupPassword(v => !v)}
                tabIndex={0}
                role="button"
                aria-label={showSignupPassword ? "Hide password" : "Show password"}
              >
                {showSignupPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.08-4.13M9.5 9.5a3 3 0 0 1 4.24 4.24" /><path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" /><path d="M9.88 9.88L4.12 4.12" /><path d="M14.12 14.12l5.76 5.76" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </span>
            </div>
            <div className="auth-actions">
              <button type="submit">Sign up</button>
              <a className="go-back-link" onClick={e => { e.preventDefault(); setStep("email"); }} href="#">Go back</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
