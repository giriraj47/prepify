"use client";

import Link from "next/link";
import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  .lp-root {
    min-height: 100vh;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    overflow-x: hidden;
    position: relative;
  }

  .lp-glow {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 60% 42%, rgba(10,62,55,0.5) 0%, rgba(5,28,26,0.26) 40%, transparent 68%),
      radial-gradient(ellipse 30% 20% at 15% 70%, rgba(4,22,35,0.3) 0%, transparent 55%);
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.6rem 5vw;
    border-bottom: 0.5px solid transparent;
    transition: border-color 0.3s, background 0.3s;
  }
  .lp-nav--scrolled {
    border-color: rgba(255,255,255,0.07);
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(14px);
  }

  .lp-logo {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: 1.15rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #fff;
    text-decoration: none;
  }

  .lp-nav-links {
    display: flex; align-items: center; gap: 2.5rem;
    list-style: none;
  }
  .lp-nav-links a {
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    text-decoration: none;
    transition: color 0.15s;
  }
  .lp-nav-links a:hover { color: rgba(255,255,255,0.8); }

  .lp-nav-actions { display: flex; align-items: center; gap: 1.2rem; }

  .lp-nav-login {
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    text-decoration: none;
    transition: color 0.15s;
  }
  .lp-nav-login:hover { color: rgba(255,255,255,0.8); }

  .lp-nav-cta {
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    border: 0.5px solid rgba(255,255,255,0.2);
    padding: 0.5rem 1.2rem;
    transition: all 0.15s;
  }
  .lp-nav-cta:hover { color: #fff; border-color: rgba(255,255,255,0.6); }

  /* Mobile */
  .lp-burger {
    display: none;
    flex-direction: column; gap: 4px;
    background: none; border: none; cursor: pointer; padding: 4px;
  }
  .lp-burger span { display: block; width: 20px; height: 0.5px; background: rgba(255,255,255,0.5); }

  /* ── HERO ── */
  .lp-hero {
    position: relative; z-index: 1;
    padding: 20vh 5vw 14vh;
    display: flex; flex-direction: column;
    max-width: 1100px;
  }

  .lp-hero-eyebrow {
    font-size: 0.55rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    margin-bottom: 1.8rem;
    animation: lpFadeUp 0.5s ease both;
  }

  .lp-hero-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(2.6rem, 7.5vw, 6.5rem);
    line-height: 1.0;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    color: #fff;
    max-width: 18ch;
    margin-bottom: 2.5rem;
    animation: lpFadeUp 0.5s 0.05s ease both;
  }

  .lp-hero-title em {
    font-style: normal;
    color: rgba(255,255,255,0.25);
  }

  .lp-hero-sub {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.3);
    max-width: 46ch;
    line-height: 1.9;
    margin-bottom: 3rem;
    animation: lpFadeUp 0.5s 0.1s ease both;
  }

  .lp-hero-actions {
    display: flex; align-items: center; gap: 1.4rem;
    animation: lpFadeUp 0.5s 0.15s ease both;
  }

  .lp-btn-primary {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(74,222,128,0.9);
    border: 0.5px solid rgba(74,222,128,0.35);
    background: none;
    padding: 0.75rem 1.8rem;
    text-decoration: none;
    transition: all 0.15s;
    display: inline-block;
  }
  .lp-btn-primary:hover { color: #4ade80; border-color: rgba(74,222,128,0.7); }

  .lp-btn-ghost {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    border: 0.5px solid rgba(255,255,255,0.12);
    background: none;
    padding: 0.75rem 1.8rem;
    text-decoration: none;
    transition: all 0.15s;
    display: inline-block;
  }
  .lp-btn-ghost:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.35); }

  /* ── STATS ── */
  .lp-stats {
    position: relative; z-index: 1;
    display: flex; gap: 0;
    border-top: 0.5px solid rgba(255,255,255,0.07);
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    animation: lpFadeUp 0.5s 0.2s ease both;
  }

  .lp-stat {
    flex: 1;
    padding: 2.8rem 5vw;
    border-right: 0.5px solid rgba(255,255,255,0.07);
    display: flex; flex-direction: column; gap: 0.4rem;
  }
  .lp-stat:last-child { border-right: none; }

  .lp-stat-value {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(1.8rem, 3.5vw, 3rem);
    color: #fff;
    line-height: 1;
  }
  .lp-stat-label {
    font-size: 0.55rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }

  /* ── SECTION WRAPPER ── */
  .lp-section {
    position: relative; z-index: 1;
    padding: 10vh 5vw;
    max-width: 1100px;
    margin: 0 auto;
  }

  .lp-section-eyebrow {
    font-size: 0.52rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    margin-bottom: 3.5rem;
  }

  .lp-section-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(1.8rem, 4vw, 3.2rem);
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: #fff;
    max-width: 20ch;
    line-height: 1.05;
    margin-bottom: 4rem;
  }

  /* ── STEPS ── */
  .lp-steps {
    display: flex; flex-direction: column; gap: 0;
  }

  .lp-step {
    display: grid;
    grid-template-columns: 4rem 1fr;
    gap: 0 2rem;
    padding: 2rem 0;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
    transition: background 0.2s;
    cursor: default;
  }
  .lp-step:first-child { border-top: 0.5px solid rgba(255,255,255,0.06); }
  .lp-step:hover .lp-step-title { color: #fff; }

  .lp-step-num {
    font-size: 0.52rem;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.2);
    padding-top: 0.1rem;
    font-family: 'DM Mono', monospace;
  }

  .lp-step-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(1rem, 2vw, 1.4rem);
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    margin-bottom: 0.5rem;
    transition: color 0.15s;
  }

  .lp-step-desc {
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25);
    line-height: 1.8;
    max-width: 52ch;
  }

  /* ── FEATURES ── */
  .lp-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0;
    border: 0.5px solid rgba(255,255,255,0.07);
  }

  .lp-feature {
    padding: 3rem 2.5rem;
    border-right: 0.5px solid rgba(255,255,255,0.07);
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    transition: background 0.2s;
  }
  .lp-feature:hover { background: rgba(255,255,255,0.02); }

  .lp-feature-key {
    font-size: 0.52rem;
    letter-spacing: 0.22em;
    color: rgba(255,255,255,0.18);
    margin-bottom: 1.4rem;
    display: block;
  }

  .lp-feature-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
    text-transform: uppercase;
    color: rgba(255,255,255,0.75);
    margin-bottom: 0.7rem;
    line-height: 1.1;
  }

  .lp-feature-desc {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25);
    line-height: 1.85;
  }

  /* ── CTA BAND ── */
  .lp-cta-band {
    position: relative; z-index: 1;
    padding: 10vh 5vw;
    border-top: 0.5px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 3rem;
    flex-wrap: wrap;
  }

  .lp-cta-band-title {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: clamp(2rem, 5vw, 4rem);
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: #fff;
    max-width: 18ch;
    line-height: 1.05;
  }
  .lp-cta-band-title em { font-style: normal; color: rgba(255,255,255,0.25); }

  /* ── FOOTER ── */
  .lp-footer {
    position: relative; z-index: 1;
    padding: 2rem 5vw;
    border-top: 0.5px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .lp-footer p {
    font-size: 0.52rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.15);
  }

  /* Mobile drawer */
  .lp-mobile-menu {
    position: fixed;
    top: 0; right: 0; bottom: 0; width: 100%;
    background: #000;
    z-index: 200;
    display: flex; flex-direction: column;
    padding: 5vh 5vw;
    animation: lpSlideIn 0.25s ease both;
  }
  .lp-mobile-close {
    background: none; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); align-self: flex-end; margin-bottom: 4rem;
    transition: color 0.15s;
  }
  .lp-mobile-close:hover { color: #fff; }

  .lp-mobile-links {
    display: flex; flex-direction: column; gap: 2rem; flex: 1;
  }
  .lp-mobile-links a {
    font-family: 'Barlow', sans-serif;
    font-weight: 800;
    font-size: 2rem;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    transition: color 0.15s;
  }
  .lp-mobile-links a:hover { color: #fff; }

  @keyframes lpFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lpSlideIn {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  @media (max-width: 640px) {
    .lp-nav-links, .lp-nav-actions { display: none; }
    .lp-burger { display: flex; }
    .lp-stats { flex-direction: column; }
    .lp-stat { border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    .lp-features { grid-template-columns: 1fr; }
    .lp-cta-band { flex-direction: column; align-items: flex-start; }
    .lp-footer { flex-direction: column; }
  }
`;

const features = [
  {
    key: "A",
    title: "AI-Powered Assessments",
    desc: "Role-specific questions calibrated to your experience level and target companies.",
  },
  {
    key: "B",
    title: "Intelligent Roadmaps",
    desc: "A dynamic study plan that locks onto weak areas first and adapts as you improve.",
  },
  {
    key: "C",
    title: "Mock Interviews",
    desc: "Simulate real interview conditions with instant AI feedback on every answer.",
  },
];

const navLinks = ["Roadmap", "Practice", "Assessments", "Resources"];
const stats = [
  { value: "50k+", label: "Candidates Prepared" },
  { value: "92%", label: "Satisfaction Rate" },
  { value: "1,200+", label: "Daily Challenges" },
];

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.onscroll = () => setScrolled(window.scrollY > 20);
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">
        <div className="lp-glow" />

        {/* Nav */}
        <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
          <Link href="/" className="lp-logo">
            Prepify
          </Link>
          <ul className="lp-nav-links">
            {navLinks.map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
          <div className="lp-nav-actions">
            <Link href="/login" className="lp-nav-login">
              Log In
            </Link>
            <Link href="/login" className="lp-nav-cta">
              Get Started →
            </Link>
          </div>
          <button
            className="lp-burger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lp-mobile-menu">
            <button
              className="lp-mobile-close"
              onClick={() => setMobileOpen(false)}
            >
              Close ×
            </button>
            <div className="lp-mobile-links">
              {navLinks.map((l) => (
                <a key={l} href="#" onClick={() => setMobileOpen(false)}>
                  {l}
                </a>
              ))}
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Log In
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="lp-hero">
          <p className="lp-hero-eyebrow">Technical Interview Preparation</p>
          <h1 className="lp-hero-title">
            Master Your Next
            <br />
            <em>Technical</em>
            <br />
            Interview
          </h1>
          <p className="lp-hero-sub">
            AI assesses your engineering profile, identifies every gap, and
            builds a bespoke roadmap that adapts in real time as you improve.
          </p>
          <div className="lp-hero-actions">
            <Link href="/login" className="lp-btn-primary">
              Start Assessment →
            </Link>
            <Link href="/login" className="lp-btn-ghost">
              Mock Interview
            </Link>
          </div>
        </section>

        {/* Stats */}
        <div className="lp-stats" style={{ position: "relative", zIndex: 1 }}>
          {stats.map((s) => (
            <div key={s.label} className="lp-stat">
              <span className="lp-stat-value">{s.value}</span>
              <span className="lp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="lp-section">
          <p className="lp-section-eyebrow">How It Works</p>
          <h2 className="lp-section-title">Three Steps to Interview Mastery</h2>
          <div className="lp-steps">
            {[
              {
                n: "01",
                title: "Create Your Profile",
                desc: "Tell us your role, years of experience, and target companies. Two minutes. That's it.",
              },
              {
                n: "02",
                title: "Get Your Roadmap",
                desc: "Our AI maps exactly what you need to study based on your profile, gaps, and blind spots.",
              },
              {
                n: "03",
                title: "Practice & Improve",
                desc: "Daily challenges, mock interviews, and AI feedback accelerate progress toward your offer.",
              },
            ].map((s) => (
              <div key={s.n} className="lp-step">
                <span className="lp-step-num">{s.n}</span>
                <div>
                  <p className="lp-step-title">{s.title}</p>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="lp-section" style={{ paddingTop: 0 }}>
          <p className="lp-section-eyebrow">Features</p>
          <h2 className="lp-section-title">
            Everything You Need to Land the Job
          </h2>
          <div className="lp-features">
            {features.map((f) => (
              <div key={f.key} className="lp-feature">
                <span className="lp-feature-key">{f.key}</span>
                <p className="lp-feature-title">{f.title}</p>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Band */}
        <div className="lp-cta-band">
          <h2 className="lp-cta-band-title">
            Ready to Ace
            <br />
            <em>Your Next</em>
            <br />
            Interview?
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              alignItems: "flex-start",
            }}
          >
            <p
              style={{
                fontSize: "0.58rem",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              Join 50,000+ engineers — Google, Meta, and more.
            </p>
            <Link href="/login" className="lp-btn-primary">
              Get Started — It&apos;s Free →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="lp-footer">
          <p>© 2026 Prepify. Built for engineers, by engineers.</p>
          <p style={{ color: "rgba(255,255,255,0.08)" }}>
            Assessment · Roadmap · Practice
          </p>
        </footer>
      </div>
    </>
  );
}
