"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useProfileStore } from "@/lib/store";
import { useState } from "react";

import "./dashboard.css";

const recentActivity = [
  {
    key: "01",
    title: "Consistent Hashing Algorithm",
    meta: "Completed in 24 mins · Score: 92/100",
  },
  {
    key: "02",
    title: "Behavioral: Conflict Resolution",
    meta: "AI Feedback Reviewed · 2 days ago",
  },
  {
    key: "03",
    title: "Dynamic Programming Basics",
    meta: "Roadmap Module Started · 3 days ago",
  },
];

interface DashboardProps {
  summary: {
    score: number;
    correct: number;
    total: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null;
  latestRoadmapId: string | null;
}

export function Dashboard({ summary, latestRoadmapId }: DashboardProps) {
  const { user, signOut } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "There";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase())
        .join("")
    : "U";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const primaryCtaHref = latestRoadmapId
    ? `/roadmap?rid=${encodeURIComponent(latestRoadmapId)}`
    : "/study";
  const primaryCtaLabel = latestRoadmapId
    ? "Go to Roadmap →"
    : "Generate Roadmap →";

  const score = summary?.score ?? 0;
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - score / 100);

  return (
    <>
      <div className="db-root">
        <div className="db-glow" />

        {/* Nav */}
        <nav className="db-nav">
          <div className="db-nav-left">
            <Link href="/" className="db-logo">
              Prepify
            </Link>
            <ul className="db-nav-links">
              {[
                { label: "Dashboard", href: "/", active: true },
                { label: "My Roadmap", href: "/roadmap" },
                { label: "Interview", href: "/interview" },
                { label: "Resources", href: "/#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={item.active ? "active" : ""}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="db-nav-right">
            <span className="db-user-name">
              {profile?.full_name || user?.user_metadata?.full_name || "User"}
            </span>
            <button
              className="db-avatar"
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="Profile menu"
            >
              {initials}
            </button>
            {dropdownOpen && (
              <div
                className="db-dropdown"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="db-dropdown-header">
                  <span className="db-dropdown-role">
                    {profile?.roles?.name || "Candidate"}
                  </span>
                  <span className="db-dropdown-name">
                    {profile?.experience_level || "Any level"}
                  </span>
                </div>
                <Link href="/onboarding" onClick={() => setDropdownOpen(false)}>
                  Edit Profile
                </Link>
                <button onClick={handleSignOut}>Logout</button>
              </div>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className="db-main">
          {/* Welcome */}
          <div className="db-welcome">
            <p className="db-welcome-eyebrow">Candidate Dashboard</p>
            <h1 className="db-welcome-title">Welcome Back, {firstName}.</h1>
            <p className="db-welcome-sub">
              {summary?.weakTopics?.length
                ? `Your focus area right now: ${summary.weakTopics[0]?.replace(/-/g, " ")}. Every session brings you closer.`
                : "Your prep journey is underway. Ready to hit the next milestone?"}
            </p>
            <div className="db-welcome-actions">
              <Link href={primaryCtaHref} className="db-btn-primary">
                {primaryCtaLabel}
              </Link>
              <Link href="/interview" className="db-btn-ghost">
                Mock Interview
              </Link>
            </div>
          </div>

          {/* Top row: score + activity */}
          <div className="db-grid-2" style={{ marginBottom: "1px" }}>
            {/* Score panel */}
            <div className="db-panel" style={{ animationDelay: "0.05s" }}>
              <span className="db-panel-eyebrow">Current Performance</span>
              <div className="db-score-row">
                <div className="db-score-ring">
                  <svg width="72" height="72" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="rgba(74,222,128,0.6)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      transform="rotate(-90 32 32)"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                  </svg>
                  <span className="db-score-ring-label">{score}%</span>
                </div>
                <div className="db-score-meta">
                  <span className="db-score-big">
                    {summary?.correct ?? 0}/{summary?.total ?? 0}
                  </span>
                  <span className="db-score-sub">Correct answers</span>
                </div>
              </div>
              <div className="db-bar-wrap">
                <div className="db-bar-fill" style={{ width: `${score}%` }} />
              </div>
              <div className="db-milestone">
                <span className="db-milestone-label">Next Milestone</span>
                <span className="db-milestone-text">
                  Mock Interview: Scaling — Tomorrow, 10 AM
                </span>
                <div className="db-bar-wrap">
                  <div
                    className="db-bar-fill"
                    style={{
                      width: `${score}%`,
                      background: "rgba(255,255,255,0.2)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="db-panel" style={{ animationDelay: "0.08s" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.5rem",
                }}
              >
                <span className="db-panel-eyebrow" style={{ marginBottom: 0 }}>
                  Recent Activity
                </span>
                <Link
                  href="/study"
                  style={{
                    fontSize: "0.5rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    textDecoration: "none",
                  }}
                >
                  View All →
                </Link>
              </div>
              {recentActivity.map((item) => (
                <div key={item.key} className="db-activity-item">
                  <span className="db-activity-key">{item.key}</span>
                  <div className="db-activity-info">
                    <span className="db-activity-title">{item.title}</span>
                    <span className="db-activity-meta">{item.meta}</span>
                  </div>
                  <span className="db-activity-arrow">→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row: challenge + strong + weak */}
          <div className="db-grid-3">
            {/* Daily challenge */}
            <div
              className="db-panel db-challenge"
              style={{ animationDelay: "0.11s" }}
            >
              <span className="db-challenge-tag">Daily Challenge</span>
              <p className="db-challenge-title">
                Implement a Rate Limiter using Token Bucket
              </p>
              <p className="db-challenge-participants">
                <strong>+1.2k</strong> participants today
              </p>
              <Link
                href="/interview"
                className="db-btn-primary"
                style={{ display: "block", textAlign: "center" }}
              >
                Accept →
              </Link>
            </div>

            {/* Strong topics */}
            <div className="db-panel" style={{ animationDelay: "0.14s" }}>
              <span className="db-panel-eyebrow">Strong Topics</span>
              <div className="db-topic-tags">
                {summary?.strongTopics?.length ? (
                  summary.strongTopics.map((t) => (
                    <span key={t} className="db-topic-tag db-topic-tag--strong">
                      {t.replace(/-/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="db-topic-tag db-topic-tag--empty">
                    Take an assessment first
                  </span>
                )}
              </div>
            </div>

            {/* Weak topics */}
            <div className="db-panel" style={{ animationDelay: "0.17s" }}>
              <span className="db-panel-eyebrow">Areas to Improve</span>
              <div className="db-topic-tags">
                {summary?.weakTopics?.length ? (
                  summary.weakTopics.map((t) => (
                    <span key={t} className="db-topic-tag db-topic-tag--weak">
                      {t.replace(/-/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="db-topic-tag db-topic-tag--empty">
                    No weak areas yet
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
