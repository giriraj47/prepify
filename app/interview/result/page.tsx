"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  .ir-root {
    min-height: 100vh;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    position: relative;
  }

  .ir-glow {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 68% 55% at 58% 44%, rgba(10,62,55,0.48) 0%, rgba(5,28,26,0.24) 40%, transparent 66%),
      radial-gradient(ellipse 24% 20% at 12% 76%, rgba(4,22,35,0.26) 0%, transparent 55%);
  }

  /* ── Nav ── */
  .ir-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.3rem 5vw;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    background: rgba(0,0,0,0.8); backdrop-filter: blur(14px);
  }
  .ir-nav-logo {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 1rem; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; text-decoration: none;
  }
  .ir-nav-right {
    font-size: 0.52rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }

  /* ── Main ── */
  .ir-main {
    position: relative; z-index: 1;
    max-width: 1000px; margin: 0 auto;
    padding: 6vh 5vw 8rem;
  }

  /* ── Header ── */
  .ir-header {
    padding-bottom: 5vh;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
    margin-bottom: 5vh;
    animation: irFadeUp 0.4s ease both;
  }
  .ir-header-eyebrow {
    font-size: 0.52rem; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); margin-bottom: 1rem;
  }
  .ir-header-title {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase; color: #fff;
    margin-bottom: 0.8rem;
  }
  .ir-header-sub {
    font-size: 0.6rem; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.22); line-height: 1.8;
  }

  /* ── Score row ── */
  .ir-score-row {
    display: grid; grid-template-columns: auto 1fr; gap: 1px;
    background: rgba(255,255,255,0.06);
    margin-bottom: 1px;
    animation: irFadeUp 0.4s 0.05s ease both;
  }

  .ir-score-block {
    background: #000;
    padding: 3rem 2.5rem;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
    min-width: 220px;
  }

  .ir-score-ring { position: relative; flex-shrink: 0; }
  .ir-score-ring-label {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.1rem;
  }
  .ir-score-big {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 2rem; color: #fff; line-height: 1;
  }
  .ir-score-denom {
    font-size: 0.5rem; letter-spacing: 0.15em;
    color: rgba(255,255,255,0.25);
  }
  .ir-grade {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;
    color: rgba(74,222,128,0.85);
  }

  .ir-summary-block {
    background: #000;
    padding: 3rem 2.5rem;
  }
  .ir-summary-label {
    font-size: 0.5rem; letter-spacing: 0.26em; text-transform: uppercase;
    color: rgba(255,255,255,0.18); margin-bottom: 1rem; display: block;
  }
  .ir-summary-text {
    font-size: 0.65rem; letter-spacing: 0.07em;
    color: rgba(255,255,255,0.4); line-height: 1.9; max-width: 60ch;
  }

  /* ── Areas grid ── */
  .ir-areas-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    background: rgba(255,255,255,0.06);
    margin-bottom: 1px;
    animation: irFadeUp 0.4s 0.1s ease both;
  }

  .ir-area-block { background: #000; padding: 2.5rem; }
  .ir-area-label {
    font-size: 0.5rem; letter-spacing: 0.26em; text-transform: uppercase;
    margin-bottom: 1.4rem; display: block;
  }
  .ir-area-label--strong { color: rgba(74,222,128,0.5); }
  .ir-area-label--weak   { color: rgba(250,176,5,0.5); }

  .ir-area-list { display: flex; flex-direction: column; gap: 0; }
  .ir-area-item {
    display: flex; align-items: baseline; gap: 1rem;
    padding: 0.6rem 0;
    border-bottom: 0.5px solid rgba(255,255,255,0.05);
    font-size: 0.62rem; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.35); line-height: 1.6;
  }
  .ir-area-item:first-child { border-top: 0.5px solid rgba(255,255,255,0.05); }
  .ir-area-num {
    font-size: 0.48rem; letter-spacing: 0.2em; color: rgba(255,255,255,0.18); flex-shrink: 0;
  }

  /* ── Recommendations ── */
  .ir-recs {
    background: rgba(255,255,255,0.06);
    margin-bottom: 1px;
    animation: irFadeUp 0.4s 0.14s ease both;
  }
  .ir-recs-inner { background: #000; padding: 2.5rem; }
  .ir-recs-label {
    font-size: 0.5rem; letter-spacing: 0.26em; text-transform: uppercase;
    color: rgba(255,255,255,0.18); margin-bottom: 1.8rem; display: block;
  }
  .ir-rec-item {
    display: grid; grid-template-columns: 3rem 1fr; gap: 0 1.5rem;
    padding: 1rem 0;
    border-bottom: 0.5px solid rgba(255,255,255,0.05);
  }
  .ir-rec-item:first-child { border-top: 0.5px solid rgba(255,255,255,0.05); }
  .ir-rec-num {
    font-size: 0.52rem; letter-spacing: 0.18em;
    color: rgba(255,255,255,0.18); padding-top: 0.1rem;
  }
  .ir-rec-text {
    font-size: 0.62rem; letter-spacing: 0.07em;
    color: rgba(255,255,255,0.35); line-height: 1.85;
  }

  /* ── Question breakdown ── */
  .ir-breakdown {
    animation: irFadeUp 0.4s 0.18s ease both;
  }
  .ir-breakdown-title {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(1.2rem, 2.5vw, 1.8rem); text-transform: uppercase; letter-spacing: -0.005em;
    color: rgba(255,255,255,0.7); margin-bottom: 2rem;
    padding-top: 3vh;
  }

  .ir-resp-item {
    border: 0.5px solid rgba(255,255,255,0.07);
    margin-bottom: 1px;
  }

  .ir-resp-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.4rem 2rem;
    border-bottom: 0.5px solid rgba(255,255,255,0.05);
    cursor: pointer; transition: background 0.15s;
  }
  .ir-resp-head:hover { background: rgba(255,255,255,0.02); }

  .ir-resp-title {
    font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(255,255,255,0.4);
  }
  .ir-resp-score-badge {
    font-size: 0.52rem; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 0.3rem 0.8rem;
    border: 0.5px solid;
  }

  .ir-resp-body { padding: 1.8rem 2rem; background: #000; }

  .ir-resp-feedback {
    font-size: 0.62rem; letter-spacing: 0.07em;
    color: rgba(255,255,255,0.3); line-height: 1.9;
    margin-bottom: 1.8rem; padding-bottom: 1.4rem;
    border-bottom: 0.5px solid rgba(255,255,255,0.05);
  }

  .ir-resp-cols {
    display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
  }
  .ir-resp-col-label {
    font-size: 0.48rem; letter-spacing: 0.25em; text-transform: uppercase;
    margin-bottom: 0.8rem; display: block;
  }
  .ir-resp-col-label--strong { color: rgba(74,222,128,0.4); }
  .ir-resp-col-label--weak   { color: rgba(250,176,5,0.4); }

  .ir-resp-point {
    font-size: 0.58rem; letter-spacing: 0.06em;
    color: rgba(255,255,255,0.28); line-height: 1.75;
    padding: 0.45rem 0;
    border-bottom: 0.5px solid rgba(255,255,255,0.04);
    display: flex; gap: 0.8rem;
  }
  .ir-resp-point-key {
    font-size: 0.46rem; letter-spacing: 0.15em;
    color: rgba(255,255,255,0.15); flex-shrink: 0;
  }

  /* ── Footer ── */
  .ir-footer {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
    padding-top: 3rem;
    border-top: 0.5px solid rgba(255,255,255,0.06);
    animation: irFadeUp 0.4s 0.22s ease both;
  }
  .ir-footer-btn {
    background: rgba(255,255,255,0.92); border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: #000; padding: 0.75rem 2.2rem; text-decoration: none;
    transition: background 0.15s; display: inline-block;
  }
  .ir-footer-btn:hover { background: #fff; }
  .ir-footer-redirect {
    font-size: 0.5rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(255,255,255,0.15);
  }

  /* ── Loading / Error ── */
  .ir-center {
    position: fixed; inset: 0; background: #000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.4rem; z-index: 50;
  }
  .ir-center p {
    font-family: 'DM Mono', monospace; font-size: 0.62rem;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }
  .ir-center-sub {
    font-size: 0.54rem !important;
    max-width: 36ch; text-align: center; line-height: 1.8;
  }
  .ir-spinner {
    width: 32px; height: 32px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.07);
    border-top-color: rgba(255,255,255,0.35);
    animation: irSpin 1s linear infinite;
  }

  @media (max-width: 640px) {
    .ir-score-row { grid-template-columns: 1fr; }
    .ir-areas-grid { grid-template-columns: 1fr; }
    .ir-resp-cols { grid-template-columns: 1fr; }
  }

  @keyframes irFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes irSpin { to { transform: rotate(360deg); } }
`;

function scoreColor(score: number) {
  if (score >= 75) return { border: "rgba(74,222,128,0.35)", color: "rgba(74,222,128,0.75)" };
  if (score >= 50) return { border: "rgba(250,176,5,0.3)", color: "rgba(250,176,5,0.65)" };
  return { border: "rgba(250,80,80,0.3)", color: "rgba(250,80,80,0.65)" };
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("sessionId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!evaluation) return;
    const t = window.setTimeout(() => router.push("/"), 12000);
    return () => window.clearTimeout(t);
  }, [evaluation, router]);

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    async function evaluate() {
      try {
        const res = await fetch("/api/interview/evaluate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to evaluate interview.");
        if (data.evaluated && !data.evaluation) {
          setError("Interview already evaluated. Check your profile for past results.");
        } else {
          setEvaluation(data.evaluation);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    evaluate();
  }, [sessionId, router]);

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ir-center">
          <div className="ir-spinner" />
          <p>Analysing your responses…</p>
          <p className="ir-center-sub">This may take up to a minute depending on answer length.</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ir-center">
          <p style={{ color: "rgba(250,80,80,0.65)" }}>{error}</p>
          <Link href="/" className="ir-footer-btn">Return to Dashboard</Link>
        </div>
      </>
    );
  }

  if (!evaluation) return null;

  const { overall, responses } = evaluation;
  const score = overall?.score ?? 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - score / 100);
  const sc = scoreColor(score);

  return (
    <>
      <style>{CSS}</style>
      <div className="ir-root">
        <div className="ir-glow" />

        {/* Nav */}
        <nav className="ir-nav">
          <a href="/" className="ir-nav-logo">Prepify</a>
          <span className="ir-nav-right">Interview Results</span>
        </nav>

        <div className="ir-main">
          {/* Header */}
          <div className="ir-header">
            <p className="ir-header-eyebrow">Session Complete</p>
            <h1 className="ir-header-title">Your Results</h1>
            <p className="ir-header-sub">We've reviewed all your answers. Here's how you performed.</p>
          </div>

          {/* Score + summary */}
          <div className="ir-score-row">
            <div className="ir-score-block">
              <div className="ir-score-ring">
                <svg width="100" height="100" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                  <circle
                    cx="42" cy="42" r="36" fill="none"
                    stroke={sc.color} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 42 42)"
                    style={{ transition: "stroke-dashoffset 0.7s ease" }}
                  />
                </svg>
                <div className="ir-score-ring-label">
                  <span className="ir-score-big">{score}</span>
                  <span className="ir-score-denom">/ 100</span>
                </div>
              </div>
              <span className="ir-grade">Grade: {overall?.grade ?? "N/A"}</span>
            </div>

            <div className="ir-summary-block">
              <span className="ir-summary-label">Summary</span>
              <p className="ir-summary-text">{overall?.summary}</p>
            </div>
          </div>

          {/* Strong / Weak areas */}
          <div className="ir-areas-grid">
            <div className="ir-area-block">
              <span className="ir-area-label ir-area-label--strong">Strong Areas</span>
              <div className="ir-area-list">
                {overall?.strong_areas?.map((area: string, i: number) => (
                  <div key={i} className="ir-area-item">
                    <span className="ir-area-num">{String(i + 1).padStart(2, "0")}</span>
                    {area}
                  </div>
                ))}
              </div>
            </div>
            <div className="ir-area-block">
              <span className="ir-area-label ir-area-label--weak">Areas to Improve</span>
              <div className="ir-area-list">
                {overall?.weak_areas?.map((area: string, i: number) => (
                  <div key={i} className="ir-area-item">
                    <span className="ir-area-num">{String(i + 1).padStart(2, "0")}</span>
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {overall?.recommendations?.length > 0 && (
            <div className="ir-recs">
              <div className="ir-recs-inner">
                <span className="ir-recs-label">Recommendations</span>
                {overall.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="ir-rec-item">
                    <span className="ir-rec-num">{String(i + 1).padStart(2, "0")}</span>
                    <p className="ir-rec-text">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question breakdown */}
          {responses?.length > 0 && (
            <div className="ir-breakdown">
              <h2 className="ir-breakdown-title">Question Breakdown</h2>
              {responses.map((resp: any, idx: number) => {
                const open = expanded[idx] ?? false;
                const rs = scoreColor(resp.score ?? 0);
                return (
                  <div key={idx} className="ir-resp-item">
                    <div className="ir-resp-head" onClick={() => setExpanded((e) => ({ ...e, [idx]: !open }))}>
                      <span className="ir-resp-title">
                        Question {String(resp.question_index + 1).padStart(2, "0")}
                        &nbsp;&nbsp;{open ? "↑" : "↓"}
                      </span>
                      <span className="ir-resp-score-badge" style={{ borderColor: rs.border, color: rs.color }}>
                        {resp.score ?? 0} / 100
                      </span>
                    </div>
                    {open && (
                      <div className="ir-resp-body">
                        <p className="ir-resp-feedback">{resp.feedback}</p>
                        <div className="ir-resp-cols">
                          <div>
                            <span className="ir-resp-col-label ir-resp-col-label--strong">Strong Points</span>
                            {resp.strong_points?.map((pt: string, i: number) => (
                              <div key={i} className="ir-resp-point">
                                <span className="ir-resp-point-key">{String(i + 1).padStart(2, "0")}</span>
                                {pt}
                              </div>
                            ))}
                          </div>
                          <div>
                            <span className="ir-resp-col-label ir-resp-col-label--weak">Weak Points</span>
                            {resp.weak_points?.map((pt: string, i: number) => (
                              <div key={i} className="ir-resp-point">
                                <span className="ir-resp-point-key">{String(i + 1).padStart(2, "0")}</span>
                                {pt}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="ir-footer">
            <Link href="/" className="ir-footer-btn">Return to Dashboard →</Link>
            <span className="ir-footer-redirect">Redirecting in 12 seconds…</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function InterviewResultPage() {
  return (
    <Suspense fallback={
      <>
        <style>{CSS}</style>
        <div className="ir-center">
          <div className="ir-spinner" />
          <p>Loading results…</p>
        </div>
      </>
    }>
      <ResultContent />
    </Suspense>
  );
}
