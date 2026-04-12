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
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { questions?: Question[] };
        if (!data.questions || data.questions.length === 0) {
          throw new Error("No questions returned.");
        }
        console.log("[study] initial questions response", data);
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
    console.log("[study] submit payload", {
      score: Math.round((correct / total) * 100),
      correct,
      total,
      weakTopics: Array.from(byTopic.entries())
        .filter(([, stats]) => stats.correct / stats.total < 0.6)
        .map(([topic]) => topic),
      strongTopics: Array.from(byTopic.entries())
        .filter(([, stats]) => stats.correct / stats.total >= 0.6)
        .map(([topic]) => topic),
      answers: selected,
    });
  }

  const answeredCount = Object.keys(selected).length;
  const allAnswered = answeredCount === questions.length;
  const questionCountText = mounted
    ? `${QUESTION_COUNT} AI-generated questions to assess your baseline.`
    : "AI-generated questions to assess your baseline.";
  const currentQuestion = questions[currentIndex];
  const currentProgress = questions.length
    ? (currentIndex + 1) / questions.length
    : 0;
  const progressRadius = 28;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset =
    progressCircumference * (1 - Math.min(Math.max(currentProgress, 0), 1));

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
        roadmap?: unknown;
        error?: string;
      };
      if (!res.ok || !data.roadmapId) {
        throw new Error(data.error ?? "Failed to generate roadmap.");
      }
      console.log("[study] roadmap response", data);
      router.push(`/roadmap?rid=${data.roadmapId}`);
    } catch (err) {
      setRoadmapError(
        err instanceof Error ? err.message : "Failed to generate roadmap.",
      );
    } finally {
      setRoadmapLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0f1a] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="rounded-3xl border border-gray-800 bg-[#0f1424] p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Skill Check (AI)</h2>
              <p className="mt-2 text-sm text-gray-400">{questionCountText}</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Demo
            </span>
          </div>

          {loading && (
            <div className="mt-6 text-sm text-gray-400">
              Generating role-based questions...
            </div>
          )}
          {error && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              {submitted && score !== null && (
                <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                    Score
                  </p>
                  <div className="mt-2 text-4xl font-semibold text-emerald-100">
                    {score}%
                  </div>
                  <p className="mt-2 text-sm text-emerald-100/70">
                    {
                      questions.filter(
                        (q, i) => selected[i] === q.correct_answer,
                      ).length
                    }{" "}
                    of {questions.length} correct
                  </p>
                </div>
              )}

              {submitted && topicSummary.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                    Topic Breakdown
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {topicSummary.map((t) => {
                      const ratio = t.correct / t.total;
                      const isStrong = ratio >= 0.6;
                      return (
                        <div
                          key={t.topic}
                          className={[
                            "rounded-xl border px-4 py-3",
                            isStrong
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-100",
                          ].join(" ")}
                        >
                          <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                            {t.topic.replace(/-/g, " ")}
                          </p>
                          <div className="mt-2 text-sm">
                            {t.correct} / {t.total} correct
                          </div>
                          <div className="mt-1 text-xs opacity-80">
                            {isStrong ? "Strong topic" : "Needs work"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="relative mt-6 min-h-[560px] rounded-3xl border border-gray-800 bg-[#080b14] p-6 md:p-10">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                  <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                    {currentQuestion?.difficulty}
                  </span>
                </div>

                <p className="mt-6 max-w-4xl text-2xl font-semibold uppercase leading-tight text-white md:text-4xl">
                  {currentQuestion?.question_text}
                </p>

                <div className="mx-auto mt-16 flex max-w-3xl flex-col gap-3">
                  {currentQuestion?.options.map((option) => {
                    const isSelected = selected[currentIndex] === option.key;
                    const isCorrect = option.key === currentQuestion.correct_answer;
                    const showResult = submitted;

                    return (
                      <button
                        key={`${currentQuestion.topic}-${currentIndex}-${option.key}`}
                        onClick={() => handleSelect(currentIndex, option.key)}
                        disabled={submitted}
                        className={[
                          "flex items-center gap-4 border-b border-transparent px-2 py-3 text-left text-sm uppercase tracking-[0.12em] transition",
                          showResult
                            ? isCorrect
                              ? "text-emerald-200"
                              : isSelected
                                ? "text-red-200"
                                : "text-gray-400"
                            : isSelected
                              ? "text-white"
                              : "text-gray-300 hover:text-white",
                        ].join(" ")}
                      >
                        <span className="w-6 shrink-0 text-[11px] text-gray-500">
                          {option.key}
                        </span>
                        <span>{option.text}</span>
                      </button>
                    );
                  })}
                </div>

                {submitted && currentQuestion && (
                  <p className="mx-auto mt-8 max-w-3xl text-xs text-emerald-100/70">
                    Correct answer:{" "}
                    <span className="font-semibold text-emerald-200">
                      {currentQuestion.correct_answer}
                    </span>
                    {currentQuestion.explanation
                      ? ` — ${currentQuestion.explanation}`
                      : ""}
                  </p>
                )}

                <div className="mt-12 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((idx) => Math.max(idx - 1, 0))}
                      disabled={currentIndex === 0}
                      className="rounded-md border border-gray-700 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((idx) =>
                          Math.min(idx + 1, questions.length - 1),
                        )
                      }
                      disabled={currentIndex === questions.length - 1}
                      className="rounded-md border border-gray-700 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitted}
                    className={[
                      "rounded-xl px-5 py-2 text-sm font-semibold transition",
                      !allAnswered || submitted
                        ? "cursor-not-allowed border border-gray-800 bg-slate-950/60 text-gray-500"
                        : "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30",
                    ].join(" ")}
                  >
                    {submitted ? "Submitted" : "Complete assessment"}
                  </button>
                </div>

                <div className="absolute bottom-6 right-6">
                  <div className="relative h-16 w-16">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 72 72">
                      <circle
                        cx="36"
                        cy="36"
                        r={progressRadius}
                        fill="none"
                        stroke="rgba(255,255,255,0.16)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={progressRadius}
                        fill="none"
                        stroke="rgba(244,244,245,0.92)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={progressCircumference}
                        strokeDashoffset={progressOffset}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-200">
                      {currentIndex + 1}/{questions.length}
                    </span>
                  </div>
                </div>
              </div>

              {submitted && (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-slate-950/60 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">
                        Ready for a tailored roadmap?
                      </p>
                      <p className="text-xs text-emerald-200/70">
                        We will focus on your weak topics first.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateRoadmap}
                      disabled={roadmapLoading}
                      className={[
                        "rounded-xl px-5 py-2 text-sm font-semibold transition",
                        roadmapLoading
                          ? "cursor-not-allowed border border-gray-800 bg-slate-950/60 text-gray-500"
                          : "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30",
                      ].join(" ")}
                    >
                      {roadmapLoading ? "Generating…" : "Generate Roadmap"}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                  {roadmapError && (
                    <p className="mt-3 text-xs text-red-300">{roadmapError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
