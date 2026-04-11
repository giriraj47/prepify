"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoiceTranscriptionButton, VoiceWaveform } from "@/app/components/shared/VoiceTranscription";

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
        const res = await fetch("/api/interview/start", {
          method: "POST",
        });

        const data = await res.json();
        console.log("Start Interview API Response:", data);
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to start interview.");
        }

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
      const needsSpace =
        prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n");
      return prev + (needsSpace ? " " : "") + transcript;
    });
    setInterimTranscript("");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
  };

  const handleSubmit = async () => {
    if (!sessionId || !questions[currentIndex] || submitting) return;

    // To prevent rapid clicks
    setSubmitting(true);

    const isLastQuestion = currentIndex === questions.length - 1;
    const currentQuestion = questions[currentIndex];

    try {
      // 1. Submit response
      const responsePayload = {
          sessionId,
          questionIndex: currentQuestion.order_index,
          questionText: currentQuestion.question,
          questionType: currentQuestion.type,
          transcript: response,
          duration_seconds: 0, // Placeholder
      };
      
      const resVal = await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responsePayload),
      });

      const resData = await resVal.json();
      console.log("Submit Response API Result:", resData);

      if (!resVal.ok) {
        console.error("Failed to submit response", resData);
      }

      if (isLastQuestion) {
        // Update progress to completed
        const completionRes = await fetch("/api/interview/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            currentQuestionIndex: currentIndex,
            status: "completed",
          }),
        });
        const completionData = await completionRes.json();
        console.log("Completion Progress API Result:", completionData);

        // Redirect or show a completion screen
        router.push(`/interview/result?sessionId=${sessionId}`);
      } else {
        // Move to next question
        const nextIndex = currentIndex + 1;
        const progressRes = await fetch("/api/interview/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            currentQuestionIndex: nextIndex,
          }),
        });
        const progressData = await progressRes.json();
        console.log("Advance Progress API Result:", progressData);

        setCurrentIndex(nextIndex);
        setResponse(""); // Clear text area for next question
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
      <main className="min-h-screen bg-[#121315] px-6 py-20 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading interview environment...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#121315] px-6 py-20 text-white flex items-center justify-center">
        <div className="max-w-xl text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-slate-800 rounded-lg">Return to Dashboard</button>
        </div>
      </main>
    );
  }

  if (questions.length === 0 || !questions[currentIndex]) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const displayValue =
    isListening && interimTranscript
      ? response +
        (response.length > 0 && !response.endsWith(" ") && !response.endsWith("\n")
          ? " "
          : "") +
        interimTranscript
      : response;

  const typeDisplay = currentQuestion.type.replace(/_/g, " ");

  return (
    <main className="min-h-screen bg-[#121315] px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {typeDisplay} Question ({currentIndex + 1} / {questions.length})
            </p>
          </div>
          <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-white sm:text-4xl min-h-[5rem]">
            {currentQuestion.question}
          </h1>
          {currentQuestion.follow_up && (
            <p className="max-w-3xl text-sm leading-8 text-slate-400 border-l-2 border-[#44e2cd] pl-4">
              <span className="font-semibold text-slate-300 block mb-1">Follow up for consideration:</span>
              {currentQuestion.follow_up}
            </p>
          )}
        </section>

        <section className="rounded-4xl bg-[#171a20] p-8 shadow-[0_32px_64px_-32px_rgba(0,0,0,0.24)]">
          <div className="rounded-[1.75rem] bg-[#23252b] p-6">
            <div className="relative">
              <textarea
                id="response"
                name="response"
                rows={14}
                placeholder="Type or dictate your response here..."
                value={displayValue}
                onChange={handleTextChange}
                disabled={submitting}
                className="min-h-85 w-full resize-none rounded-3xl bg-[#121315] px-6 py-5 pr-16 text-base text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#c0c1ff]/20"
              />

              <VoiceWaveform 
                isVisible={isListening} 
                className="absolute bottom-6 left-6" 
              />

              <VoiceTranscriptionButton
                onTranscript={handleTranscript}
                onInterimTranscript={setInterimTranscript}
                onListeningChange={setIsListening}
                className="absolute bottom-5 right-5"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (!response.trim() && !isListening)}
              className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#c0c1ff] via-[#9ca1ff] to-[#8083ff] px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-[0_25px_60px_-40px_rgba(56,189,248,0.6)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Processing..." : (isLastQuestion ? "Finish Interview" : "Submit & Continue")}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
