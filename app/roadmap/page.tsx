"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useRoadmap } from "@/lib/hooks";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

import "./roadmap.css";

/* ─────────────────────────────────────────────
   Topic component (inline)
───────────────────────────────────────────── */
function TopicRow({
  topic,
  index,
  isUnlocked,
  isComplete,
  isLast,
  onToggleResource,
}: {
  topic: RoadmapTopicRow;
  index: number;
  isUnlocked: boolean;
  isComplete: boolean;
  isLast: boolean;
  onToggleResource: (topic: RoadmapTopicRow, resourceIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(isUnlocked);
  const state = isComplete ? "complete" : isUnlocked ? "available" : "locked";

  return (
    <div className="rm-topic" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Connector */}
      <div className="rm-connector">
        <div className={`rm-connector-dot rm-connector-dot--${state}`} />
        {!isLast && <div className="rm-connector-line" />}
      </div>

      {/* Body */}
      <div className="rm-topic-body">
        {/* Title row */}
        <div
          className="rm-topic-head"
          onClick={() => isUnlocked && setExpanded((e) => !e)}
        >
          <span className="rm-topic-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={`rm-topic-title rm-topic-title--${state}`}>
            {topic.title}
          </span>
          <span className={`rm-topic-badge rm-topic-badge--${state}`}>
            {state === "complete"
              ? "Done"
              : state === "locked"
                ? "Locked"
                : "Active"}
          </span>
        </div>

        {topic.description && (
          <p className="rm-topic-desc">{topic.description}</p>
        )}

        <div className="rm-topic-meta-row">
          {topic.estimated_hours && (
            <span className="rm-topic-hours">
              {topic.estimated_hours}h estimated
            </span>
          )}
          {isUnlocked && topic.resources?.length > 0 && (
            <button
              className="rm-topic-expand"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded
                ? "Collapse ↑"
                : `${topic.resources.length} Resources ↓`}
            </button>
          )}
        </div>

        {/* Resources */}
        {isUnlocked && topic.resources?.length > 0 && (
          <div
            className={`rm-resources ${expanded ? "rm-resources--visible" : "rm-resources--hidden"}`}
            style={{
              maxHeight: expanded ? `${topic.resources.length * 68}px` : "0",
            }}
          >
            {topic.resources.map((resource, ri) => (
              <div key={ri} className="rm-resource">
                <button
                  className={`rm-resource-check ${resource.completed ? "rm-resource-check--done" : ""}`}
                  onClick={() => onToggleResource(topic, ri)}
                  aria-label={
                    resource.completed ? "Mark incomplete" : "Mark complete"
                  }
                >
                  {resource.completed && (
                    <span className="rm-resource-check-inner" />
                  )}
                </button>
                <div className="rm-resource-info">
                  <span
                    className={`rm-resource-title ${resource.completed ? "rm-resource-title--done" : ""}`}
                  >
                    {resource.title}
                  </span>
                  <span className="rm-resource-type">{resource.type}</span>
                </div>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rm-resource-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
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

  const isTopicComplete = (t: RoadmapTopicRow) =>
    t.resources?.length > 0 && t.resources.every((r) => r.completed);

  const isTopicUnlocked = (index: number) => {
    if (index === 0) return true;
    const prev = localTopics[index - 1];
    return prev ? isTopicComplete(prev) : false;
  };

  const allResourcesCompleted = localTopics.every(
    (t) => t.resources?.every((r) => r.completed) ?? true,
  );

  const completedTopics = localTopics.filter(isTopicComplete).length;
  const completionPct = localTopics.length
    ? Math.round((completedTopics / localTopics.length) * 100)
    : 0;

  const toggleResource = async (
    topic: RoadmapTopicRow,
    resourceIndex: number,
  ) => {
    const updatedResources = topic.resources.map((r, idx) =>
      idx === resourceIndex ? { ...r, completed: !r.completed } : r,
    );
    const completed = updatedResources.every((r) => r.completed);

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

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("roadmap_topics")
      .update({
        resources: updatedResources,
        status: completed ? "completed" : "in_progress",
      })
      .eq("id", topic.id);

    if (updateError) {
      setLocalTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? { ...t, resources: topic.resources, status: topic.status }
            : t,
        ),
      );
      return;
    }

    if (typeof window !== "undefined") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        localStorage.removeItem(
          `prepai-roadmap:${user.id}:${selectedRoadmapId || "latest"}`,
        );
      }
    }

    if (completed) {
      const idx = localTopics.findIndex((t) => t.id === topic.id);
      const next = localTopics[idx + 1];
      if (next && next.status === "locked") {
        await supabase
          .from("roadmap_topics")
          .update({ status: "available" })
          .eq("id", next.id);
        setLocalTopics((prev) =>
          prev.map((t) =>
            t.id === next.id ? { ...t, status: "available" } : t,
          ),
        );
      }
    }
  };

  if (authLoading || roadmapLoading) {
    return (
      <div className="rm-center">
        <p>Loading roadmap…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm-center">
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgba(250,80,80,0.6)", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <button
            className="rm-footer-btn rm-footer-btn--secondary"
            onClick={() => router.push("/")}
          >
            ← Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rm-root">
        <div className="rm-glow" />
        <div className="rm-inner">
          {/* Header */}
          <header className="rm-header">
            <p className="rm-header-eyebrow">Learning Roadmap</p>
            <h1 className="rm-header-title">
              {roadmap?.title || "Your Roadmap"}
            </h1>
            {roadmap?.description && (
              <p className="rm-header-desc">{roadmap.description}</p>
            )}
            <div className="rm-header-meta">
              {roadmap?.estimated_weeks && (
                <div className="rm-meta-item">
                  <span className="rm-meta-label">Estimated</span>
                  <span className="rm-meta-value">
                    {roadmap.estimated_weeks} Weeks
                  </span>
                </div>
              )}
              <div className="rm-meta-item">
                <span className="rm-meta-label">Topics</span>
                <span className="rm-meta-value">{localTopics.length}</span>
              </div>
              <div className="rm-meta-item">
                <span className="rm-meta-label">Completed</span>
                <span
                  className="rm-meta-value"
                  style={{
                    color:
                      completionPct > 0 ? "rgba(74,222,128,0.75)" : undefined,
                  }}
                >
                  {completionPct}%
                </span>
              </div>
            </div>
            <div className="rm-progress-bar-wrap">
              <div
                className="rm-progress-bar-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </header>

          {/* Topics */}
          <div>
            {localTopics.map((topic, index) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                index={index}
                isUnlocked={isTopicUnlocked(index)}
                isComplete={isTopicComplete(topic)}
                isLast={index === localTopics.length - 1}
                onToggleResource={toggleResource}
              />
            ))}
          </div>

          {/* Footer */}
          <footer className="rm-footer">
            <button
              className="rm-footer-btn rm-footer-btn--primary"
              disabled={!allResourcesCompleted}
              onClick={() =>
                router.push(
                  `/roadmap/review${selectedRoadmapId ? `?rid=${selectedRoadmapId}` : ""}`,
                )
              }
            >
              Review Progress →
            </button>
            <button
              className="rm-footer-btn rm-footer-btn--secondary"
              onClick={() => router.push("/")}
            >
              Dashboard
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="rm-center">
          <p>Loading…</p>
        </div>
      }
    >
      <RoadmapPageContent />
    </Suspense>
  );
}
