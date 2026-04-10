interface ScoreSummaryProps {
  strongTopics?: string[];
  weakTopics?: string[];
}

export function ScoreSummary({
  strongTopics = [],
  weakTopics = [],
}: ScoreSummaryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
          Strong Topics
        </p>
        {strongTopics?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {strongTopics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
              >
                {t.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-100/60">
            No strong topics yet. Take the assessment to see results.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
          Weak Topics
        </p>
        {weakTopics?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100"
              >
                {t.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-100/60">
            No weak topics yet. Take the assessment to see results.
          </p>
        )}
      </div>
    </div>
  );
}
