"use client";

import Link from "next/link";
import { useState } from "react";

import "./landing.css";

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
          <div className="lp-cta-band-side">
            <p className="lp-cta-band-sub">
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
