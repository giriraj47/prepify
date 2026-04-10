"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useReview } from "@/lib/hooks";
import {
  ReviewHeader,
  QuestionSidebar,
  QuestionContent,
  QuestionNavigation,
} from "@/app/roadmap/review/components";

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

function RoadmapReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    answers,
    currentIndex,
    syncStatus,
    submitted,
    roadmapId,
    loading: reviewLoading,
    error,
    answeredCount,
    totalQuestions,
    isComplete,
    loadReview,
    updateAnswer,
    setCurrentIndex,
    submitReview,
  } = useReview();

  const [roadmapTitle, setRoadmapTitle] = useState<string>("");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

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
        setRoadmapTitle(data.roadmapTitle);
        setQuestions(data.questions.slice(0, 10)); // QUESTION_COUNT = 10

        // Load answers using the hook
        loadReview(data.roadmapId);
      } catch (err) {
        console.error("Failed to load review:", err);
        // The hook will handle the error state
      }
    };

    void load();
  }, [authLoading, isAuthenticated, searchParams, loadReview, router]);

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

  function handleSubmit() {
    if (!isComplete) return;
    submitReview();
  }

  if (authLoading || reviewLoading) {
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
          <QuestionSidebar
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            submitted={submitted}
            onQuestionSelect={(index) => setCurrentIndex(index)}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <ReviewHeader
              roadmapTitle={roadmapTitle}
              answeredCount={answeredCount}
            />

            {/* Current Question */}
            {currentQuestion && (
              <QuestionContent
                question={currentQuestion}
                currentIndex={currentIndex}
                currentAnswer={answers[currentIndex]}
                syncStatus={syncStatus}
                submitted={submitted}
                onAnswerChange={(value) => updateAnswer(currentIndex, value)}
              />
            )}

            {/* Navigation and Submit */}
            <QuestionNavigation
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              submitted={submitted}
              isComplete={isComplete}
              onPrevious={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              onNext={() =>
                setCurrentIndex(
                  Math.min(questions.length - 1, currentIndex + 1),
                )
              }
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoadmapReviewPageContent />
    </Suspense>
  );
}
