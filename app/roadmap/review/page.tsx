"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ReviewQuestion = {
  question_text: string;
  topic: string;
  expected_points: string[];
};

type ReviewResponse = {
  roadmapId: string;
  roadmapTitle: string;
  questions: ReviewQuestion[];
};

const QUESTION_COUNT = 10;
const LOCALSTORAGE_AUTOSAVE_DELAY = 500; // 500ms for immediate local save
const DB_SYNC_DELAY = 3000; // 3 seconds for DB sync
const STORAGE_KEY_PREFIX = "prepai-review:answers:";

export default function RoadmapReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dbSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localStorageSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmapId, setRoadmapId] = useState<string>("");
  const [roadmapTitle, setRoadmapTitle] = useState<string>("");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastSyncStatus, setLastSyncStatus] = useState<
    "idle" | "saving" | "synced"
  >("idle");

  const storageKey = roadmapId ? `${STORAGE_KEY_PREFIX}${roadmapId}` : null;

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((answer) => answer.trim().length > 0)
      .length;
  }, [answers]);

  useEffect(() => {
    const rid = searchParams.get("rid");
    const params = new URLSearchParams();
    if (rid) params.set("rid", rid);

    const load = async () => {
      try {
        const res = await fetch(
          `/api/roadmap-review-questions?${params.toString()}`,
        );
        const data = (await res.json()) as ReviewResponse | { error?: string };

        if (!res.ok || !("questions" in data)) {
          const errorMessage =
            "error" in data ? data.error : "Failed to load review questions.";
          throw new Error(errorMessage ?? "Failed to load review questions.");
        }

        if (!data.questions?.length) {
          throw new Error("No review questions were generated.");
        }

        // Set roadmap data
        setRoadmapId(data.roadmapId);
        setRoadmapTitle(data.roadmapTitle);
        setQuestions(data.questions.slice(0, QUESTION_COUNT));

        // Load answers from localStorage
        const storageKey = `${STORAGE_KEY_PREFIX}${data.roadmapId}`;
        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) {
          try {
            const parsed = JSON.parse(savedAnswers);
            setAnswers(parsed);
          } catch {
            // Ignore parsing errors
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load review questions.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [searchParams]);

  // Auto-expand textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.max(textarea.scrollHeight, 160) + "px";
    };

    textarea.addEventListener("input", adjustHeight);
    adjustHeight(); // Initial adjustment

    return () => {
      textarea.removeEventListener("input", adjustHeight);
    };
  }, []);

  // Auto-adjust textarea height when answers change or currentIndex changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.max(textarea.scrollHeight, 160) + "px";
    };

    setTimeout(adjustHeight, 0);
  }, [currentIndex, answers]);

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    if (!storageKey || submitted) return;

    // Clear existing timeout
    if (localStorageSaveTimeoutRef.current) {
      clearTimeout(localStorageSaveTimeoutRef.current);
    }

    // Set new timeout for localStorage save
    localStorageSaveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(answers));
        setLastSyncStatus("saving");
      } catch (err) {
        console.error("Failed to save to localStorage:", err);
      }
    }, LOCALSTORAGE_AUTOSAVE_DELAY);

    return () => {
      if (localStorageSaveTimeoutRef.current) {
        clearTimeout(localStorageSaveTimeoutRef.current);
      }
    };
  }, [answers, storageKey, submitted]);

  // Sync to database with longer debouncing
  useEffect(() => {
    if (!storageKey || submitted || !roadmapId) return;

    // Clear existing timeout
    if (dbSyncTimeoutRef.current) {
      clearTimeout(dbSyncTimeoutRef.current);
    }

    // Set new timeout for DB sync
    dbSyncTimeoutRef.current = setTimeout(() => {
      const syncToDb = async () => {
        try {
          setLastSyncStatus("saving");
          await fetch("/api/autosave-review-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roadmapId,
              answers,
            }),
          });
          setLastSyncStatus("synced");
          // Reset status after 2 seconds
          setTimeout(() => setLastSyncStatus("idle"), 2000);
        } catch (err) {
          console.error("Failed to sync to database:", err);
          setLastSyncStatus("idle");
        }
      };

      void syncToDb();
    }, DB_SYNC_DELAY);

    return () => {
      if (dbSyncTimeoutRef.current) {
        clearTimeout(dbSyncTimeoutRef.current);
      }
    };
  }, [answers, storageKey, submitted, roadmapId]);

  // Cross-tab synchronization
  useEffect(() => {
    if (!storageKey) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue && !submitted) {
        try {
          const updatedAnswers = JSON.parse(event.newValue);
          setAnswers(updatedAnswers);
        } catch {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [storageKey, submitted]);

  function updateAnswer(index: number, value: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  function handleSubmit() {
    if (answeredCount < questions.length) return;
    console.log("[roadmap-review] submitted answers", {
      roadmapTitle,
      questions,
      answers,
    });
    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm text-white/70">
            Generating review questions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/roadmap")}
            className="mt-4 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm"
          >
            Back to roadmap
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sticky top-8">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-4">
                Questions
              </p>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {questions.map((_, index) => {
                  const isAnswered = answers[index]?.trim().length > 0;
                  const isActive = currentIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!submitted) setCurrentIndex(index);
                      }}
                      className={[
                        "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "border border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                          : isAnswered
                            ? "text-white/70 hover:bg-white/10"
                            : "text-white/50 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          isActive
                            ? "bg-indigo-500 text-white"
                            : isAnswered
                              ? "bg-emerald-500/30 text-emerald-200"
                              : "bg-white/10 text-white/40",
                        ].join(" ")}
                      >
                        {isAnswered ? "✓" : index + 1}
                      </span>
                      <span>Question {index + 1}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => router.push("/roadmap")}
                className="mt-6 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/30 hover:bg-white/15"
              >
                Back
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">
                    Review Your Progress
                  </p>
                  <h1 className="text-3xl font-semibold text-white">
                    {roadmapTitle}
                  </h1>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1">
                    Answers Saved
                  </p>
                  <p className="text-3xl font-bold text-indigo-400">
                    {answeredCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  Review Mode
                </span>
                <span className="text-sm text-white/60">
                  • {QUESTION_COUNT} Questions Total
                </span>
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">
                      Question {String(currentIndex + 1).padStart(2, "0")}
                    </p>
                    <div className="rounded-full inline-block border border-indigo-400/50 bg-gradient-to-r from-indigo-500/20 to-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100 shadow-lg shadow-indigo-500/10 mb-4">
                      {currentQuestion.topic}
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-white mb-8 leading-relaxed">
                  {currentQuestion.question_text}
                </h2>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Your Analysis
                    </p>
                    <div className="flex items-center gap-2">
                      {lastSyncStatus === "saving" && (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400/80">
                          <span className="animate-pulse">●</span>
                          Saving...
                        </span>
                      )}
                      {lastSyncStatus === "synced" && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                          <span>✓</span>
                          Synced
                        </span>
                      )}
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={answers[currentIndex] ?? ""}
                    onChange={(e) => updateAnswer(currentIndex, e.target.value)}
                    disabled={submitted}
                    placeholder="Begin typing your structured response here..."
                    className="w-full rounded-xl border border-white/15 bg-[#0b1224] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-indigo-400/40 resize-none overflow-hidden"
                    style={{
                      minHeight: "160px",
                      maxHeight: "400px",
                    }}
                  />
                </div>

                <p className="text-xs text-white/50 italic">
                  Add diagrams or supporting data (optional) • Auto-saves
                  locally every 500ms, syncs to cloud after 3 seconds
                </p>
              </div>
            )}

            {/* Navigation and Submit */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0 || submitted}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      Math.min(questions.length - 1, currentIndex + 1),
                    )
                  }
                  disabled={currentIndex === questions.length - 1 || submitted}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitted || answeredCount < questions.length}
                className={[
                  "rounded-xl px-6 py-2 text-sm font-semibold transition",
                  submitted || answeredCount < questions.length
                    ? "cursor-not-allowed border border-white/10 bg-white/10 text-white/40"
                    : "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30",
                ].join(" ")}
              >
                {submitted ? "Submitted" : "Submit for grading"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
