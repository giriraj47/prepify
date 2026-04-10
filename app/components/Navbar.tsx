"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useProfile } from "@/lib/hooks";

type Profile = {
  name: string;
  role: string;
  experience: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [mounted, setMounted] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = window as typeof window & { __navbarMounted?: boolean };
    if (g.__navbarMounted) {
      setCanRender(false);
      return;
    }
    g.__navbarMounted = true;
    setCanRender(true);
    return () => {
      g.__navbarMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    if (!profile?.full_name) return "U";
    return profile.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile?.full_name]);

  if (pathname === "/onboarding" || pathname === "/login") {
    return null;
  }
  if (!mounted || !canRender) {
    return null;
  }

  return (
    <nav className="fixed right-4 top-1/2 z-50 flex h-[min(45vh,220px)] w-14 -translate-y-1/2 flex-col items-center justify-between rounded-[32px] border border-white/15 bg-white/10 px-1.5 py-2 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl backdrop-brightness-90">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-base text-white ring-1 ring-white/20 transition duration-200 hover:bg-white/25 hover:text-white/90 cursor-pointer"
        aria-label="Go home"
      >
        <span aria-hidden="true">🏠</span>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-slate-950 shadow-inner shadow-black/20 transition duration-200 hover:bg-emerald-300 cursor-pointer"
          aria-expanded={open}
          aria-label="Open profile menu"
        >
          {initials}
        </button>

        {open && (
          <div className="absolute right-full bottom-0 mr-2 w-64 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-950/95 p-4 text-sm text-white shadow-xl shadow-black/30 backdrop-blur-xl">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Profile
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {profile?.full_name ?? "Guest"}
                </p>
              </div>
              <div className="grid gap-2 rounded-2xl bg-white/5 p-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Role</span>
                  <span className="text-white">
                    {profile?.roles?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Experience</span>
                  <span className="text-white">
                    {profile?.experience_level ?? "—"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/onboarding");
                  }}
                  className="flex-1 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setOpen(false);
                    router.push("/login");
                  }}
                  className="flex-1 rounded-full bg-red-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200 transition hover:bg-red-500/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
