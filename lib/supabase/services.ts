"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export const roleSlugMap: Record<string, string | null> = {
  Frontend: "frontend-developer",
  Backend: "backend-developer",
  Fullstack: "fullstack-developer",
  DevOps: "devops-sre",
  QA: "qa-engineer",
  Other: null,
};

export const roleOptionToName: Record<string, string> = {
  Frontend: "Frontend Developer",
  Backend: "Backend Developer",
  Fullstack: "Full Stack Developer",
  DevOps: "DevOps / SRE",
  QA: "QA / Test Engineer",
  Other: "Frontend Developer",
};

export const experienceMap: Record<
  string,
  { years: number; level: ExperienceLevel }
> = {
  "0-1 years": { years: 1, level: "junior" },
  "1-3 years": { years: 2, level: "mid" },
  "3-5 years": { years: 4, level: "senior" },
  "5+ years": { years: 6, level: "lead" },
};

export const yearsToExperienceLabel = (years?: number | null) => {
  if (!years) return "0-1 years";
  if (years <= 1) return "0-1 years";
  if (years <= 3) return "1-3 years";
  if (years <= 5) return "3-5 years";
  return "5+ years";
};

export type ProfilePayload = {
  id: string;
  email: string;
  full_name: string;
  role_id: string | null;
  experience_years: number;
  experience_level: ExperienceLevel;
  is_onboarded: boolean;
};

export async function getCurrentUser() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.message?.toLowerCase().includes("auth session missing")) {
      return null;
    }
    throw error;
  }
  return data.user;
}

export async function getRoleIdBySlug(slug: string | null) {
  if (!slug) return null;
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("roles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

export async function upsertUserProfile(payload: ProfilePayload) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("users").upsert(payload);
  if (error) throw error;
}

export async function getUserProfile(userId: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("users")
    .select("full_name, experience_years, experience_level, roles(name)")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}
