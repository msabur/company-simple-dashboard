import { observer } from "mobx-react-lite";
import { useLocation, Link, Route, Switch } from "wouter";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState, useEffect } from "react";

import AuthPage from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { authStore } from "./store/authStore";
import GithubCallbackPage from "./pages/GithubCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LinkedGithubCallbackPage from "./pages/LinkedGithubCallbackPage";

import "./index.css";

export default observer(function App() {
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    // Try to load from localStorage or use prefers-color-scheme
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darkMode");
      if (saved !== null) return saved === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) {
      if (darkMode) root.classList.add("dark-theme");
      else root.classList.remove("dark-theme");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    authStore.logout();
    navigate("/");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <div>
        <div className="nav-container">
          <nav className="navbar">
            <button
              className="logout-btn"
              style={{ marginRight: "auto" }}
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "🌙 Dark" : "☀️ Light"}
            </button>
            {authStore.user ? (
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            ) : (
              <Link href="/auth">Log in or Sign up</Link>
            )}
          </nav>
        </div>
        <main>
          <Switch>
            <Route path="/auth">
              <AuthPage />
            </Route>
            <Route path="/auth/github/callback">
              <GithubCallbackPage />
            </Route>
            <Route path="/auth/github/callback/link">
              <LinkedGithubCallbackPage />
            </Route>
            <Route path="/linked/github/callback">
              <LinkedGithubCallbackPage />
            </Route>
            <Route path="/reset-password">
              <ResetPasswordPage />
            </Route>
            <Route>
              {authStore.user ? <HomePage /> : <AuthPage />}
            </Route>
          </Switch>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
});