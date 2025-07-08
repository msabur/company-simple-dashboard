import { useState } from "react";
import { useLocation } from "wouter";
import { GoogleLogin } from "@react-oauth/google";
import { signup, login, googleAuth, checkEmail, verifyEmail, resendVerificationCode, sendPasswordResetEmail } from "../api/user";
import { authStore } from "../store/authStore";
import "./AuthPage.css"

export default function AuthPage() {
  const [step, setStep] = useState<
    | "email"
    | "login"
    | "signup"
    | "verification"
    | "reset-request"
  >("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [isSocialUser, setIsSocialUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");
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
    setIsSocialUser(false);
    try {
      const res = await checkEmail(email);
      if (res.isSocialUser) {
        setIsSocialUser(true);
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
      if (err.message === "Email not verified") {
        setStep("verification");
      } else {
        setError(err.message || "Login failed");
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signup({ email, full_name: fullName, username, password });
      setStep("verification");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      await verifyEmail({ email, code: verificationCode });
      // Optionally, auto-login after verification
      const res = await login({ email, password });
      authStore.token = res.token;
      authStore.user = res.user;
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await resendVerificationCode({ email });
    } catch (err: any) {
      setError(err.message || "Resend failed");
    } finally {
      setResending(false);
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus("");
    try {
      await sendPasswordResetEmail(resetEmail);
      setResetStatus("An email has been sent with a link to reset your password. Please check your spam folder.");
    } catch (err: any) {
      setResetStatus(err.message || "Email not found, try again");
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
              <GoogleLogin onSuccess={handleGoogleSuccess} useOneTap />
              {/* GitHub Login Button */}
              <button
                type="button"
                className="github-login-btn"
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#24292f", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", cursor: "pointer" }}
                onClick={() => {
                  const params = new URLSearchParams({
                    client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
                    redirect_uri: `${window.location.origin}/auth/github/callback`,
                    scope: "read:user user:email",
                  });
                  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
                }}
              >
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 4 }}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                Login with GitHub
              </button>
            </div>
            {isSocialUser && (
              <div className="auth-hint auth-hint--google">
                This email is registered with a social account. Please login with the appropriate social account.
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
              <button type="button" className="forgot-password-link" style={{marginLeft:8}} onClick={() => { setStep("reset-request"); setResetEmail(email); setResetStatus(""); }}>Forgot password?</button>
            </div>
          </form>
        )}
        {step === "reset-request" && (
          <form className="auth-form" onSubmit={handleReset} style={{marginTop:16}}>
            <label htmlFor="resetEmail">Enter your email</label>
            <input
              type="email"
              id="resetEmail"
              name="resetEmail"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
              placeholder="Email"
              autoFocus
            />
            <button type="submit">Send reset link</button>
            <button type="button" onClick={() => setStep("login")} style={{marginLeft:8}}>Cancel</button>
            {resetStatus && <div className="auth-hint">{resetStatus}</div>}
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
        {step === "verification" && (
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="auth-hint">To complete sign-up, please enter the 4-digit code we sent to <b>{email}</b>.</div>
            <label htmlFor="verificationCode">Verification Code</label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              required
              maxLength={4}
              pattern="[0-9]{4}"
              autoFocus
              placeholder="4-digit code"
            />
            <div className="auth-actions">
              <button type="submit" disabled={verifying}>{verifying ? "Verifying..." : "Submit"}</button>
              <button type="button" onClick={handleResend} disabled={resending} style={{ marginLeft: 8 }}>
                {resending ? "Resending..." : "Resend"}
              </button>
              <a className="go-back-link" onClick={e => { e.preventDefault(); setStep("email"); }} href="#">Go back</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
