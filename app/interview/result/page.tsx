"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import "./result.css";

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
      <div className="ir-center">
        <div className="ir-spinner" />
        <p>Analysing your responses…</p>
        <p className="ir-center-sub">This may take up to a minute depending on answer length.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ir-center">
        <p style={{ color: "rgba(250,80,80,0.65)" }}>{error}</p>
        <Link href="/" className="ir-footer-btn">Return to Dashboard</Link>
      </div>
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
      <div className="ir-center">
        <div className="ir-spinner" />
        <p>Loading results…</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
