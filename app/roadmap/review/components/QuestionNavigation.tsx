interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  submitted: boolean;
  isComplete: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function QuestionNavigation({
  currentIndex,
  totalQuestions,
  submitted,
  isComplete,
  onPrevious,
  onNext,
  onSubmit,
}: QuestionNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0 || submitted}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1 || submitted}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <button
        onClick={onSubmit}
        disabled={submitted || !isComplete}
        className={[
          "rounded-xl px-6 py-2 text-sm font-semibold transition",
          submitted || !isComplete
            ? "cursor-not-allowed border border-white/10 bg-white/10 text-white/40"
            : "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30",
        ].join(" ")}
      >
        {submitted ? "Submitted" : "Submit for grading"}
      </button>
    </div>
  );
}
