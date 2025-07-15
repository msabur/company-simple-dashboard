import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { authStore } from "../store/authStore";
import { githubAuth, linkAccount } from "../api/user";

export default function GithubCallbackPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isLink, setIsLink] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const linkParam = url.searchParams.get("link") === "1";
    setIsLink(linkParam);

    if (!code) {
      setError("No code found in URL");
      setLoading(false);
      return;
    }

    if (linkParam) {
      linkAccount({ provider: "github", token: code })
        .then(() => {
          setMessage("GitHub account linked!");
          setTimeout(() => navigate("/"), 1500);
        })
        .catch(err => {
          setError(err.message || "GitHub linking failed");
          setLoading(false);
        });
    } else {
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
    }
  }, [navigate]);

  if (loading) return <div style={{ padding: 32 }}>{message ? message : (isLink ? "Linking GitHub account..." : "Logging in with GitHub...")}</div>;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;
  return null;
}
