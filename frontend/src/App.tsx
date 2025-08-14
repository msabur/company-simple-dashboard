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
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminOrgsPage from "./pages/AdminOrgsPage";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";

import "./index.css";
import LandingPage from "./pages/LandingPage";

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
    const body = document.querySelector("body");
    if (body) {
      if (darkMode) body.classList.add("dark-theme");
      else body.classList.remove("dark-theme");
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
            <div className="navbar-left">
              <Link href="/" className="navbar-item">Home</Link>
              {authStore.user ? (
                <>
                  <Link href="/dashboard" className="navbar-item">Dashboard</Link>
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <Link href="/auth" className="navbar-item">Log in or Sign up</Link>
              )}
            </div>
            <div className="navbar-spacer" />
            <button
              className="theme-toggle-btn"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "🌙 Dark" : "☀️ Light"}
            </button>
          </nav>
        </div>
        <main>
          <Switch>
            <Route path="/">
              <LandingPage />
            </Route>
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
            <Route path="/dashboard">
              {authStore.user ? <HomePage /> : <AuthPage />}
            </Route>
            {/* Admin routes - protected */}
            <Route path="/admin">
              {authStore.user?.is_admin ? <AdminDashboard /> : <HomePage />}
            </Route>
            <Route path="/admin/users">
              {authStore.user?.is_admin ? <AdminUsersPage /> : <HomePage />}
            </Route>
            <Route path="/admin/orgs">
              {authStore.user?.is_admin ? <AdminOrgsPage /> : <HomePage />}
            </Route>
            <Route path="/admin/email-templates">
              {authStore.user?.is_admin ? <AdminEmailTemplates /> : <HomePage />}
            </Route>
          </Switch>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
});