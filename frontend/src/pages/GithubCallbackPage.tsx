import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { authStore } from "../store/authStore";
import { githubAuth } from "../api/user";

export default function GithubCallbackPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (!code) {
      setError("No code found in URL");
      setLoading(false);
      return;
    }

    githubAuth({ code })
      .then(res => {
        authStore.token = res.token;
        authStore.user = res.user;
        navigate("/");
      })
      .catch(err => {
        setError(err.message || "GitHub login failed");
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div style={{ padding: 32 }}>Logging in with GitHub...</div>;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;
  return null;
}
