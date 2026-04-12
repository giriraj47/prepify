"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useProfileStore } from "@/lib/store";
import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  .db-root {
    min-height: 100vh;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    position: relative;
  }

  .db-glow {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 65% 50% at 60% 38%, rgba(10,62,55,0.45) 0%, rgba(5,28,26,0.22) 40%, transparent 65%),
      radial-gradient(ellipse 25% 20% at 10% 75%, rgba(4,22,35,0.25) 0%, transparent 50%);
  }

  /* ── NAV ── */
  .db-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.2rem 5vw;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(14px);
  }

  .db-nav-left { display: flex; align-items: center; gap: 3rem; }

  .db-logo {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #fff;
    text-decoration: none;
  }

  .db-nav-links { display: flex; align-items: center; gap: 2rem; list-style: none; }
  .db-nav-links a {
    font-size: 0.55rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    text-decoration: none;
    transition: color 0.15s;
  }
  .db-nav-links a:hover, .db-nav-links a.active { color: rgba(255,255,255,0.8); }

  .db-nav-right { display: flex; align-items: center; gap: 1.4rem; position: relative; }

  .db-user-name {
    font-size: 0.55rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }

  .db-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    border: 0.5px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.55rem; letter-spacing: 0.06em;
    color: rgba(255,255,255,0.7);
    background: none; cursor: pointer;
    transition: border-color 0.15s;
    font-family: 'DM Mono', monospace;
  }
  .db-avatar:hover { border-color: rgba(255,255,255,0.5); }

  .db-dropdown {
    position: absolute; top: calc(100% + 0.8rem); right: 0;
    width: 200px;
    background: #0a0a0a;
    border: 0.5px solid rgba(255,255,255,0.1);
    padding: 0.5rem 0;
    z-index: 200;
    animation: dbFadeDown 0.15s ease both;
  }

  .db-dropdown-header {
    padding: 0.8rem 1.2rem 0.7rem;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    margin-bottom: 0.4rem;
  }
  .db-dropdown-role {
    font-size: 0.52rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); display: block; margin-bottom: 0.2rem;
  }
  .db-dropdown-name {
    font-size: 0.65rem; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.6);
  }

  .db-dropdown a, .db-dropdown button {
    display: block; width: 100%;
    text-align: left; background: none; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); text-decoration: none;
    padding: 0.55rem 1.2rem;
    transition: color 0.15s, background 0.15s;
  }
  .db-dropdown a:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.03); }
  .db-dropdown button:hover { color: rgba(250,80,80,0.8); background: rgba(255,80,80,0.04); }

  /* ── MAIN ── */
  .db-main {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 5vh 5vw 8rem;
  }

  /* Welcome */
  .db-welcome {
    padding: 5vh 0 6vh;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
    margin-bottom: 6vh;
    animation: dbFadeUp 0.4s ease both;
  }
  .db-welcome-eyebrow {
    font-size: 0.52rem; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); margin-bottom: 1rem;
  }
  .db-welcome-title {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(2rem, 4.5vw, 3.8rem);
    line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase;
    color: #fff; margin-bottom: 0.8rem;
  }
  .db-welcome-sub {
    font-size: 0.62rem; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25); max-width: 48ch; line-height: 1.85;
    margin-bottom: 2rem;
  }
  .db-welcome-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

  .db-btn-primary {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(74,222,128,0.9); border: 0.5px solid rgba(74,222,128,0.3);
    background: none; padding: 0.65rem 1.4rem; text-decoration: none;
    transition: all 0.15s; display: inline-block;
  }
  .db-btn-primary:hover { color: #4ade80; border-color: rgba(74,222,128,0.65); }

  .db-btn-ghost {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.28); border: 0.5px solid rgba(255,255,255,0.1);
    background: none; padding: 0.65rem 1.4rem; text-decoration: none;
    transition: all 0.15s; display: inline-block;
  }
  .db-btn-ghost:hover { color: rgba(255,255,255,0.65); border-color: rgba(255,255,255,0.3); }

  /* Grid */
  .db-grid-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    background: rgba(255,255,255,0.06);
    margin-bottom: 1px;
  }
  .db-grid-3 {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px;
    background: rgba(255,255,255,0.06);
  }
  @media (max-width: 768px) {
    .db-grid-2, .db-grid-3 { grid-template-columns: 1fr; }
    .db-nav-links { display: none; }
  }

  /* Panel */
  .db-panel {
    background: #000;
    padding: 2.5rem 2rem;
    animation: dbFadeUp 0.4s ease both;
  }
  .db-panel-eyebrow {
    font-size: 0.5rem; letter-spacing: 0.26em; text-transform: uppercase;
    color: rgba(255,255,255,0.18); margin-bottom: 1.5rem; display: block;
  }
  .db-panel-title {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(1rem, 2vw, 1.5rem); text-transform: uppercase;
    color: rgba(255,255,255,0.75); margin-bottom: 0.5rem;
  }

  /* Score ring panel */
  .db-score-row {
    display: flex; align-items: center; gap: 2rem; margin-bottom: 1.8rem;
  }
  .db-score-ring { position: relative; flex-shrink: 0; }
  .db-score-ring-label {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 0.95rem; color: rgba(255,255,255,0.75);
  }
  .db-score-meta { display: flex; flex-direction: column; gap: 0.3rem; }
  .db-score-big {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 2rem; color: rgba(255,255,255,0.8); line-height: 1;
  }
  .db-score-sub {
    font-size: 0.55rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }

  /* Progress bar */
  .db-bar-wrap { height: 1px; background: rgba(255,255,255,0.08); width: 100%; }
  .db-bar-fill { height: 100%; background: rgba(74,222,128,0.5); transition: width 0.5s ease; }

  /* Activity */
  .db-activity-item {
    display: flex; align-items: center; gap: 1.2rem;
    padding: 0.9rem 0;
    border-bottom: 0.5px solid rgba(255,255,255,0.05);
    cursor: pointer; transition: opacity 0.15s;
  }
  .db-activity-item:first-child { border-top: 0.5px solid rgba(255,255,255,0.05); }
  .db-activity-item:hover { opacity: 0.7; }

  .db-activity-key {
    font-size: 0.5rem; letter-spacing: 0.18em;
    color: rgba(255,255,255,0.2); width: 1rem; flex-shrink: 0;
  }
  .db-activity-info { flex: 1; min-width: 0; }
  .db-activity-title {
    font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block;
  }
  .db-activity-meta {
    font-size: 0.52rem; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.2); margin-top: 0.15rem; display: block;
  }
  .db-activity-arrow { font-size: 0.6rem; color: rgba(255,255,255,0.15); }

  /* Challenge panel */
  .db-challenge {
    background: rgba(5,18,15,0.8);
    border: 0.5px solid rgba(74,222,128,0.12);
  }
  .db-challenge-tag {
    font-size: 0.5rem; letter-spacing: 0.26em; text-transform: uppercase;
    color: rgba(74,222,128,0.5); margin-bottom: 1.2rem; display: block;
  }
  .db-challenge-title {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(1rem, 2vw, 1.4rem); text-transform: uppercase;
    color: rgba(255,255,255,0.75); line-height: 1.1; margin-bottom: 1rem;
  }
  .db-challenge-participants {
    font-size: 0.55rem; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.2); margin-bottom: 2rem;
  }
  .db-challenge-participants strong { color: rgba(74,222,128,0.6); }

  /* Topics */
  .db-topic-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .db-topic-tag {
    font-size: 0.5rem; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 0.35rem 0.8rem;
    border: 0.5px solid;
  }
  .db-topic-tag--strong { border-color: rgba(74,222,128,0.25); color: rgba(74,222,128,0.6); }
  .db-topic-tag--weak   { border-color: rgba(250,176,5,0.25); color: rgba(250,176,5,0.5); }
  .db-topic-tag--empty  { border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.2); }

  /* Milestone */
  .db-milestone {
    padding: 1.2rem 0 0;
    border-top: 0.5px solid rgba(255,255,255,0.06);
    margin-top: 1.5rem;
  }
  .db-milestone-label {
    font-size: 0.5rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.18); margin-bottom: 0.5rem; display: block;
  }
  .db-milestone-text {
    font-size: 0.6rem; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.35); margin-bottom: 0.8rem; display: block;
  }

  @keyframes dbFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dbFadeDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

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
      <style>{CSS}</style>
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
                { label: "Assessment", href: "/study" },
                { label: "Resources", href: "#" },
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
