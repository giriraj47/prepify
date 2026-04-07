"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="min-h-screen bg-[#0d0f1a] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-800 bg-slate-950 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to continue your interview prep.
        </p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-emerald-300 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={loading}
            className="w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
