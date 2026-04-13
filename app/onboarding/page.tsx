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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  .ob-root {
    position: fixed; inset: 0;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    display: flex;
    overflow: hidden;
  }

  .ob-glow {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 60% at 60% 50%, rgba(10,62,55,0.52) 0%, rgba(5,28,26,0.26) 40%, transparent 68%),
      radial-gradient(ellipse 28% 22% at 12% 80%, rgba(4,22,35,0.28) 0%, transparent 55%);
  }

  /* ── Left panel ── */
  .ob-left {
    position: relative; z-index: 1;
    flex: 1;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 2.8rem 4vw;
    border-right: 0.5px solid rgba(255,255,255,0.06);
  }

  .ob-logo {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 1.1rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: #fff; text-decoration: none;
  }

  .ob-left-body { display: flex; flex-direction: column; gap: 2rem; }

  .ob-headline {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(2.2rem, 4.5vw, 4rem);
    line-height: 1.05; letter-spacing: -0.015em; text-transform: uppercase;
    color: #fff; max-width: 13ch;
    animation: obFadeUp 0.5s ease both;
  }
  .ob-headline em { font-style: normal; color: rgba(255,255,255,0.22); }

  .ob-steps { display: flex; flex-direction: column; gap: 0; }
  .ob-step {
    display: flex; align-items: baseline; gap: 1.2rem;
    padding: 0.8rem 0;
    border-bottom: 0.5px solid rgba(255,255,255,0.05);
    animation: obFadeUp 0.4s ease both;
  }
  .ob-step:first-child { border-top: 0.5px solid rgba(255,255,255,0.05); }
  .ob-step-num {
    font-size: 0.5rem; letter-spacing: 0.2em;
    color: rgba(255,255,255,0.18); flex-shrink: 0;
  }
  .ob-step-text {
    font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.28);
  }
  .ob-step--active .ob-step-text { color: rgba(255,255,255,0.6); }
  .ob-step--done .ob-step-text  { color: rgba(74,222,128,0.55); }
  .ob-step--done .ob-step-num   { color: rgba(74,222,128,0.4); }

  .ob-left-tagline {
    font-size: 0.55rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.18);
    animation: obFadeUp 0.5s 0.1s ease both;
  }

  /* ── Right panel ── */
  .ob-right {
    position: relative; z-index: 1;
    width: 480px; flex-shrink: 0;
    display: flex; flex-direction: column; justify-content: center;
    padding: 4rem 3.5rem;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
    border-left: 0.5px solid rgba(255,255,255,0.06);
    animation: obFadeUp 0.45s 0.05s ease both;
    overflow-y: auto;
  }

  .ob-form-eyebrow {
    font-size: 0.52rem; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); margin-bottom: 1.4rem;
  }
  .ob-form-title {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: clamp(1.8rem, 3vw, 2.6rem); text-transform: uppercase;
    letter-spacing: -0.01em; color: #fff; line-height: 1.05; margin-bottom: 2.8rem;
  }

  /* Field */
  .ob-field { margin-bottom: 1.6rem; }
  .ob-label {
    display: block;
    font-size: 0.5rem; letter-spacing: 0.26em; text-transform: uppercase;
    color: rgba(255,255,255,0.28); margin-bottom: 0.6rem;
  }

  .ob-input,
  .ob-select {
    width: 100%; height: 44px;
    border: 0.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.02);
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.06em;
    color: rgba(255,255,255,0.75);
    padding: 0 1rem;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
    -webkit-appearance: none; appearance: none;
  }
  .ob-input::placeholder { color: rgba(255,255,255,0.15); }
  .ob-input:focus,
  .ob-select:focus {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.03);
  }

  /* Custom select wrapper */
  .ob-select-wrap { position: relative; }
  .ob-select-arrow {
    position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
    pointer-events: none;
    font-size: 0.5rem; color: rgba(255,255,255,0.2);
    letter-spacing: 0.1em;
  }
  .ob-select option { background: #0a0a0a; color: rgba(255,255,255,0.7); }

  /* Role grid — tap-to-select cards */
  .ob-role-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: rgba(255,255,255,0.07);
  }
  .ob-role-btn {
    background: #000; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 0.8rem 0.5rem;
    transition: background 0.15s, color 0.15s;
    text-align: center;
  }
  .ob-role-btn:hover { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); }
  .ob-role-btn--active {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.9);
    outline: 0.5px solid rgba(255,255,255,0.25);
    outline-offset: -1px;
  }

  /* Exp options */
  .ob-exp-list { display: flex; flex-direction: column; gap: 1px; background: rgba(255,255,255,0.07); }
  .ob-exp-btn {
    background: #000; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 0.75rem 1rem;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.15s, color 0.15s;
    text-align: left; width: 100%;
  }
  .ob-exp-btn:hover { background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.6); }
  .ob-exp-btn--active {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.9);
  }
  .ob-exp-check {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(74,222,128,0.7); flex-shrink: 0;
    opacity: 0; transition: opacity 0.15s;
  }
  .ob-exp-btn--active .ob-exp-check { opacity: 1; }

  /* Submit */
  .ob-submit {
    width: 100%; height: 44px; margin-top: 0.8rem;
    background: rgba(255,255,255,0.92); border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: #000; transition: background 0.15s;
  }
  .ob-submit:not(:disabled):hover { background: #fff; }
  .ob-submit:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Mobile */
  @media (max-width: 768px) {
    .ob-root { flex-direction: column; overflow-y: auto; position: relative; min-height: 100vh; }
    .ob-left {
      flex: none; border-right: none;
      border-bottom: 0.5px solid rgba(255,255,255,0.06);
      padding: 2rem 6vw 2.5rem;
    }
    .ob-headline { font-size: clamp(1.8rem, 8vw, 3rem); }
    .ob-steps { display: none; }
    .ob-left-tagline { display: none; }
    .ob-right { width: 100%; padding: 2.5rem 6vw 4rem; }
    .ob-role-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @keyframes obFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

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
      <style>{CSS}</style>
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
