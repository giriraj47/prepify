"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  {
    icon: "🧠",
    title: "AI-Powered Assessments",
    desc: "Get personalized questions based on your role, experience, and weak areas.",
  },
  {
    icon: "🗺️",
    title: "Intelligent Roadmaps",
    desc: "A dynamic study plan that adapts as you improve — no generic prep plans.",
  },
  {
    icon: "🎤",
    title: "Mock Interviews",
    desc: "Simulate real interview conditions with AI feedback on your answers.",
  },
];

const stats = [
  { value: "50k+", label: "Candidates Prepared" },
  { value: "92%", label: "Satisfaction Rate" },
  { value: "1,200+", label: "Daily Challenges Completed" },
];

const navLinks = ["Roadmap", "Practice", "Assessments", "Resources"];

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f2fa] font-sans">
      {/* ── NAV ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#f0f2fa]/90 backdrop-blur-md border-b border-indigo-100">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <span className="text-[#1a2bcc] font-extrabold text-xl tracking-tight select-none">
            Prepify
          </span>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a
                key={l}
                href="#"
                className="text-sm font-medium text-gray-500 hover:text-[#1a2bcc] transition-colors"
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 hover:text-[#1a2bcc] transition-colors px-2 py-1"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="bg-[#1a2bcc] hover:bg-[#1420a8] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-indigo-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-indigo-50"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-indigo-100 bg-white px-6 py-4 space-y-3">
            {navLinks.map((l) => (
              <a key={l} href="#" className="block text-sm font-medium text-gray-600 hover:text-[#1a2bcc]">
                {l}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-sm text-center font-semibold text-gray-700 hover:text-[#1a2bcc]">
                Log In
              </Link>
              <Link
                href="/login"
                className="text-sm text-center bg-[#1a2bcc] text-white font-bold px-5 py-2.5 rounded-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 text-center pt-24 pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#2feecb]/20 border border-[#2feecb]/40 text-[#0a6657] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0a6657] inline-block" />
          The Future of Prep
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-[#0e1135] leading-tight tracking-tight mb-6">
          Master Your Technical<br className="hidden md:block" /> Interviews with AI
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Our platform assesses your unique engineering profile to identify weak points
          and builds a bespoke, intelligent roadmap to get you hired at top-tier firms.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            id="cta-start-assessment"
            className="bg-[#1a2bcc] hover:bg-[#1420a8] text-white font-bold px-8 py-4 rounded-2xl transition-all text-base shadow-xl shadow-indigo-300/40 hover:scale-105 active:scale-95"
          >
            Start Your Assessment
          </Link>
          <Link
            href="/login"
            id="cta-mock-interview"
            className="bg-white hover:bg-indigo-50 text-gray-800 font-bold px-8 py-4 rounded-2xl transition-all text-base border border-gray-200 shadow-sm hover:border-indigo-300"
          >
            Mock Interview
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-[#1a2bcc]">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-indigo-100">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1a2bcc] text-center mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0e1135] text-center mb-14">
            Three steps to interview mastery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                desc: "Tell us your role, experience level, and target companies. Takes 2 minutes.",
              },
              {
                step: "02",
                title: "Get Your Roadmap",
                desc: "Our AI maps out exactly what you need to study based on your profile and gaps.",
              },
              {
                step: "03",
                title: "Practice & Improve",
                desc: "Daily challenges, mock interviews, and AI feedback accelerate your progress.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-2xl border border-indigo-100 bg-[#f8f9fe] hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <p className="text-5xl font-extrabold text-indigo-100 mb-4 select-none">{item.step}</p>
                <h3 className="text-lg font-bold text-[#0e1135] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2bcc] text-center mb-3">
          Features
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0e1135] text-center mb-14">
          Everything you need to land the job
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-[#0e1135] text-lg mb-2 group-hover:text-[#1a2bcc] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="bg-[#1a2bcc] py-20 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Ready to ace your next interview?
        </h2>
        <p className="text-indigo-200 mb-8 text-base max-w-xl mx-auto">
          Join 50,000+ engineers who used Prepify to land roles at Google, Meta, and more.
        </p>
        <Link
          href="/login"
          id="cta-banner-get-started"
          className="inline-block bg-white text-[#1a2bcc] font-extrabold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all text-base shadow-xl hover:scale-105 active:scale-95"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#0e1135] text-gray-400 text-sm text-center py-8">
        <p>© 2026 Prepify. Built for engineers, by engineers.</p>
      </footer>
    </div>
  );
}
