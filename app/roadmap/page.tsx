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

/* ─────────────────────────────────────────────
   Inline styles as a single <style> block
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .rm-root {
    min-height: 100vh;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    position: relative;
    overflow-x: hidden;
  }

  /* Atmospheric glow */
  .rm-glow {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(ellipse 65% 55% at 58% 42%, rgba(10,62,55,0.52) 0%, rgba(5,28,26,0.28) 38%, transparent 65%),
      radial-gradient(ellipse 30% 25% at 20% 80%, rgba(5,25,35,0.35) 0%, transparent 55%);
  }

  .rm-inner {
    position: relative;
    z-index: 1;
    max-width: 960px;
    margin: 0 auto;
    padding: 0 5vw 8rem;
  }

  /* ── Header ── */
  .rm-header {
    padding: 7vh 0 6vh;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    margin-bottom: 7vh;
    animation: rmFadeUp 0.5s ease both;
  }

  .rm-header-eyebrow {
    font-size: 0.58rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    margin-bottom: 1.2rem;
  }

  .rm-header-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 1.05;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: #cdcdcd;
    max-width: 100%;
    margin-bottom: 1.4rem;
  }

  .rm-header-desc {
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.3);
    max-width: 55ch;
    line-height: 1.8;
    margin-bottom: 2rem;
  }

  .rm-header-meta {
    display: flex;
    align-items: center;
    gap: 2.5rem;
  }

  .rm-meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .rm-meta-label {
    font-size: 0.52rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }
  .rm-meta-value {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.6);
  }

  /* progress bar */
  .rm-progress-bar-wrap {
    height: 1px;
    background: rgba(255,255,255,0.08);
    width: 100%;
    margin-top: 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .rm-progress-bar-fill {
    height: 100%;
    background: rgba(74,222,128,0.5);
    transition: width 0.5s ease;
  }

  /* ── Topic ── */
  .rm-topic {
    display: grid;
    grid-template-columns: 3.5rem 1fr;
    gap: 0 2rem;
    margin-bottom: 0;
    animation: rmFadeUp 0.4s ease both;
  }

  /* vertical connector line */
  .rm-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .rm-connector-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.15rem;
    transition: background 0.25s, box-shadow 0.25s;
  }
  .rm-connector-dot--locked   { background: rgba(255,255,255,0.08); }
  .rm-connector-dot--available{ background: rgba(255,255,255,0.45); }
  .rm-connector-dot--complete { background: rgba(74,222,128,0.8); box-shadow: 0 0 8px rgba(74,222,128,0.4); }

  .rm-connector-line {
    width: 0.5px;
    flex: 1;
    min-height: 3rem;
    background: rgba(255,255,255,0.07);
    margin: 0.5rem 0;
  }

  /* topic body */
  .rm-topic-body {
    padding-bottom: 4rem;
  }

  .rm-topic-head {
    display: flex;
    align-items: baseline;
    gap: 1.2rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .rm-topic-index {
    font-size: 0.52rem;
    letter-spacing: 0.22em;
    color: rgba(255,255,255,0.2);
    flex-shrink: 0;
  }

  .rm-topic-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(1.1rem, 2.2vw, 1.6rem);
    text-transform: uppercase;
    letter-spacing: -0.005em;
    line-height: 1.1;
    transition: color 0.2s;
  }
  .rm-topic-title--locked    { color: rgba(255,255,255,0.2); }
  .rm-topic-title--available { color: rgba(255,255,255,0.85); }
  .rm-topic-title--complete  { color: rgba(74,222,128,0.85); }

  .rm-topic-badge {
    font-size: 0.5rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 0.2rem 0.55rem;
    border: 0.5px solid;
    flex-shrink: 0;
  }
  .rm-topic-badge--locked    { border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.2); }
  .rm-topic-badge--available { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.4); }
  .rm-topic-badge--complete  { border-color: rgba(74,222,128,0.3); color: rgba(74,222,128,0.7); }

  .rm-topic-desc {
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25);
    line-height: 1.75;
    max-width: 52ch;
    margin-bottom: 1.6rem;
    margin-top: 0.6rem;
  }

  .rm-topic-meta-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.6rem;
  }
  .rm-topic-hours {
    font-size: 0.55rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }
  .rm-topic-expand {
    font-size: 0.55rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: 'DM Mono', monospace;
    transition: color 0.15s;
  }
  .rm-topic-expand:hover { color: rgba(255,255,255,0.7); }

  /* Resources */
  .rm-resources {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    transition: max-height 0.4s ease, opacity 0.3s ease;
  }
  .rm-resources--hidden { max-height: 0 !important; opacity: 0; }
  .rm-resources--visible { opacity: 1; }

  .rm-resource {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 0.65rem 0;
    border-top: 0.5px solid rgba(255,255,255,0.05);
    cursor: pointer;
    transition: opacity 0.15s;
    text-decoration: none;
  }
  .rm-resource:last-child { border-bottom: 0.5px solid rgba(255,255,255,0.05); }
  .rm-resource:hover .rm-resource-title { color: rgba(255,255,255,0.85); }

  .rm-resource-check {
    width: 14px;
    height: 14px;
    border: 0.5px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, border-color 0.2s;
    cursor: pointer;
    background: none;
  }
  .rm-resource-check--done {
    background: rgba(74,222,128,0.15);
    border-color: rgba(74,222,128,0.5);
  }
  .rm-resource-check-inner {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(74,222,128,0.8);
    transition: transform 0.2s;
  }

  .rm-resource-info { flex: 1; min-width: 0; }

  .rm-resource-title {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    transition: color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .rm-resource-title--done { color: rgba(74,222,128,0.5); text-decoration: line-through; }

  .rm-resource-type {
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.15);
    margin-top: 0.15rem;
    display: block;
  }

  .rm-resource-link {
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  .rm-resource-link:hover { color: rgba(255,255,255,0.6); }

  /* ── Footer ── */
  .rm-footer {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    padding-top: 2rem;
    border-top: 0.5px solid rgba(255,255,255,0.07);
    animation: rmFadeUp 0.4s ease both;
  }

  .rm-footer-btn {
    background: none;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 0.7rem 1.8rem;
    border: 0.5px solid;
    transition: all 0.2s;
  }
  .rm-footer-btn--primary {
    border-color: rgba(74,222,128,0.35);
    color: rgba(74,222,128,0.8);
  }
  .rm-footer-btn--primary:not(:disabled):hover {
    border-color: rgba(74,222,128,0.7);
    color: #4ade80;
  }
  .rm-footer-btn--primary:disabled {
    border-color: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.2);
    cursor: not-allowed;
  }
  .rm-footer-btn--secondary {
    border-color: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.35);
  }
  .rm-footer-btn--secondary:hover {
    border-color: rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.75);
  }

  /* ── Loading / Error ── */
  .rm-center {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: #000;
    z-index: 50;
  }
  .rm-center p {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    animation: rmPulse 1.6s ease-in-out infinite;
  }

  @keyframes rmPulse { 0%,100%{opacity:0.25} 50%{opacity:0.75} }
  @keyframes rmFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

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
      <style>{CSS}</style>
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
      <RoadmapPageContent />
    </Suspense>
  );
}
