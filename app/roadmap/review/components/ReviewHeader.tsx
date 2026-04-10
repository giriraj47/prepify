interface ReviewHeaderProps {
  roadmapTitle: string;
  answeredCount: number;
}

export function ReviewHeader({
  roadmapTitle,
  answeredCount,
}: ReviewHeaderProps) {
  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">
            Review Your Progress
          </p>
          <h1 className="text-3xl font-semibold text-white">{roadmapTitle}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1">
            Answers Saved
          </p>
          <p className="text-3xl font-bold text-indigo-400">{answeredCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
          Review Mode
        </span>
        <span className="text-sm text-white/60">• 10 Questions Total</span>
      </div>
    </div>
  );
}
