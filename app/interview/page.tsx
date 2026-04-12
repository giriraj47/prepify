"use client";

import { useState, useRef, useEffect } from "react";

export default function InterviewPage() {
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition: SpeechRecognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              setResponse((prev) => prev + transcript + " ");
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          setIsListening(false);
          setTranscript("");
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
  };

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
                value={response + transcript}
                onChange={handleTextChange}
                className="min-h-85 w-full resize-none rounded-3xl bg-[#121315] px-6 py-5 pr-16 text-base text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#c0c1ff]/20"
              />

              <button
                type="button"
                onClick={toggleListening}
                className={`pointer-events-auto absolute bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[#44e2cd] shadow-[0_20px_40px_-24px_rgba(68,226,205,0.65)] transition ${
                  isListening
                    ? "bg-[#44e2cd] text-slate-950"
                    : "bg-[#0f172a] hover:bg-[#1a2332]"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7.5a1 1 0 0 0 1-1V16h-2v1.5a1 1 0 0 0 1 1Zm0-14a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1Z" />
                </svg>
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
