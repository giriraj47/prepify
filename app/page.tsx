"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<{
    score: number;
    correct: number;
    total: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkProfile = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push("/login");
          return;
        }
        const { data: profile, error } = await supabase
          .from("users")
          .select("id, is_onboarded")
          .eq("id", userData.user.id)
          .maybeSingle();
        if (error) {
          throw error;
        }
        if (profile?.is_onboarded) {
          return;
        }
      } catch (error) {
        console.error("Failed to check profile in Supabase", error);
      }
      router.push("/onboarding");
    };
    checkProfile().finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data: latest } = await supabase
          .from("assessments")
          .select("score, correct_answers, total_questions, weak_topics, strong_topics")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest) {
          setSummary({
            score: Number(latest.score ?? 0),
            correct: latest.correct_answers ?? 0,
            total: latest.total_questions ?? 0,
            weakTopics: (latest.weak_topics as string[]) ?? [],
            strongTopics: (latest.strong_topics as string[]) ?? [],
          });
        }
      } catch {
        // ignore
      }
    };
    void loadSummary();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0d0f1a]">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(circle_at_70%_10%,rgba(16,185,129,0.12),transparent_50%),radial-gradient(circle_at_60%_70%,rgba(59,130,246,0.12),transparent_60%)]" />
      {checking && (
        <div className="px-6 py-6 text-xs uppercase tracking-[0.3em] text-white/40">
          Loading profile...
        </div>
      )}
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Your Prep Snapshot
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Review strengths and gaps, then continue with your roadmap or mock interview.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Strong Topics
            </p>
            {summary?.strongTopics?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.strongTopics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
                  >
                    {t.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-emerald-100/60">
                No strong topics yet. Take the assessment to see results.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
              Weak Topics
            </p>
            {summary?.weakTopics?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.weakTopics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100"
                  >
                    {t.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-100/60">
                No weak topics yet. Take the assessment to see results.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">Next actions</p>
              <p className="text-sm text-white/60">
                Continue your roadmap or practice in the interview room.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/roadmap"
                className="rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/20"
              >
                View Roadmap
              </Link>
              <Link
                href="/interview"
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
              >
                Interview Section
              </Link>
              <button
                onClick={() => router.push("/study")}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 hover:border-white/30"
              >
                Retake Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
