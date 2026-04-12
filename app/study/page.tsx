"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Question = {
  question_text: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
};

const QUESTION_COUNT = 10;

export default function StudyPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    roleName: string;
    experienceLevel: string;
    experienceYears: number;
  } | null>(null);
  const [selected, setSelected] = useState<
    Record<string, "A" | "B" | "C" | "D">
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [topicSummary, setTopicSummary] = useState<
    Array<{ topic: string; correct: number; total: number }>
  >([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const weakTopics = topicSummary
    .filter((t) => t.correct / t.total < 0.6)
    .map((t) => t.topic);
  const strongTopics = topicSummary
    .filter((t) => t.correct / t.total >= 0.6)
    .map((t) => t.topic);

  useEffect(() => {
    setMounted(true);
    const loadQuestions = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push("/login");
          return;
        }
        const { data: profileData } = await supabase
          .from("users")
          .select("experience_level, experience_years, roles(name)")
          .eq("id", userData.user.id)
          .maybeSingle();

        const roleValue = Array.isArray(profileData?.roles)
          ? profileData?.roles[0]
          : profileData?.roles;

        const resolvedProfile = {
          roleName: roleValue?.name ?? "Frontend Developer",
          experienceLevel: profileData?.experience_level ?? "mid",
          experienceYears: profileData?.experience_years ?? 3,
        };
        setProfile(resolvedProfile);

        const params = new URLSearchParams({
          roleName: resolvedProfile.roleName,
          experienceLevel: resolvedProfile.experienceLevel,
          experienceYears: String(resolvedProfile.experienceYears),
        });
        const res = await fetch(
          `/api/assessment-questions?${params.toString()}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as { questions?: Question[] };
        if (!data.questions || data.questions.length === 0)
          throw new Error("No questions returned.");
        setQuestions(data.questions);
        setSelected({});
        setSubmitted(false);
        setScore(null);
        setTopicSummary([]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questions",
        );
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  function handleSelect(index: number, key: "A" | "B" | "C" | "D") {
    if (submitted) return;
    setSelected((prev) => ({ ...prev, [index]: key }));
  }

  function handleSubmit() {
    const byTopic = new Map<string, { correct: number; total: number }>();
    const correct = questions.filter((q, i) => {
      const isCorrect = selected[i] === q.correct_answer;
      const topicKey = q.topic || "general";
      const current = byTopic.get(topicKey) ?? { correct: 0, total: 0 };
      byTopic.set(topicKey, {
        correct: current.correct + (isCorrect ? 1 : 0),
        total: current.total + 1,
      });
      return isCorrect;
    }).length;
    const total = questions.length;
    setScore(Math.round((correct / total) * 100));
    setCorrectCount(correct);
    setTotalCount(total);
    setTopicSummary(
      Array.from(byTopic.entries()).map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
      })),
    );
    setSubmitted(true);
  }

  async function handleGenerateRoadmap() {
    setRoadmapLoading(true);
    setRoadmapError(null);
    try {
      const effectiveProfile = profile ?? {
        roleName: "Frontend Developer",
        experienceLevel: "mid",
        experienceYears: 3,
      };
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: effectiveProfile.roleName,
          experienceLevel: effectiveProfile.experienceLevel,
          experienceYears: effectiveProfile.experienceYears,
          score: score ?? 0,
          correctAnswers: correctCount ?? 0,
          totalQuestions: totalCount ?? questions.length,
          weakTopics,
          strongTopics,
        }),
      });
      const data = (await res.json()) as {
        roadmapId?: string;
        error?: string;
      };
      if (!res.ok || !data.roadmapId)
        throw new Error(data.error ?? "Failed to generate roadmap.");
      router.push(`/roadmap?rid=${data.roadmapId}`);
    } catch (err) {
      setRoadmapError(
        err instanceof Error ? err.message : "Failed to generate roadmap.",
      );
    } finally {
      setRoadmapLoading(false);
    }
  }

  const allAnswered = Object.keys(selected).length === questions.length;
  const currentQuestion = questions[currentIndex];
  const progressRadius = 28;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressFraction = questions.length
    ? (currentIndex + 1) / questions.length
    : 0;
  const progressOffset =
    progressCircumference * (1 - Math.min(Math.max(progressFraction, 0), 1));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

        .cult-root {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          font-family: 'DM Mono', monospace;
          overflow: hidden;
        }

        /* Atmospheric glow */
        .cult-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 60% at 62% 55%,
            rgba(10, 60, 55, 0.55) 0%,
            rgba(5, 30, 28, 0.3) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        .cult-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 6vh 7vw;
        }

        /* ── Question ── */
        .cult-question {
          font-family: 'Barlow', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 4.2vw, 3.8rem);
          line-height: 1.08;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          color: #fff;
          max-width: 52%;
          margin-top: 0;
          margin-bottom: auto;
          animation: fadeUp 0.4s ease both;
        }

        /* ── Options ── */
        .cult-options {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 4vh;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        .cult-option {
          display: flex;
          align-items: baseline;
          gap: 2.2rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.55rem 0;
          text-align: left;
          transition: opacity 0.15s;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .cult-option:first-child { border-top: 0.5px solid rgba(255,255,255,0.06); }
        .cult-option:disabled { cursor: default; }

        .cult-option-key {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          width: 1rem;
          flex-shrink: 0;
          transition: color 0.15s;
        }

        .cult-option-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          transition: color 0.15s, transform 0.15s;
        }

        /* States */
        .cult-option--selected .cult-option-key { color: rgba(255,255,255,0.9); }
        .cult-option--selected .cult-option-text {
          color: rgba(255,255,255,0.95);
          transform: translateX(0.6rem);
        }

        .cult-option--correct .cult-option-key,
        .cult-option--correct .cult-option-text { color: #4ade80; }

        .cult-option--wrong .cult-option-key,
        .cult-option--wrong .cult-option-text { color: rgba(255, 100, 80, 0.7); }

        .cult-option--dimmed .cult-option-text { color: rgba(255,255,255,0.2); }

        .cult-option:not(:disabled):not(.cult-option--selected):hover .cult-option-text {
          color: rgba(255,255,255,0.75);
          transform: translateX(0.3rem);
        }

        /* ── Bottom bar ── */
        .cult-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: fadeUp 0.4s 0.15s ease both;
        }

        .cult-nav {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .cult-nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          padding: 0;
          transition: color 0.15s;
        }
        .cult-nav-btn:not(:disabled):hover { color: rgba(255,255,255,0.9); }
        .cult-nav-btn:disabled { opacity: 0.2; cursor: default; }

        .cult-submit-btn {
          background: none;
          border: 0.5px solid rgba(255,255,255,0.2);
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          padding: 0.5rem 1.2rem;
          transition: all 0.15s;
        }
        .cult-submit-btn:not(:disabled):hover {
          color: #fff;
          border-color: rgba(255,255,255,0.6);
        }
        .cult-submit-btn:disabled { opacity: 0.25; cursor: default; }
        .cult-submit-btn--active {
          border-color: rgba(74, 222, 128, 0.4);
          color: rgba(74, 222, 128, 0.9);
        }
        .cult-submit-btn--active:hover {
          border-color: rgba(74, 222, 128, 0.8) !important;
          color: #4ade80 !important;
        }

        /* ── Circular progress ── */
        .cult-progress {
          position: fixed;
          bottom: 2.5rem;
          right: 3rem;
          z-index: 10;
        }
        .cult-progress svg { display: block; }
        .cult-progress-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.05em;
        }

        /* ── Loading / Error ── */
        .cult-loading {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }
        .cult-loading p {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

        /* ── Post-submit overlay (score + roadmap) ── */
        .cult-result-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 30;
          padding: 1.4rem 7vw;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          animation: slideDown 0.3s ease both;
        }

        .cult-result-score {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .cult-result-score span:first-child {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }
        .cult-result-score span:last-child {
          font-family: 'Barlow', sans-serif;
          font-weight: 800;
          font-size: 2rem;
          color: #4ade80;
          line-height: 1;
        }

        .cult-result-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cult-roadmap-btn {
          background: none;
          border: 0.5px solid rgba(74, 222, 128, 0.4);
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(74, 222, 128, 0.9);
          padding: 0.55rem 1.4rem;
          transition: all 0.15s;
        }
        .cult-roadmap-btn:not(:disabled):hover {
          border-color: rgba(74, 222, 128, 0.8);
          color: #4ade80;
        }
        .cult-roadmap-btn:disabled { opacity: 0.4; cursor: default; }

        .cult-back-btn {
          background: none;
          border: 0.5px solid rgba(255,255,255,0.15);
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          padding: 0.55rem 1.2rem;
          transition: all 0.15s;
        }
        .cult-back-btn:hover { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.4); }

        .cult-explanation {
          margin-top: 1.8rem;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.25);
          max-width: 48%;
          line-height: 1.7;
          text-transform: uppercase;
          animation: fadeUp 0.3s ease both;
        }
        .cult-explanation strong { color: rgba(74, 222, 128, 0.7); font-weight: 500; }

        /* Topic breakdown (post-submit, scrollable on smaller screens) */
        .cult-topics {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          margin-bottom: 3vh;
          animation: fadeUp 0.35s ease both;
        }
        .cult-topic-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .cult-topic-name {
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
        }
        .cult-topic-stat {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
        }
        .cult-topic-stat--strong { color: rgba(74, 222, 128, 0.7); }
        .cult-topic-stat--weak { color: rgba(250, 176, 5, 0.7); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="cult-root">
        {/* Atmospheric bg via ::before pseudo */}

        {/* Loading */}
        {loading && (
          <div className="cult-loading">
            <p>Generating questions…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="cult-loading">
            <p style={{ color: "rgba(250,80,80,0.7)" }}>{error}</p>
          </div>
        )}

        {/* Post-submit result bar */}
        {submitted && score !== null && (
          <div className="cult-result-bar">
            <div className="cult-result-score">
              <span>Score</span>
              <span>{score}%</span>
            </div>
            <div
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {correctCount} of {totalCount} correct
            </div>
            {topicSummary.length > 0 && (
              <div className="cult-topics" style={{ marginBottom: 0 }}>
                {topicSummary.map((t) => {
                  const strong = t.correct / t.total >= 0.6;
                  return (
                    <div className="cult-topic-item" key={t.topic}>
                      <span className="cult-topic-name">
                        {t.topic.replace(/-/g, " ")}
                      </span>
                      <span
                        className={`cult-topic-stat ${strong ? "cult-topic-stat--strong" : "cult-topic-stat--weak"}`}
                      >
                        {t.correct}/{t.total} {strong ? "↑" : "↓"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="cult-result-actions">
              <button
                className="cult-roadmap-btn"
                onClick={handleGenerateRoadmap}
                disabled={roadmapLoading}
              >
                {roadmapLoading ? "Generating…" : "Generate Roadmap →"}
              </button>
              <button
                className="cult-back-btn"
                onClick={() => router.push("/")}
              >
                Dashboard
              </button>
            </div>
            {roadmapError && (
              <span
                style={{
                  fontSize: "0.58rem",
                  color: "rgba(250,80,80,0.7)",
                  letterSpacing: "0.1em",
                }}
              >
                {roadmapError}
              </span>
            )}
          </div>
        )}

        {/* Main quiz UI */}
        {!loading && !error && currentQuestion && (
          <div
            className="cult-inner"
            style={{ paddingTop: submitted ? "8rem" : "6vh" }}
          >
            {/* Question text */}
            <h1 className="cult-question" key={currentIndex}>
              {currentQuestion.question_text}
            </h1>

            {/* Explanation (post-submit) */}
            {submitted && (
              <p className="cult-explanation">
                <strong>{currentQuestion.correct_answer}.</strong>{" "}
                {currentQuestion.explanation}
              </p>
            )}

            {/* Options */}
            <div className="cult-options">
              {currentQuestion.options.map((option) => {
                const isSelected = selected[currentIndex] === option.key;
                const isCorrect = option.key === currentQuestion.correct_answer;
                const isWrong = submitted && isSelected && !isCorrect;
                const isDimmed = submitted && !isCorrect && !isSelected;

                return (
                  <button
                    key={`${currentIndex}-${option.key}`}
                    className={[
                      "cult-option",
                      submitted
                        ? isCorrect
                          ? "cult-option--correct"
                          : isWrong
                            ? "cult-option--wrong"
                            : "cult-option--dimmed"
                        : isSelected
                          ? "cult-option--selected"
                          : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleSelect(currentIndex, option.key)}
                    disabled={submitted}
                  >
                    <span className="cult-option-key">{option.key}</span>
                    <span className="cult-option-text">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom bar: nav + submit */}
            <div className="cult-bottom">
              <div className="cult-nav">
                <button
                  className="cult-nav-btn"
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  disabled={currentIndex === 0}
                >
                  ← Prev
                </button>
                <button
                  className="cult-nav-btn"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(i + 1, questions.length - 1),
                    )
                  }
                  disabled={currentIndex === questions.length - 1}
                >
                  Next →
                </button>
              </div>

              {!submitted && (
                <button
                  className={`cult-submit-btn ${allAnswered ? "cult-submit-btn--active" : ""}`}
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                >
                  Complete assessment
                </button>
              )}
            </div>
          </div>
        )}

        {/* Circular progress — fixed bottom-right */}
        {!loading && !error && questions.length > 0 && (
          <div className="cult-progress">
            <svg width="64" height="64" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r={progressRadius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3"
              />
              <circle
                cx="36"
                cy="36"
                r={progressRadius}
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressOffset}
                transform="rotate(-90 36 36)"
                style={{ transition: "stroke-dashoffset 0.35s ease" }}
              />
            </svg>
            <div className="cult-progress-label">
              {currentIndex + 1}/{questions.length}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
