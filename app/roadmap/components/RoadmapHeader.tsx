interface RoadmapHeaderProps {
  title: string;
  description: string;
  estimatedWeeks: number | null;
  totalTopics: number;
}

export function RoadmapHeader({
  title,
  description,
  estimatedWeeks,
  totalTopics,
}: RoadmapHeaderProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C150,140 260,40 420,120 C560,190 660,120 760,180 C860,240 980,160 1200,220"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
          <path
            d="M0,220 C160,280 260,190 420,250 C560,320 660,240 760,300 C860,360 980,280 1200,340"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
          />
          <path
            d="M0,360 C160,420 260,330 420,390 C560,460 660,380 760,440 C860,500 980,420 1200,480"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div
          className="text-center text-[48px] font-semibold tracking-[0.6em] text-white/10 md:text-[84px]"
          style={{
            fontFamily: '"Space Grotesk", "Plus Jakarta Sans", serif',
          }}
        >
          ROADMAP
        </div>
        <div className="mx-auto mt-6 max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            Personalised Path
          </p>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-white/60">{description}</p>
          <div className="mt-4 text-xs text-white/50">
            ~{estimatedWeeks} weeks · {totalTopics} topics
          </div>
        </div>
      </div>
    </div>
  );
}
