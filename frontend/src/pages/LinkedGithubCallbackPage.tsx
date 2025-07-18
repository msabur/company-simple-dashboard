import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { listLinkedAccounts, linkAccount } from "../api/user";

export default function LinkedGithubCallbackPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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

    linkAccount({ provider: "github", token: code })
      .then(() => {
        setMessage("GitHub account linked!");
        setTimeout(() => navigate("/dashboard"), 1500);
      })
      .catch(err => {
        setError(err.message || "GitHub linking failed");
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div style={{ padding: 32 }}>Linking GitHub account...</div>;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;
  return <div style={{ padding: 32 }}>{message || "GitHub account linked!"}</div>;
}
