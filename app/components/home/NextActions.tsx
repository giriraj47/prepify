import Link from "next/link";

export function NextActions() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">Next actions</p>
          <p className="text-sm text-white/60">
            Continue your roadmap or practice in the interview room.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/roadmap"
            className="rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/20"
          >
            View Roadmap
          </Link>
          <Link
            href="/interview"
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
          >
            Interview Section
          </Link>
        </div>
      </div>
    </div>
  );
}
