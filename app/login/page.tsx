"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth-store";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const signIn = useAuthStore((state) => state.signIn);

  const handleOAuth = async (provider: "google") => {
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
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02030a] text-[#f4f6ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(83,97,143,0.08),transparent_45%)]" />

      <div className="pointer-events-none absolute right-[12%] top-1/2 hidden h-[460px] w-[220px] -translate-y-1/2 opacity-60 md:block">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(170,180,220,0.55) 1.2px, transparent 1.3px)",
            backgroundSize: "12px 12px",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-[520px] rounded-md border border-[#202636] bg-[linear-gradient(180deg,#060912_0%,#04070f_100%)] px-8 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_28px_80px_rgba(0,0,0,0.75)]">
          <div className="mx-auto w-full max-w-[390px]">
            <div className="text-center">
              <h1 className="text-[40px] font-medium tracking-tight text-white">
                Log in
              </h1>
              <p className="mt-2 text-sm text-[#8a93ab]">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="font-semibold text-[#dde3f8]">
                  Sign up
                </a>
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-[6px] border border-[#2a3040] bg-[#121722] text-sm font-medium text-[#e6ebff] transition hover:bg-[#161c2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-lg leading-none text-[#f6f7fb]">G</span>
              Log in with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-[#6e778e]">
              <span className="h-px flex-1 bg-[#232a3b]" />
              or
              <span className="h-px flex-1 bg-[#232a3b]" />
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ddf0]">
                  Email
                </label>
                <div className="relative">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-[4px] border border-[#3a4154] bg-[#0f131d] px-4 text-sm text-[#f3f6ff] outline-none transition placeholder:text-[#7e879e] focus:border-[#707a96]"
                    required
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-[4px] bg-gradient-to-br from-[#9da6ff] to-[#8c57ff] opacity-90" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ddf0]">
                    Password
                  </label>
                  <a href="#" className="text-sm text-[#d6dbee] hover:text-white">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-[4px] border border-[#3a4154] bg-[#0f131d] px-4 pr-12 text-sm text-[#f3f6ff] outline-none transition placeholder:text-[#7e879e] focus:border-[#707a96]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9ea7bc] hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-[4px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-[4px] bg-[#f2f2f4] text-sm font-medium text-[#090b12] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="mt-14 flex items-center justify-center gap-6 text-[11px] text-[#5c657b]">
              <a href="#" className="hover:text-[#8e96ac]">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[#8e96ac]">
                Privacy Policy
              </a>
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
