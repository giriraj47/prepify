"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useProfileStore } from "@/lib/store";

interface DashboardProps {
  summary: {
    score: number;
    correct: number;
    total: number;
    weakTopics: string[];
    strongTopics: string[];
  } | null;
}

const recentActivity = [
  {
    id: 1,
    icon: "</>",
    title: "Consistent Hashing Algorithm",
    meta: "Completed in 24 mins • Score: 92/100",
    color: "bg-indigo-500/20 text-indigo-300",
  },
  {
    id: 2,
    icon: "⚙",
    title: "Behavioral: Conflict Resolution",
    meta: "AI Feedback Reviewed • 2 days ago",
    color: "bg-purple-500/20 text-purple-300",
  },
  {
    id: 3,
    icon: "📊",
    title: "Dynamic Programming Basics",
    meta: "Roadmap Module Started • 3 days ago",
    color: "bg-emerald-500/20 text-emerald-300",
  },
];

export function Dashboard({ summary }: DashboardProps) {
  const { user, signOut } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const router = useRouter();

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "there";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase())
        .join("")
    : "U";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-[#2D3FE7] font-bold text-xl tracking-tight">Prepify</span>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Dashboard", href: "/", active: true },
                { label: "My Roadmap", href: "/roadmap" },
                { label: "Roadmap Assessment", href: "/study" },
                { label: "Resources", href: "#" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.active
                      ? "text-[#2D3FE7] border-b-2 border-[#2D3FE7] rounded-none"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {profile?.full_name || user?.user_metadata?.full_name || "User"}
            </span>
            <div className="relative group">
              <button
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D3FE7] to-[#6875f5] text-white text-sm font-bold flex items-center justify-center shadow cursor-pointer"
                aria-label="Profile menu"
              >
                {initials}
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 overflow-hidden transform origin-top-right group-hover:translate-y-0 translate-y-2">
                <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Role</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {profile?.roles?.name || "Candidate"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Exp</p>
                      <p className="text-sm font-bold text-[#2D3FE7]">
                        {profile?.experience_level || "Any"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/onboarding"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span>👤</span> Edit Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome + Current Path */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Welcome */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2D3FE7] mb-3">
              Candidate Dashboard
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {firstName}!
            </h1>
            <p className="text-gray-500 mb-6 max-w-md">
              {summary?.weakTopics?.length
                ? `Your mastery is growing — ${summary.weakTopics[0]?.replace(/-/g, " ")} is an area to focus on. Ready to hit your next milestone?`
                : "Your prep journey is underway. Ready to dive back in and hit your next milestone?"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/study"
                className="inline-flex items-center gap-2 bg-[#2D3FE7] hover:bg-[#2435c4] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-md shadow-indigo-200"
              >
                <span>▶</span> Generate Roadmap
              </Link>
              <Link
                href="/interview"
                className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-[#2D3FE7] font-semibold px-6 py-3 rounded-xl transition-colors text-sm border border-indigo-200"
              >
                <span>⚡</span> Interview
              </Link>
            </div>
          </div>

          {/* Current Path Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Current Path</p>
              <p className="text-[#2D3FE7] font-semibold text-sm mb-4">
                {profile?.roles?.name
                  ? `${profile.roles.name} Expert`
                  : "System Design Expert"}
              </p>
              {/* Progress ring placeholder */}
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#2D3FE7"
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - (summary?.score ?? 68) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {summary?.score ?? 68}%
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Score</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.correct ?? 0}/{summary?.total ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Next Milestone</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-800">Mock Interview: Scaling</p>
                <p className="text-xs text-gray-400">Tomorrow, 10 AM</p>
              </div>
              <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2D3FE7] to-[#22d3ee] rounded-full transition-all"
                  style={{ width: `${summary?.score ?? 68}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Challenge + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily Challenge */}
          <div className="bg-[#0d1117] rounded-2xl p-6 flex flex-col justify-between min-h-[260px] shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#22d3ee] text-sm">🎯</span>
                <p className="text-xs font-bold uppercase tracking-widest text-[#22d3ee]">Daily Challenge</p>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug mb-4">
                Implement a Rate Limiter using Token Bucket
              </h2>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span>👥</span>
                <span className="font-semibold text-white">+1.2k</span>
                <span>participants today</span>
              </div>
            </div>
            <Link
              href="/interview"
              className="mt-6 block text-center bg-[#22d3ee] hover:bg-[#06b6d4] text-gray-900 font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Accept Challenge
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
              <Link href="/study" className="text-sm font-semibold text-[#2D3FE7] hover:underline">
                View Assessment
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono shrink-0 ${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.meta}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Topics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">
              Strong Topics
            </p>
            {summary?.strongTopics?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.strongTopics.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full font-medium"
                  >
                    {t.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">
                Take an assessment to reveal your strengths.
              </p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
              Areas to Improve
            </p>
            {summary?.weakTopics?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.weakTopics.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-full font-medium"
                  >
                    {t.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">
                No weak areas detected yet. Keep practicing!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
