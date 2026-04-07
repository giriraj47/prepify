"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  experienceMap,
  getCurrentUser,
  getRoleIdBySlug,
  getUserProfile,
  roleOptionToName,
  roleSlugMap,
  signOut,
  yearsToExperienceLabel,
} from "@/lib/supabase/services";

type Profile = {
  name: string;
  role: string;
  experience: string;
};

const roles = ["Frontend", "Backend", "Fullstack", "DevOps", "QA", "Other"];
const experiences = ["0-1 years", "1-3 years", "3-5 years", "5+ years"];
const roleNameToOption: Record<string, string> = {
  "Frontend Developer": "Frontend",
  "Backend Developer": "Backend",
  "Full Stack Developer": "Fullstack",
  "DevOps / SRE": "DevOps",
  "QA / Test Engineer": "QA",
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const loadProfile = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setUserId(null);
        setProfile(null);
        return;
      }
      setUserId(user.id);
      let data = null;
      try {
        data = await getUserProfile(user.id);
      } catch (error) {
        console.error("Failed to load profile from Supabase", error);
        setProfile(null);
        return;
      }
      if (!data) {
        setProfile(null);
        return;
      }
      const roleName = data.roles?.name ?? "Other";
      const roleOption = roleNameToOption[roleName] ?? "Other";
      const experienceLabel = yearsToExperienceLabel(data.experience_years);
      const mapped: Profile = {
        name: data.full_name ?? "User",
        role: roleOption,
        experience: experienceLabel,
      };
      setProfile(mapped);
      setRole(mapped.role);
      setExperience(mapped.experience);
    };

    loadProfile();
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
    if (!profile?.name) return "U";
    return profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile?.name]);

  if (pathname === "/onboarding" || pathname === "/login") {
    return null;
  }
  if (!mounted || !canRender) {
    return null;
  }

  const handleSave = async () => {
    if (!profile || !userId) return;
    const updated: Profile = { ...profile, role, experience };
    const roleSlug = roleSlugMap[role];
    const roleId = await getRoleIdBySlug(roleSlug);
    const { years, level } = experienceMap[experience];
    try {
      const user = await getCurrentUser();
      const email = user?.email ?? "";
      await upsertUserProfile({
        id: userId,
        email,
        full_name: updated.name,
        role_id: roleId,
        experience_years: years,
        experience_level: level,
        is_onboarded: true,
      });
    } catch (error) {
      console.error("Failed to save profile to Supabase", error);
      return;
    }
    setProfile(updated);
    setIsEditOpen(false);
  };

  return (
    <nav className="fixed right-6 top-6 z-40 flex justify-end">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur transition duration-200 hover:border-white/25 hover:text-white"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-semibold text-gray-900">
            {initials}
          </span>
          <span className="hidden text-sm font-medium sm:inline">
            {profile?.name ?? "Profile"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="ml-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur transition duration-200 hover:border-white/25 hover:text-white"
        >
          Home
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/10 bg-[#0f1424]/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-semibold text-gray-900">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {profile?.name ?? "Unknown user"}
                </p>
                <p className="text-xs text-gray-400">Profile details</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Role</span>
                <span>{profile?.role ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Experience</span>
                <span>{profile?.experience ?? "—"}</span>
              </div>
            </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditOpen(true);
                      setOpen(false);
                    }}
                    className="flex-1 rounded-md bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/30"
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
                    className="flex-1 rounded-md bg-red-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
      </div>
      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit profile
                </h2>
                <p className="text-sm text-gray-400">
                  Update your role and experience.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full border border-gray-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300 transition hover:border-gray-500"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs uppercase tracking-wide text-gray-400">
                Role
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {roles.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs uppercase tracking-wide text-gray-400">
                Experience
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {experiences.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 rounded-md border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-300 transition hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-900 transition hover:bg-emerald-400"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
