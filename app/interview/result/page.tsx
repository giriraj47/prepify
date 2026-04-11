"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    async function evaluateInterview() {
      try {
        const res = await fetch("/api/interview/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        console.log("Evaluation API Response:", data);
        if (!res.ok) {
          throw new Error(data.error || "Failed to evaluate interview.");
        }

        // If returned success but no evaluation (e.g., already evaluated), we could fetch the session instead.
        // Actually, our API returns the evaluation even if it evaluates it right then.
        // Wait, if it was already evaluated, it returns { success: true, evaluated: true }.
        // Let's handle that by just refetching the session or showing a generic success.
        // For right now, let's just assume we get the evaluation.
        if (data.evaluated && !data.evaluation) {
           setError("Interview was already evaluated. Check your profile for past results.");
        } else {
           setEvaluation(data.evaluation);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    evaluateInterview();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <div className="w-16 h-16 border-4 border-t-[#c0c1ff] border-slate-700 rounded-full animate-spin"></div>
        <p className="text-xl font-medium text-slate-300 animate-pulse">
          AI is analysing your responses...
        </p>
        <p className="text-sm text-slate-500 max-w-md text-center">
          This could take up to a minute depending on the length of your answers. Hang tight while we prepare your personalised feedback.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl">!</div>
        <p className="text-xl font-medium text-red-400">{error}</p>
        <Link 
          href="/"
          className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!evaluation) return null;

  const { overall, responses } = evaluation;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
          Interview Results
        </h1>
        <p className="text-slate-400">
          We've reviewed your answers. Here is how you did!
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 rounded-3xl bg-[#171a20] p-8 shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 rounded-full border-8 border-[#44e2cd] flex items-center justify-center flex-col">
             <span className="text-4xl font-bold text-white">{overall?.score || 0}</span>
             <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <p className="text-2xl font-semibold text-[#c0c1ff]">Grade: {overall?.grade || "N/A"}</p>
        </div>
        <div className="col-span-1 md:col-span-2 rounded-3xl bg-[#171a20] p-8 shadow-xl">
           <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
           <p className="text-slate-300 leading-relaxed">{overall?.summary}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="rounded-3xl bg-[#171a20] p-8 shadow-xl">
           <h3 className="text-lg font-semibold text-[#44e2cd] mb-4">Strong Areas</h3>
           <ul className="space-y-2 list-disc pl-5 text-slate-300">
             {overall?.strong_areas?.map((area: string, i: number) => (
               <li key={i}>{area}</li>
             ))}
           </ul>
         </div>
         <div className="rounded-3xl bg-[#171a20] p-8 shadow-xl">
           <h3 className="text-lg font-semibold text-red-400 mb-4">Areas to Improve</h3>
           <ul className="space-y-2 list-disc pl-5 text-slate-300">
             {overall?.weak_areas?.map((area: string, i: number) => (
               <li key={i}>{area}</li>
             ))}
           </ul>
         </div>
      </section>

      <section className="rounded-3xl bg-[#171a20] p-8 shadow-xl">
         <h3 className="text-xl font-semibold text-white mb-6">Recommendations</h3>
         <div className="space-y-4">
           {overall?.recommendations?.map((rec: string, i: number) => (
             <div key={i} className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-[#23252b] flex items-center justify-center shrink-0 text-[#c0c1ff]">{i + 1}</div>
               <p className="text-slate-300 pt-1">{rec}</p>
             </div>
           ))}
         </div>
      </section>

      {responses && responses.length > 0 && (
        <section className="space-y-6 pt-8 pb-16">
          <h2 className="text-2xl font-semibold text-white">Question Breakdown</h2>
          <div className="space-y-6">
            {responses.map((resp: any, idx: number) => (
              <div key={idx} className="rounded-2xl bg-[#171a20] p-6 border border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg text-white font-medium">Question {resp.question_index + 1}</h4>
                  <span className="px-3 py-1 bg-[#23252b] rounded-lg text-[#44e2cd] font-medium text-sm">
                    Score: {resp.score} / 100
                  </span>
                </div>
                <p className="text-slate-300 mb-6 bg-[#23252b] p-4 rounded-xl">{resp.feedback}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm uppercase tracking-wider text-slate-500 mb-2 font-semibold">Strong Points</h5>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                      {resp.strong_points?.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm uppercase tracking-wider text-slate-500 mb-2 font-semibold">Weak Points</h5>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                      {resp.weak_points?.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-center pb-20">
        <Link 
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#c0c1ff] via-[#9ca1ff] to-[#8083ff] px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-[0_25px_60px_-40px_rgba(56,189,248,0.6)] transition hover:brightness-110"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function InterviewResultPage() {
  return (
    <main className="min-h-screen bg-[#121315] px-6 py-20 text-white">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-t-[#c0c1ff] border-slate-700 rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading results...</p>
        </div>
      }>
        <ResultContent />
      </Suspense>
    </main>
  );
}
