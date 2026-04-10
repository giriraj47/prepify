"use client";

import { Suspense, FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth-store";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const signIn = useAuthStore((state) => state.signIn);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const requestedNext = searchParams.get("next");
    const next =
      requestedNext && requestedNext !== "/login" ? requestedNext : "/";

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      const origin = window.location.origin;
      const requestedNext = searchParams.get("next");
      const next =
        requestedNext && requestedNext !== "/login" ? requestedNext : "/";
      window.location.href = `${origin}${next}`;
    } catch (error: any) {
      setError(error?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060813] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(125,84,255,0.18), transparent 34%), radial-gradient(circle at 80% 10%, rgba(56,210,255,0.16), transparent 28%), linear-gradient(180deg, rgba(8,12,26,0.96), rgba(5,8,18,0.9))",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-4xl border border-white/10 bg-[#101626]/95 p-8 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-300 shadow-[0_8px_30px_-20px_rgba(255,255,255,0.3)]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                AI
              </span>
              InterviewAI
            </div>

            <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Elevate Your Career
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              The cognitive void for high-performance preparation. Access your
              AI interview simulator.
            </p>
          </div>

          <div className="mt-9 grid gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                G
              </span>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-violet-300 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                GH
              </span>
              Continue with GitHub
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-500 sm:text-sm">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleEmailSignIn} className="mt-8 space-y-5">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-400">
                Email address
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="name@company.com"
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200/20"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-400">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  Forgot?
                </a>
              </div>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200/20"
                required
              />
            </div>

            {error ? (
              <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-linear-to-r from-cyan-400 via-sky-400 to-blue-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-[0_25px_60px_-40px_rgb(56,189,248,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            New to InterviewAI?{" "}
            <a
              href="/signup"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Create Account
            </a>
          </div>

          <div className="mt-8 grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-emerald-400/10 text-emerald-300">
                🔒
              </span>
              Secure Access
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-violet-400/10 text-violet-300">
                ⚡
              </span>
              AI Processing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
