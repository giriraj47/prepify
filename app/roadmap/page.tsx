"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Roadmap } from "@/lib/gemini";

type Resource = {
  title: string;
  url: string;
  type: string;
  completed?: boolean;
};

type RoadmapTopicRow = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: string;
  estimated_hours: number | null;
  resources: Resource[];
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getRoadmapCacheKey(userId: string, roadmapId: string | null) {
  return `prepai-roadmap:${userId}:${roadmapId ?? "latest"}`;
}

function loadCachedRoadmap(userId: string, roadmapId: string | null) {
  if (typeof window === "undefined") return null;
  try {
    const payload = window.localStorage.getItem(
      getRoadmapCacheKey(userId, roadmapId),
    );
    if (!payload) return null;
    const parsed = JSON.parse(payload) as {
      expiresAt: number;
      roadmap: Roadmap;
      topics: RoadmapTopicRow[];
    };
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(getRoadmapCacheKey(userId, roadmapId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveRoadmapCache(
  userId: string,
  roadmapId: string | null,
  roadmap: Roadmap,
  topics: RoadmapTopicRow[],
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getRoadmapCacheKey(userId, roadmapId),
      JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, roadmap, topics }),
    );
  } catch {
    // ignore storage errors
  }
}

export default function RoadmapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [topics, setTopics] = useState<RoadmapTopicRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const rid = searchParams.get("rid");
      const cached = loadCachedRoadmap(userData.user.id, rid);
      if (cached) {
        setRoadmap(cached.roadmap);
        setTopics(cached.topics);
      }

      const roadmapQuery = supabase
        .from("roadmaps")
        .select("id, title, description, estimated_weeks")
        .eq("user_id", userData.user.id);

      const { data: roadmapRow } = rid
        ? await roadmapQuery.eq("id", rid).maybeSingle()
        : await roadmapQuery
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

      if (!roadmapRow) {
        if (!cached) {
          setError("No roadmap found. Generate one from the Study page.");
        }
        return;
      }

      const { data: topicsRows, error: topicsError } = await supabase
        .from("roadmap_topics")
        .select(
          "id, title, description, order_index, status, estimated_hours, resources",
        )
        .eq("roadmap_id", roadmapRow.id)
        .order("order_index");

      if (topicsError || !topicsRows) {
        if (!cached) {
          setError("Failed to load roadmap topics.");
        }
        return;
      }

      const freshRoadmap = {
        title: roadmapRow.title,
        description: roadmapRow.description ?? "",
        estimated_weeks: roadmapRow.estimated_weeks ?? 0,
        topics: [],
      };
      const mapped = topicsRows.map((t) => ({
        ...t,
        resources: Array.isArray(t.resources)
          ? (t.resources as Resource[])
          : [],
      }));
      setRoadmap(freshRoadmap);
      setTopics(mapped);
      saveRoadmapCache(userData.user.id, rid, freshRoadmap, mapped);
    };

    void load();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
          <p className="text-sm text-red-200">{error}</p>
          <button
            onClick={() => router.push("/study")}
            className="mt-4 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30"
          >
            Back to Study
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-sm text-gray-400">Loading roadmap…</p>
        </div>
      </div>
    );
  }

  const totalTopics = topics.length;

  const isTopicComplete = (topic: RoadmapTopicRow) => {
    if (!topic.resources?.length) return false;
    return topic.resources.every((r) => r.completed);
  };

  const isTopicUnlocked = (index: number) => {
    if (index === 0) return true;
    const prev = topics[index - 1];
    return prev ? isTopicComplete(prev) : false;
  };

  const toggleResource = async (
    topic: RoadmapTopicRow,
    resourceIndex: number,
  ) => {
    const updatedResources = topic.resources.map((r, idx) =>
      idx === resourceIndex ? { ...r, completed: !r.completed } : r,
    );
    const completed = updatedResources.length
      ? updatedResources.every((r) => r.completed)
      : false;
    const nextStatus = completed ? "completed" : "in_progress";
    const supabase = createSupabaseBrowserClient();

    setTopics((prev) =>
      prev.map((t) =>
        t.id === topic.id
          ? { ...t, resources: updatedResources, status: nextStatus }
          : t,
      ),
    );

    await supabase
      .from("roadmap_topics")
      .update({
        resources: updatedResources,
        status: nextStatus,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", topic.id);

    if (completed) {
      const idx = topics.findIndex((t) => t.id === topic.id);
      const nextTopic = topics[idx + 1];
      if (nextTopic && nextTopic.status === "locked") {
        await supabase
          .from("roadmap_topics")
          .update({ status: "available" })
          .eq("id", nextTopic.id);
        setTopics((prev) =>
          prev.map((t) =>
            t.id === nextTopic.id ? { ...t, status: "available" } : t,
          ),
        );
      }
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: "#0b0b0e",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08), transparent 55%), radial-gradient(circle at 80% 10%, rgba(16,185,129,0.08), transparent 50%), radial-gradient(circle at 70% 80%, rgba(59,130,246,0.08), transparent 45%)",
      }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg
            className="h-full w-full"
            viewBox="0 0 1200 600"
            preserveAspectRatio="none"
          >
            <path
              d="M0,80 C150,140 260,40 420,120 C560,190 660,120 760,180 C860,240 980,160 1200,220"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <path
              d="M0,220 C160,280 260,190 420,250 C560,320 660,240 760,300 C860,360 980,280 1200,340"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
            <path
              d="M0,360 C160,420 260,330 420,390 C560,460 660,380 760,440 C860,500 980,420 1200,480"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div
            className="text-center text-[48px] font-semibold tracking-[0.6em] text-white/10 md:text-[84px]"
            style={{
              fontFamily: '"Space Grotesk", "Plus Jakarta Sans", serif',
            }}
          >
            ROADMAP
          </div>
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">
              Personalised Path
            </p>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
              {roadmap.title}
            </h1>
            <p className="mt-3 text-sm text-white/60">{roadmap.description}</p>
            <div className="mt-4 text-xs text-white/50">
              ~{roadmap.estimated_weeks} weeks · {totalTopics} topics
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 opacity-50">
          <svg
            className="h-full w-full"
            viewBox="0 0 1200 1200"
            preserveAspectRatio="none"
          >
            <path
              d="M100,100 C260,160 320,40 500,120 C660,190 760,120 880,220 C980,310 1040,240 1120,320"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <path
              d="M80,360 C240,420 320,310 500,380 C660,450 760,360 880,460 C980,550 1040,480 1120,560"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <path
              d="M80,620 C240,680 320,570 500,640 C660,710 760,620 880,720 C980,810 1040,740 1120,820"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-6">
          <div className="relative grid gap-10">
            {topics.map((topic, index) => {
              const alignRight = index % 2 === 1;
              const phaseLabel = `Phase ${index + 1}`;
              const totalResources = topic.resources?.length ?? 0;
              const unlocked = isTopicUnlocked(index);
              const complete = isTopicComplete(topic);
              const statusLabel = complete
                ? "complete"
                : unlocked
                  ? "available"
                  : "locked";
              return (
                <div
                  key={topic.order_index}
                  className={[
                    "relative z-10 flex flex-col gap-4 md:flex-row",
                    alignRight ? "md:flex-row-reverse" : "",
                  ].join(" ")}
                >
                  <div className="flex w-full flex-col gap-3 md:w-1/2">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
                      <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.6)]" />
                      <span>{phaseLabel}</span>
                      <span className="text-white/20">·</span>
                      <span>{statusLabel}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold">{topic.title}</h3>
                        <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                          ~{topic.estimated_hours} hrs
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-white/60">
                        {topic.description}
                      </p>
                      {topic.resources?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                          {topic.resources.map((r, idx) => (
                            <label
                              key={`${topic.order_index}-${idx}`}
                              className={[
                                "flex items-center gap-2 rounded-full border px-3 py-1 transition",
                                unlocked
                                  ? "border-white/10 bg-white/5 hover:border-emerald-400/40"
                                  : "border-white/5 bg-white/5 opacity-50",
                              ].join(" ")}
                            >
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 accent-emerald-400"
                                checked={r.completed ?? false}
                                disabled={!unlocked}
                                onChange={() => toggleResource(topic, idx)}
                              />
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={[
                                  "hover:text-emerald-100",
                                  unlocked ? "" : "pointer-events-none",
                                ].join(" ")}
                              >
                                {r.type}: {r.title}
                              </a>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden w-1/2 md:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
