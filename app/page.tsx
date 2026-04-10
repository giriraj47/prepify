"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useProfile } from "@/lib/hooks";
import { Dashboard, LandingPage } from "@/app/components/home";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CACHE_TTL_MS = 5 * 60 * 1000;

function getSummaryCacheKey(userId: string) {
  return `prepai-homepage-summary:${userId}`;
}

function loadCachedSummary(userId: string) {
  if (typeof window === "undefined") return null;
  try {
    const payload = window.localStorage.getItem(getSummaryCacheKey(userId));
    if (!payload) return null;
    const parsed = JSON.parse(payload) as {
      expiresAt: number;
      summary: {
        score: number;
        correct: number;
        total: number;
        weakTopics: string[];
        strongTopics: string[];
      };
    };
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(getSummaryCacheKey(userId));
      return null;
    }
    return parsed.summary;
  } catch {
    return null;
  }
}

function saveSummaryCache(
  userId: string,
  summary: {
    score: number;
    correct: number;
    total: number;
    weakTopics: string[];
    strongTopics: string[];
  },
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getSummaryCacheKey(userId),
      JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, summary }),
    );
  } catch {
    // ignore storage errors
  }
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isOnboarded, loading: profileLoading } = useProfile();
  const [mounted, setMounted] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<{
    score: number;
    correct: number;
    total: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect unauthenticated→login or authenticated-not-onboarded→onboarding
  useEffect(() => {
    if (authLoading || profileLoading) return;
    // Already authenticated and onboarded → stay on dashboard
    if (isAuthenticated && isOnboarded) return;
    // Authenticated but NOT yet onboarded → send to onboarding
    if (isAuthenticated && !isOnboarded) {
      router.push("/onboarding");
    }
    // Not authenticated → show landing page (no redirect)
  }, [authLoading, profileLoading, isAuthenticated, isOnboarded, router]);

  // Load summary data only when user is logged in & onboarded
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const cached = loadCachedSummary(user.id);
        if (cached) setSummary(cached);

        const { data: latest } = await supabase
          .from("assessments")
          .select(
            "score, correct_answers, total_questions, weak_topics, strong_topics",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          const freshSummary = {
            score: Number(latest.score ?? 0),
            correct: latest.correct_answers ?? 0,
            total: latest.total_questions ?? 0,
            weakTopics: (latest.weak_topics as string[]) ?? [],
            strongTopics: (latest.strong_topics as string[]) ?? [],
          };
          setSummary(freshSummary);
          saveSummaryCache(user.id, freshSummary);
        }
      } catch {
        // ignore
      } finally {
        setSummaryLoading(false);
      }
    };
    void loadSummary();
  }, [user, isAuthenticated]);

  // SSR shell — render nothing until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-[#f0f2fa]" />;
  }

  // Auth is still resolving
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f0f2fa] flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
          <span className="text-sm font-medium tracking-wide">Loading…</span>
        </div>
      </div>
    );
  }

  // Not authenticated → show marketing landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Authenticated but profile still loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
          <span className="text-sm font-medium tracking-wide">Loading Dashboard…</span>
        </div>
      </div>
    );
  }

  // Authenticated & onboarded → Dashboard
  return <Dashboard summary={summary} />;
}
