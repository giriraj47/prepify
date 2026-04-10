"use client";

import { useRef, useEffect, useState } from "react";
import { VoiceTranscriptionButton, VoiceWaveform } from "@/app/components/shared/VoiceTranscription";

interface QuestionContentProps {
  question: {
    question_text: string;
    topic: string;
    expected_points: string[];
  };
  currentIndex: number;
  currentAnswer: string;
  syncStatus: "idle" | "saving" | "synced";
  submitted: boolean;
  onAnswerChange: (value: string) => void;
}

export function QuestionContent({
  question,
  currentIndex,
  currentAnswer,
  syncStatus,
  submitted,
  onAnswerChange,
}: QuestionContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const handleVoiceTranscript = (transcript: string) => {
    onAnswerChange(
      (currentAnswer || "") +
        ((currentAnswer || "").length > 0 && !(currentAnswer || "").endsWith(" ") ? " " : "") +
        transcript
    );
    setInterimTranscript("");
  };

  const displayValue =
    isListening && interimTranscript
      ? (currentAnswer || "") +
        ((currentAnswer || "").length > 0 && !(currentAnswer || "").endsWith(" ") ? " " : "") +
        interimTranscript
      : currentAnswer || "";

  // Auto-expand textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.max(textarea.scrollHeight, 160) + "px";
    };

    textarea.addEventListener("input", adjustHeight);
    adjustHeight(); // Initial adjustment

    return () => {
      textarea.removeEventListener("input", adjustHeight);
    };
  }, []);

  // Auto-adjust textarea height when content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.max(textarea.scrollHeight, 160) + "px";
    };

    setTimeout(adjustHeight, 0);
  }, [currentIndex, currentAnswer]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">
            Question {String(currentIndex + 1).padStart(2, "0")}
          </p>
          <div className="rounded-full inline-block border border-indigo-400/50 bg-gradient-to-r from-indigo-500/20 to-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100 shadow-lg shadow-indigo-500/10 mb-4">
            {question.topic}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-8 leading-relaxed">
        {question.question_text}
      </h2>

      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Your Analysis
          </p>
          <div className="flex items-center gap-2">
            {syncStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-xs text-yellow-400/80">
                <span className="animate-pulse">●</span>
                Saving...
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                <span>✓</span>
                Synced
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={submitted}
            placeholder="Begin typing your structured response here..."
            className="w-full rounded-xl border border-white/15 bg-[#0b1224] px-4 py-3 pr-14 text-sm text-white outline-none placeholder:text-white/40 focus:border-indigo-400/40 resize-none overflow-hidden"
            style={{
              minHeight: "160px",
              maxHeight: "400px",
            }}
          />

          <VoiceWaveform 
            isVisible={isListening} 
            className="absolute bottom-4 left-4 scale-75 origin-left" 
          />

          <VoiceTranscriptionButton
            onTranscript={handleVoiceTranscript}
            onInterimTranscript={setInterimTranscript}
            onListeningChange={setIsListening}
            className="absolute bottom-3 right-3 scale-90"
          />
        </div>
      </div>

      <p className="text-xs text-white/50 italic">
        Add diagrams or supporting data (optional) • Auto-saves locally every
        500ms, syncs to cloud after 3 seconds
      </p>
    </div>
  );
}
