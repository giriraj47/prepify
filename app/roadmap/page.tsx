"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useRoadmap } from "@/lib/hooks";
import { RoadmapHeader, TopicCard } from "@/app/roadmap/components";

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

function RoadmapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    roadmap,
    topics,
    loading: roadmapLoading,
    error,
    loadRoadmap,
    setSelectedRoadmap,
  } = useRoadmap();
  const [localTopics, setLocalTopics] = useState<RoadmapTopicRow[]>([]);

  const selectedRoadmapId = searchParams.get("rid");

  useEffect(() => {
    setLocalTopics(topics);
  }, [topics]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setSelectedRoadmap(selectedRoadmapId);
    void loadRoadmap(selectedRoadmapId ?? undefined);
  }, [
    authLoading,
    isAuthenticated,
    loadRoadmap,
    router,
    selectedRoadmapId,
    setSelectedRoadmap,
  ]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
          <p className="text-sm text-red-200">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || roadmapLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-sm text-gray-400">Loading roadmap…</p>
        </div>
      </div>
    );
  }

  const totalTopics = localTopics.length;

  const isTopicComplete = (topic: RoadmapTopicRow) => {
    if (!topic.resources?.length) return false;
    return topic.resources.every((r) => r.completed);
  };

  const isTopicUnlocked = (index: number) => {
    if (index === 0) return true;
    const prev = localTopics[index - 1];
    return prev ? isTopicComplete(prev) : false;
  };

  const allResourcesCompleted = localTopics.every(
    (topic) => topic.resources?.every((r) => r.completed) ?? true,
  );

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

    // Update local state immediately
    setLocalTopics((prev) =>
      prev.map((t) =>
        t.id === topic.id
          ? {
              ...t,
              resources: updatedResources,
              status: completed ? "completed" : "in_progress",
            }
          : t,
      ),
    );

    // Update database
    const supabase = (
      await import("@/lib/supabase/client")
    ).createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("roadmap_topics")
      .update({
        resources: updatedResources,
        status: completed ? "completed" : "in_progress",
      })
      .eq("id", topic.id);

    if (updateError) {
      console.error("Failed to update roadmap topic in DB:", updateError);
      // Revert local state if DB update fails
      setLocalTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? {
                ...t,
                resources: topic.resources,
                status: topic.status,
              }
            : t
        )
      );
      return;
    }

    // Clear local storage cache to force fresh fetch on reload
    if (typeof window !== "undefined") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
         const cacheKey = `prepai-roadmap:${user.id}:${selectedRoadmapId || "latest"}`;
         localStorage.removeItem(cacheKey);
      }
    }

    // Update next topic if completed
    if (completed) {
      const idx = localTopics.findIndex((t) => t.id === topic.id);
      const nextTopic = localTopics[idx + 1];
      if (nextTopic && nextTopic.status === "locked") {
        const { error: nextError } = await supabase
          .from("roadmap_topics")
          .update({ status: "available" })
          .eq("id", nextTopic.id);
        
        if (nextError) {
          console.error("Failed to unlock next roadmap topic:", nextError);
          // Revert local state for the next topic
          setLocalTopics((prev) =>
            prev.map((t) =>
              t.id === nextTopic.id ? { ...t, status: "locked" } : t,
            ),
          );
        }
        setLocalTopics((prev) =>
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
      <RoadmapHeader
        title={roadmap?.title ?? ""}
        description={roadmap?.description ?? ""}
        estimatedWeeks={roadmap?.estimated_weeks ?? null}
        totalTopics={totalTopics}
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 opacity-50">
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
            {localTopics.map((topic, index) => (
              <TopicCard
                key={topic.order_index}
                topic={topic}
                index={index}
                isUnlocked={isTopicUnlocked(index)}
                isComplete={isTopicComplete(topic)}
                allTopics={localTopics}
                onToggleResource={toggleResource}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={!allResourcesCompleted}
              className={[
                "rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition",
                allResourcesCompleted
                  ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 cursor-pointer"
                  : "border border-white/10 bg-white/5 text-white/40 cursor-not-allowed",
              ].join(" ")}
              onClick={() => {
                const query = selectedRoadmapId
                  ? `?rid=${selectedRoadmapId}`
                  : "";
                router.push(`/roadmap/review${query}`);
              }}
            >
              Review Your Progress
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/90 transition hover:bg-white/10"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoadmapPageContent />
    </Suspense>
  );
}
