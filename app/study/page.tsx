"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import "./study.css";

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
