"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  experienceMap,
  getCurrentUser,
  getRoleIdBySlug,
  roleSlugMap,
  upsertUserProfile,
} from "@/lib/supabase/services";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      if (!name) {
        const meta =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email ||
          "";
        if (meta) {
          setName(meta);
        }
      }
    };
    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !experience) return;
    if (!userId) return;

    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const email = user.email ?? "";
    const { years, level } = experienceMap[experience];
    const roleSlug = roleSlugMap[role];
    const roleId = await getRoleIdBySlug(roleSlug);

    try {
      await upsertUserProfile({
        id: userId,
        email,
        full_name: name,
        role_id: roleId,
        experience_years: years,
        experience_level: level,
        is_onboarded: true,
      });
    } catch (err) {
      console.error("Failed to save profile", err);
      return;
    }
    router.replace("/study");
  };

  return (
    <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Welcome to PrepAI
        </h1>
        <p className="text-gray-300 mb-6 text-center">
          Let's set up your profile
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select your role</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Fullstack">Fullstack</option>
              <option value="DevOps">DevOps</option>
              <option value="QA">QA</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="experience"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Experience
            </label>
            <select
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select your experience</option>
              <option value="0-1 years">0-1 years</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="5+ years">5+ years</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
}
