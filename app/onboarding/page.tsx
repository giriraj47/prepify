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

import "./onboarding.css";

const ROLES = ["Frontend", "Backend", "Fullstack", "DevOps", "QA", "Other"];
const EXPERIENCES = ["0-1 years", "1-3 years", "3-5 years", "5+ years"];

const STEPS = [
  { label: "Your name", field: "name" },
  { label: "Your role", field: "role" },
  { label: "Experience", field: "experience" },
];

export default function Onboarding() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const filledSteps = [!!name.trim(), !!role, !!experience];
  const activeStep = filledSteps.findIndex((f) => !f);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const meta = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "";
      if (meta) setName(meta);
    };
    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !experience || !userId) return;
    setSubmitting(true);
    const user = await getCurrentUser();
    if (!user) { router.push("/login"); return; }
    const { years, level } = experienceMap[experience];
    const roleSlug = roleSlugMap[role];
    const roleId = await getRoleIdBySlug(roleSlug);
    try {
      await upsertUserProfile({
        id: userId, email: user.email ?? "",
        full_name: name, role_id: roleId,
        experience_years: years, experience_level: level,
        is_onboarded: true,
      });
      router.replace("/");
    } catch (err) {
      console.error("Failed to save profile", err);
      setSubmitting(false);
    }
  };

  const allFilled = !!name.trim() && !!role && !!experience;

  return (
    <>
      <div className="ob-root">
        <div className="ob-glow" />

        {/* Left — branding */}
        <div className="ob-left">
          <a href="/" className="ob-logo">Prepify</a>

          <div className="ob-left-body">
            <h1 className="ob-headline">
              Build Your<br /><em>Profile.</em><br />Start Winning.
            </h1>

            <div className="ob-steps">
              {STEPS.map((s, i) => (
                <div
                  key={s.field}
                  className={`ob-step ${
                    filledSteps[i] ? "ob-step--done" : i === activeStep ? "ob-step--active" : ""
                  }`}
                  style={{ animationDelay: `${0.1 + i * 0.06}s` }}
                >
                  <span className="ob-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ob-step-text">
                    {filledSteps[i] ? "✓ " : ""}{s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="ob-left-tagline">AI-powered interview preparation</p>
        </div>

        {/* Right — form */}
        <div className="ob-right">
          <p className="ob-form-eyebrow">Profile Setup</p>
          <h2 className="ob-form-title">Let's Get Started</h2>

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div className="ob-field">
              <label className="ob-label" htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                className="ob-input"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Role — tap grid */}
            <div className="ob-field">
              <label className="ob-label">Your Role</label>
              <div className="ob-role-grid">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`ob-role-btn ${role === r ? "ob-role-btn--active" : ""}`}
                    onClick={() => setRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience — tap list */}
            <div className="ob-field">
              <label className="ob-label">Experience Level</label>
              <div className="ob-exp-list">
                {EXPERIENCES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    className={`ob-exp-btn ${experience === ex ? "ob-exp-btn--active" : ""}`}
                    onClick={() => setExperience(ex)}
                  >
                    <span>{ex}</span>
                    <span className="ob-exp-check" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="ob-submit"
              disabled={!allFilled || submitting}
            >
              {submitting ? "Saving…" : "Create Profile →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
