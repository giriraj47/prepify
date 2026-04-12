"use client";

import { useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  const codeFontStyle = {
    fontFamily:
      '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => {
      const width = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / width);
      setCurrentIndex(Math.min(Math.max(idx, 0), questions.length - 1));
    };
    el.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => el.removeEventListener("scroll", handle);
  }, [questions.length]);

  function scrollToIndex(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: width * index, behavior: "smooth" });
  }

  function handlePrevCard() {
    scrollToIndex(Math.max(currentIndex - 1, 0));
  }

  function handleNextCard() {
    scrollToIndex(Math.min(currentIndex + 1, questions.length - 1));
  }

  function splitQuestionText(text: string): {
    pre: string;
    code: string | null;
    post: string;
  } {
    const match = text.match(/```([\s\S]*?)```/);
    if (!match || match.index === undefined) {
      return { pre: text, code: null, post: "" };
    }
    const pre = text.slice(0, match.index).trimEnd();
    const code = match[1].trim();
    const post = text.slice(match.index + match[0].length).trimStart();
    return { pre, code, post };
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
        {/* <div className="rounded-3xl border border-emerald-400/20 bg-slate-950 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
            Deep Focus
          </p>
          <h1 className="mt-4 text-4xl font-semibold">Study</h1>
          <p className="mt-4 text-lg text-emerald-50/80">
            Build fundamentals with curated materials, spaced repetition, and
            deliberate practice. This is a static placeholder page you can extend
            with your study plan.
          </p>
        </div> */}

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
              Generating questions with Gemini...
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

              <div className="relative mt-6">
                <div
                  ref={scrollRef}
                  className="flex items-start snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-3xl border border-gray-800 bg-slate-950/40"
                >
                  {questions.map((question, index) => (
                    <div
                      key={`${question.topic}-${index}`}
                      className="min-w-full self-start snap-center px-6 py-8 md:px-12 md:py-12"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="whitespace-pre-wrap text-base"
                          style={codeFontStyle}
                        >
                          <span className="mr-2 text-emerald-300/80">
                            {index + 1}.
                          </span>
                          {(() => {
                            const { pre, code, post } = splitQuestionText(
                              question.question_text,
                            );
                            return (
                              <div className="space-y-3">
                                {pre && <p className="text-gray-200">{pre}</p>}
                                {code && (
                                  <div className="overflow-hidden rounded-xl border border-emerald-400/30 bg-[#0c101d] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                                    <div className="flex items-center justify-between border-b border-emerald-400/20 bg-[#0f1424] px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-emerald-200/70">
                                      <span>Code</span>
                                      <span className="text-emerald-300/50">
                                        js
                                      </span>
                                    </div>
                                    <pre className="whitespace-pre-wrap px-4 py-3 text-xs text-emerald-50/90">
                                      <code>{code}</code>
                                    </pre>
                                  </div>
                                )}
                                {post && (
                                  <p className="text-gray-200">{post}</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                          {question.difficulty}
                        </span>
                      </div>
                      <div
                        className="mt-5 grid gap-3 text-sm text-gray-300"
                        style={codeFontStyle}
                      >
                        {question.options.map((option) => {
                          const isSelected = selected[index] === option.key;
                          const isCorrect =
                            option.key === question.correct_answer;
                          const showResult = submitted;
                          return (
                            <button
                              key={`${question.topic}-${index}-${option.key}`}
                              onClick={() => handleSelect(index, option.key)}
                              className={[
                                "rounded-lg border px-4 py-3 text-left transition",
                                showResult
                                  ? isCorrect
                                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                                    : isSelected
                                      ? "border-red-400/50 bg-red-500/10 text-red-100"
                                      : "border-gray-800 bg-slate-950/70 text-gray-300"
                                  : isSelected
                                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                                    : "border-gray-800 bg-slate-950/70 text-gray-300 hover:border-gray-700",
                              ].join(" ")}
                              disabled={submitted}
                            >
                              <span className="mr-2 text-emerald-300/80">
                                {option.key}.
                              </span>
                              <span className="whitespace-pre-wrap">
                                {option.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {submitted && (
                        <p className="mt-4 text-xs text-emerald-100/70">
                          Correct answer:{" "}
                          <span className="font-semibold text-emerald-200">
                            {question.correct_answer}
                          </span>
                          {question.explanation
                            ? ` — ${question.explanation}`
                            : ""}
                        </p>
                      )}

                      {index === questions.length - 1 && (
                        <div className="mt-8 flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {answeredCount}/{questions.length} answered
                          </p>
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
                            {submitted ? "Submitted" : "Submit answers"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
                  <button
                    onClick={handlePrevCard}
                    className="pointer-events-auto rounded-full border border-emerald-400/30 bg-slate-950/80 p-2 text-emerald-200 hover:bg-slate-950"
                    disabled={currentIndex === 0}
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextCard}
                    className="pointer-events-auto rounded-full border border-emerald-400/30 bg-slate-950/80 p-2 text-emerald-200 hover:bg-slate-950"
                    disabled={currentIndex === questions.length - 1}
                  >
                    →
                  </button>
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
                      {roadmapLoading ? "Generating…" : "Generate roadmap"}
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

        {/* <div className="rounded-3xl border border-amber-400/20 bg-slate-950 p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold">Recommended Roadmap</h2>
          <p className="mt-2 text-sm text-amber-100/70">
            Static roadmap for now — AI-generated roadmap coming next.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                Week 1–2
              </p>
              <h3 className="mt-2 text-lg font-semibold">Core JS</h3>
              <p className="mt-2 text-sm text-amber-50/80">
                Variables, closures, async patterns, and DOM basics.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                Week 3–4
              </p>
              <h3 className="mt-2 text-lg font-semibold">React Foundations</h3>
              <p className="mt-2 text-sm text-amber-50/80">
                Hooks, component patterns, state management.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                Week 5–6
              </p>
              <h3 className="mt-2 text-lg font-semibold">System & APIs</h3>
              <p className="mt-2 text-sm text-amber-50/80">
                REST basics, performance, and architecture drills.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
