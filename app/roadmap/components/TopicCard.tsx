interface Resource {
  title: string;
  url: string;
  type: string;
  completed?: boolean;
}

interface RoadmapTopic {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: string;
  estimated_hours: number | null;
  resources: Resource[];
}

interface TopicCardProps {
  topic: RoadmapTopic;
  index: number;
  isUnlocked: boolean;
  isComplete: boolean;
  allTopics: RoadmapTopic[];
  onToggleResource: (
    topic: RoadmapTopic,
    resourceIndex: number,
  ) => Promise<void>;
}

export function TopicCard({
  topic,
  index,
  isUnlocked,
  isComplete,
  onToggleResource,
}: TopicCardProps) {
  const alignRight = index % 2 === 1;
  const phaseLabel = `Phase ${index + 1}`;
  const statusLabel = isComplete
    ? "complete"
    : isUnlocked
      ? "available"
      : "locked";

  return (
    <div
      className={[
        "relative z-10 flex flex-col gap-4 md:flex-row",
        alignRight ? "md:flex-row-reverse" : "",
      ].join(" ")}
    >
      <div className="flex w-full flex-col gap-3 md:w-1/2">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
          <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.6)]" />
          <span>{phaseLabel}</span>
          <span className="text-white/20">·</span>
          <span>{statusLabel}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">{topic.title}</h3>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
              ~{topic.estimated_hours} hrs
            </span>
          </div>
          <p className="mt-3 text-sm text-white/60">{topic.description}</p>
          {topic.resources?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
              {topic.resources.map((r, idx) => (
                <label
                  key={`${topic.order_index}-${idx}`}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1 transition",
                    isUnlocked
                      ? "border-white/10 bg-white/5 hover:border-emerald-400/40"
                      : "border-white/5 bg-white/5 opacity-50",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-emerald-400"
                    checked={r.completed ?? false}
                    disabled={!isUnlocked}
                    onChange={() => onToggleResource(topic, idx)}
                  />
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      "hover:text-emerald-100",
                      isUnlocked ? "" : "pointer-events-none",
                    ].join(" ")}
                  >
                    {r.type}: {r.title}
                  </a>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hidden w-1/2 md:block" />
    </div>
  );
}
