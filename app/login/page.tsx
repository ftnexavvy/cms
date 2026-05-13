"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe2, Loader2, Lock, ShieldCheck, Zap } from "lucide-react";

const SITES_REMOVED = true;


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "24px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: "fixed",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: 960,
          width: "100%",
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
          position: "relative",
          zIndex: 1,
        }}
        className="login-grid"
      >
        {/* ── Left panel ── */}
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRight: "1px solid var(--border-subtle)",
            padding: "56px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* subtle grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--text-primary)",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={15} color="#080808" strokeWidth={2.5} />
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "0.01em",
                }}
              >
                CMS Studio
              </span>
            </div>

            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: 16,
              }}
            >
              Publishing Platform
            </p>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                margin: "0 0 20px",
              }}
            >
              One studio.<br />Every website.
            </h1>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                maxWidth: 320,
                margin: 0,
              }}
            >
              Centralized blog management across all connected
              sites — publish, edit, and organize content from
              a single command center.
            </p>
          </div>

{/* Sites list removed for security */}

        </div>

        {/* ── Right panel (form) ── */}
        <div
          style={{
            padding: "56px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
              color: "var(--text-secondary)",
            }}
          >
            <Lock size={16} />
          </div>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              margin: "0 0 36px",
            }}
          >
            Sign in to access your publishing workspace.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--status-error-bg)",
                  border: "1px solid var(--status-error-border)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--status-error-text)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: 4, justifyContent: "center", padding: "12px 20px" }}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowRight size={15} />
              )}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              marginTop: 32,
              lineHeight: 1.6,
            }}
          >
            Access is restricted to authorized administrators only.
            Contact your system administrator for access.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .login-grid {
            grid-template-columns: 1fr !important;
          }
          .login-grid > div:first-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
