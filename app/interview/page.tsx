"use client";

import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

export default function InterviewPage() {
  const [response, setResponse] = useState("");
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("web-speech-cognitive-services").then(({ createSpeechServicesPonyfill }) => {
        const region = (
          process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || ""
        )
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "");

        if (region && process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY) {
          const ponyfillFactory = createSpeechServicesPonyfill({
            credentials: {
              region: region,
              subscriptionKey: (process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || "").trim(),
            },
          });
          SpeechRecognition.applyPolyfill(ponyfillFactory.SpeechRecognition);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!listening && transcript) {
      setResponse((prev) => {
        const needsSpace =
          prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n");
        return prev + (needsSpace ? " " : "") + transcript;
      });
      resetTranscript();
    }
  }, [listening, transcript, resetTranscript]);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (listening) {
      SpeechRecognition.stopListening();
      resetTranscript();
    }
    setResponse(e.target.value);
  };

  const displayValue =
    listening && transcript
      ? response +
        (response.length > 0 && !response.endsWith(" ") && !response.endsWith("\n")
          ? " "
          : "") +
        transcript
      : response;

  return (
    <main className="min-h-screen bg-[#121315] px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            System Design Patterns
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Describe the trade-offs between choosing Optimistic Locking versus{" "}
            Pessimistic Locking in a high-concurrency e-commerce application.
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-400">
            Focus on data integrity, latency, and scalability.
          </p>
        </section>

        <section className="rounded-4xl bg-[#171a20] p-8 shadow-[0_32px_64px_-32px_rgba(0,0,0,0.24)]">
          <div className="rounded-[1.75rem] bg-[#23252b] p-6">
            <div className="relative">
              <textarea
                id="response"
                name="response"
                rows={14}
                placeholder="Type your response here..."
                value={displayValue}
                onChange={handleTextChange}
                className="min-h-85 w-full resize-none rounded-3xl bg-[#121315] px-6 py-5 pr-16 text-base text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#c0c1ff]/20"
              />

              {listening && (
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                  <div className="flex h-5 items-end gap-[3px]">
                    {[12, 16, 20, 14, 18, 12, 16].map((height, i) => (
                      <div
                        key={i}
                        className="animate-waveform w-[3px] rounded-full bg-[#10b981]"
                        style={{
                          height: `${height}px`,
                          animationDelay: `${i * 0.12}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium tracking-wide text-[#10b981]">
                    Recording...
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={toggleListening}
                className={`pointer-events-auto absolute bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center transition ${
                  listening
                    ? "rounded-full bg-[#064e3b] hover:bg-[#065f46]"
                    : "rounded-2xl bg-[#0f172a] text-[#44e2cd] shadow-[0_20px_40px_-24px_rgba(68,226,205,0.65)] hover:bg-[#1a2332]"
                }`}
              >
                {listening ? (
                  <div className="h-3.5 w-3.5 rounded-[2px] bg-[#10b981]" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6"
                  >
                    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7.5a1 1 0 0 0 1-1V16h-2v1.5a1 1 0 0 0 1 1Zm0-14a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#c0c1ff] via-[#9ca1ff] to-[#8083ff] px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-[0_25px_60px_-40px_rgba(56,189,248,0.6)] transition hover:brightness-110"
            >
              Submit Response
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
