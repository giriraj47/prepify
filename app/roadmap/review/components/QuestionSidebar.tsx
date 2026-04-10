import { useRouter } from "next/navigation";

interface QuestionSidebarProps {
  questions: Array<{
    question_text: string;
    topic: string;
    expected_points: string[];
  }>;
  currentIndex: number;
  answers: Record<number, string>;
  submitted: boolean;
  onQuestionSelect: (index: number) => void;
}

export function QuestionSidebar({
  questions,
  currentIndex,
  answers,
  submitted,
  onQuestionSelect,
}: QuestionSidebarProps) {
  const router = useRouter();

  return (
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
                  if (!submitted) onQuestionSelect(index);
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
  );
}
