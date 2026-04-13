"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoiceTranscriptionButton, VoiceWaveform } from "@/app/components/shared/VoiceTranscription";

import "./interview.css";

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
      <div className="iv-center"><p>Preparing your interview…</p></div>
    );
  }

  if (error) {
    return (
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
