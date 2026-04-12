"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoiceTranscriptionButton, VoiceWaveform } from "@/app/components/shared/VoiceTranscription";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

  .iv-root {
    position: fixed; inset: 0;
    background: #000;
    color: #fff;
    font-family: 'DM Mono', monospace;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .iv-glow {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 58% at 60% 48%, rgba(10,62,55,0.5) 0%, rgba(5,28,26,0.24) 40%, transparent 66%),
      radial-gradient(ellipse 26% 20% at 14% 78%, rgba(4,22,35,0.28) 0%, transparent 55%);
  }

  /* ── Nav ── */
  .iv-nav {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.4rem 5vw;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }

  .iv-nav-logo {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 1rem; letter-spacing: 0.06em; text-transform: uppercase; color: #fff;
    text-decoration: none;
  }

  .iv-nav-meta {
    display: flex; align-items: center; gap: 2rem;
  }

  .iv-nav-type {
    font-size: 0.52rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }

  .iv-nav-back {
    font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.75);; background: none; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace; transition: color 0.15s; padding: 0;
  }
  .iv-nav-back:hover { color: rgba(255,255,255,0.6); }

  /* ── Body ── */
  .iv-body {
    position: relative; z-index: 1;
    flex: 1; overflow: hidden;
    display: flex; flex-direction: column;
    padding: 5vh 5vw 3vh;
  }

  /* ── Question ── */
  .iv-question {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 42px;
    line-height: 1.07; letter-spacing: -0.01em; text-transform: uppercase;
    color: #cdcdcdff; max-width: 90%;
    margin-bottom: auto;
    animation: ivFadeUp 0.4s ease both;
  }

  .iv-follow-up {
    margin-top: 1.4rem;
    padding-left: 1.2rem;
    border-left: 0.5px solid rgba(74,222,128,0.3);
    animation: ivFadeUp 0.4s 0.06s ease both;
  }
  .iv-follow-up-label {
    font-size: 0.48rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(74,222,128,0.45); margin-bottom: 0.35rem; display: block;
  }
  .iv-follow-up-text {
    font-size: 0.62rem; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.3); line-height: 1.75; max-width: 50ch;
  }

  /* ── Textarea zone ── */
  .iv-input-zone {
    margin-top: 9vh;
    border-top: 0.5px solid rgba(255,255,255,0.06);
    padding-top: 2.2vh;
    display: flex; flex-direction: column; gap: 1.2rem;
    animation: ivFadeUp 0.4s 0.1s ease both;
  }

  .iv-textarea-wrap { position: relative; }

  .iv-textarea {
    width: 100%;
    min-height: 300px;
    max-height : 600px;
    background: rgba(255,255,255,0.02);
    border: 0.5px solid rgba(255,255,255,0.1);
    font-family: 'DM Mono', monospace;
    font-size: 1rem; letter-spacing: 0.06em;
    color: rgba(255,255,255,0.7);
    padding: 1.2rem 3.5rem 1.2rem 1.2rem;
    resize: none; outline: none;
    transition: border-color 0.15s, background 0.15s;
    line-height: 1.8;
  }
  .iv-textarea::placeholder { color: rgba(255, 255, 255, 0.51); }
  .iv-textarea:focus {
    border-color: rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.03);
  }
  .iv-textarea:disabled { opacity: 0.4; cursor: not-allowed; }

  .iv-voice-btn-wrap {
    position: absolute; bottom: 0.9rem; right: 0.9rem;
  }
  .iv-voice-wave-wrap {
    position: absolute; bottom: 1rem; left: 1rem;
  }

  /* ── Bottom bar ── */
  .iv-bottom {
    display: flex; align-items: center; justify-content: space-between;
    animation: ivFadeUp 0.4s 0.14s ease both;
  }

  .iv-counter {
    font-size: 0.52rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }

  .iv-submit-btn {
    background: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
    padding: 0.65rem 1.8rem;
    border: 0.5px solid rgba(74,222,128,0.35);
    color: rgba(74,222,128,0.85);
    transition: all 0.15s;
  }
  .iv-submit-btn:not(:disabled):hover {
    border-color: rgba(74,222,128,0.7);
    color: #4ade80;
  }
  .iv-submit-btn:disabled {
    border-color: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.2);
    cursor: not-allowed;
  }

  /* ── Progress dots ── */
  .iv-progress {
    display: flex; align-items: center; gap: 0.5rem;
  }
  .iv-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.1);
    transition: background 0.2s;
  }
  .iv-dot--done  { background: rgba(74,222,128,0.6); }
  .iv-dot--active { background: rgba(255,255,255,0.6); }

  /* ── Circular progress ── */
  .iv-ring {
    position: fixed; bottom: 2.2rem; right: 3rem; z-index: 10;
  }
  .iv-ring-label {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.52rem; color: rgba(255,255,255,0.4); letter-spacing: 0.05em;
  }

  /* ── States ── */
  .iv-center {
    position: fixed; inset: 0; background: #000;
    display: flex; align-items: center; justify-content: center; z-index: 50;
  }
  .iv-center p {
    font-family: 'DM Mono', monospace; font-size: 0.62rem;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    animation: ivPulse 1.6s ease-in-out infinite;
  }

  @keyframes ivPulse { 0%,100%{opacity:0.25} 50%{opacity:0.75} }
  @keyframes ivFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function InterviewPage() {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function startInterview() {
      try {
        const res = await fetch("/api/interview/start", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start interview.");
        setQuestions(data.questions);
        setSessionId(data.sessionId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    startInterview();
  }, []);

  const handleTranscript = (transcript: string) => {
    setResponse((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n");
      return prev + (needsSpace ? " " : "") + transcript;
    });
    setInterimTranscript("");
  };

  const handleSubmit = async () => {
    if (!sessionId || !questions[currentIndex] || submitting) return;
    setSubmitting(true);
    const isLast = currentIndex === questions.length - 1;
    const q = questions[currentIndex];
    try {
      await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, questionIndex: currentIndex,
          questionText: q.question, questionType: q.type,
          transcript: response, durationSeconds: 0,
        }),
      });
      if (isLast) {
        await fetch("/api/interview/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, currentQuestionIndex: currentIndex, status: "completed" }),
        });
        router.push("/dashboard");
      } else {
        const next = currentIndex + 1;
        await fetch("/api/interview/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, currentQuestionIndex: next }),
        });
        setCurrentIndex(next);
        setResponse("");
        setInterimTranscript("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="iv-center"><p>Preparing your interview…</p></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{CSS}</style>
        <div className="iv-center">
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "rgba(250,80,80,0.65)", marginBottom: "1.5rem", fontSize: "0.62rem", letterSpacing: "0.12em" }}>{error}</p>
            <button
              onClick={() => router.push("/")}
              style={{ background: "none", border: "0.5px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", padding: "0.55rem 1.2rem", transition: "all 0.15s" }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!questions.length || !questions[currentIndex]) return null;

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const displayValue = isListening && interimTranscript
    ? response + (response.length > 0 && !response.endsWith(" ") ? " " : "") + interimTranscript
    : response;

  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - (currentIndex + 1) / questions.length);

  return (
    <>
      <style>{CSS}</style>
      <div className="iv-root">
        <div className="iv-glow" />

        {/* Nav */}
        <nav className="iv-nav">
          <a href="/" className="iv-nav-logo">Prepify</a>
          <div className="iv-nav-meta">
            <span className="iv-nav-type">
              {q.type?.replace(/_/g, " ")} Interview
            </span>
            <button className="iv-nav-back" onClick={() => router.push("/")}>← Exit</button>
          </div>
        </nav>

        {/* Body */}
        <div className="iv-body">
          {/* Question */}
          <div key={currentIndex}>
            <h1 className="iv-question">{q.question}</h1>
            {q.follow_up && (
              <div className="iv-follow-up">
                <span className="iv-follow-up-label">Consider also</span>
                <p className="iv-follow-up-text">{q.follow_up}</p>
              </div>
            )}
          </div>

          {/* Input zone */}
          <div className="iv-input-zone">
            <div className="iv-textarea-wrap">
              <textarea
                className="iv-textarea"
                rows={6}
                placeholder="Type or dictate your response…"
                value={displayValue}
                onChange={(e) => setResponse(e.target.value)}
                disabled={submitting}
              />
              {/* <div className="iv-voice-wave-wrap">
                <VoiceWaveform isVisible={isListening} />
              </div> */}
              <div className="iv-voice-btn-wrap">
                <VoiceTranscriptionButton
                  onTranscript={handleTranscript}
                  onInterimTranscript={setInterimTranscript}
                  onListeningChange={setIsListening}
                />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="iv-bottom">
              <div className="iv-progress">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`iv-dot ${i < currentIndex ? "iv-dot--done" : i === currentIndex ? "iv-dot--active" : ""}`}
                  />
                ))}
              </div>
              <button
                className="iv-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || (!response.trim() && !isListening)}
              >
                {submitting ? "Processing…" : isLast ? "Finish Interview →" : "Submit & Continue →"}
              </button>
            </div>
          </div>
        </div>

        {/* Circular progress */}
        <div className="iv-ring">
          <svg width="64" height="64" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              transform="rotate(-90 36 36)"
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </svg>
          <div className="iv-ring-label">{currentIndex + 1}/{questions.length}</div>
        </div>
      </div>
    </>
  );
}
