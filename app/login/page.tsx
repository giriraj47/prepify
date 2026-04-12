"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth-store";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  .login-root {
    position: fixed; inset: 0;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    display: flex;
    overflow: hidden;
  }

  /* ── Atmospheric glow ── */
  .login-glow {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 60% at 62% 52%, rgba(10,62,55,0.52) 0%, rgba(5,28,26,0.26) 40%, transparent 68%),
      radial-gradient(ellipse 28% 22% at 12% 78%, rgba(4,22,35,0.28) 0%, transparent 55%);
  }

  /* ── Left panel (branding) ── */
  .login-left {
    position: relative; z-index: 1;
    flex: 1;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 2.8rem 4vw;
    border-right: 0.5px solid rgba(255,255,255,0.06);
  }

  .login-logo {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #fff;
    text-decoration: none;
  }

  .login-headline {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(2.2rem, 4.5vw, 4.2rem);
    line-height: 1.05;
    letter-spacing: -0.015em;
    text-transform: uppercase;
    color: #fff;
    max-width: 14ch;
    animation: loginFadeUp 0.5s ease both;
  }
  .login-headline em {
    font-style: normal;
    color: rgba(255,255,255,0.22);
  }

  .login-tagline {
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    animation: loginFadeUp 0.5s 0.08s ease both;
  }

  /* ── Right panel (form) ── */
  .login-right {
    position: relative; z-index: 1;
    width: 480px;
    flex-shrink: 0;
    display: flex; flex-direction: column;
    justify-content: center;
    padding: 4rem 3.5rem;
    border-left: 0.5px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(8px);
    animation: loginFadeUp 0.45s 0.05s ease both;
  }

  .login-form-eyebrow {
    font-size: 0.52rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    margin-bottom: 1.6rem;
  }

  .login-form-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: #fff;
    line-height: 1.05;
    margin-bottom: 0.6rem;
  }

  .login-form-sub {
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.25);
    margin-bottom: 2.8rem;
    line-height: 1.7;
  }
  .login-form-sub a {
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    transition: color 0.15s;
  }
  .login-form-sub a:hover { color: rgba(255,255,255,0.85); }

  /* Google button */
  .login-google-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 0.9rem;
    height: 44px;
    border: 0.5px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    transition: all 0.15s;
    margin-bottom: 1.8rem;
  }
  .login-google-btn:not(:disabled):hover {
    border-color: rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.75);
    background: rgba(255,255,255,0.05);
  }
  .login-google-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .login-google-icon {
    width: 14px; height: 14px; flex-shrink: 0;
  }

  /* Divider */
  .login-divider {
    display: flex; align-items: center; gap: 1rem;
    margin-bottom: 1.8rem;
  }
  .login-divider-line {
    flex: 1; height: 0.5px; background: rgba(255,255,255,0.07);
  }
  .login-divider-text {
    font-size: 0.5rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.18);
  }

  /* Field */
  .login-field { margin-bottom: 1.4rem; }

  .login-field-top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  .login-label {
    font-size: 0.5rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
  }

  .login-forgot {
    font-size: 0.5rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    text-decoration: none;
    transition: color 0.15s;
  }
  .login-forgot:hover { color: rgba(255,255,255,0.55); }

  .login-input-wrap { position: relative; }

  .login-input {
    width: 100%; height: 44px;
    border: 0.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.02);
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.75);
    padding: 0 3rem 0 1rem;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
    -webkit-appearance: none;
  }
  .login-input::placeholder { color: rgba(255,255,255,0.15); }
  .login-input:focus {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.03);
  }

  .login-input-action {
    position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.2);
    transition: color 0.15s;
    padding: 0;
    line-height: 1;
  }
  .login-input-action:hover { color: rgba(255,255,255,0.55); }

  /* Error */
  .login-error {
    font-size: 0.52rem;
    letter-spacing: 0.1em;
    color: rgba(250,80,80,0.75);
    border: 0.5px solid rgba(250,80,80,0.2);
    padding: 0.65rem 0.9rem;
    margin-bottom: 1.4rem;
    line-height: 1.6;
  }

  /* Submit */
  .login-submit {
    width: 100%; height: 44px;
    background: rgba(255,255,255,0.92);
    border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #000;
    transition: background 0.15s;
    margin-top: 0.4rem;
  }
  .login-submit:not(:disabled):hover { background: #fff; }
  .login-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Footer links */
  .login-links {
    display: flex; align-items: center; justify-content: center; gap: 2rem;
    margin-top: 2.5rem;
  }
  .login-links a {
    font-size: 0.5rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.15);
    text-decoration: none;
    transition: color 0.15s;
  }
  .login-links a:hover { color: rgba(255,255,255,0.4); }

  /* Mobile: stack vertically */
  @media (max-width: 768px) {
    .login-root { flex-direction: column; overflow-y: auto; position: relative; min-height: 100vh; }
    .login-left {
      flex: none; border-right: none;
      border-bottom: 0.5px solid rgba(255,255,255,0.06);
      padding: 2rem 6vw 2.5rem;
    }
    .login-headline { font-size: clamp(1.8rem, 8vw, 3rem); }
    .login-tagline { display: none; }
    .login-right { width: 100%; padding: 3rem 6vw 4rem; }
  }

  @keyframes loginFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const signIn = useAuthStore((state) => state.signIn);

  const getNext = () => {
    const requestedNext = searchParams.get("next");
    return requestedNext && requestedNext !== "/login" ? requestedNext : "/";
  };

  const handleOAuth = async (provider: "google") => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNext())}`,
      },
    });
    setLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      window.location.href = `${window.location.origin}${getNext()}`;
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="login-root">
        <div className="login-glow" />

        {/* Left — branding */}
        <div className="login-left">
          <a href="/" className="login-logo">
            Prepify
          </a>

          <h1 className="login-headline">
            Your Next
            <br />
            Offer
            <br />
            <em>Starts Here.</em>
          </h1>

          <p className="login-tagline">AI-powered interview preparation</p>
        </div>

        {/* Right — form */}
        <div className="login-right">
          <p className="login-form-eyebrow">Account Access</p>
          <h2 className="login-form-title">Log In</h2>
          <p className="login-form-sub">
            No account? <a href="/signup">Sign up for free →</a>
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            className="login-google-btn"
            onClick={() => handleOAuth("google")}
            disabled={loading}
          >
            <svg className="login-google-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="rgba(255,255,255,0.35)"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="rgba(255,255,255,0.3)"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="rgba(255,255,255,0.25)"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="rgba(255,255,255,0.3)"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <span className="login-divider-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn}>
            <div className="login-field">
              <div className="login-field-top">
                <label className="login-label">Email</label>
              </div>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field-top">
                <label className="login-label">Password</label>
                <a href="#" className="login-forgot">
                  Forgot?
                </a>
              </div>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-input-action"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Logging in…" : "Log In →"}
            </button>
          </form>

          <div className="login-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
            }}
          >
            Loading…
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
