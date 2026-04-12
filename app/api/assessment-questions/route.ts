import {
  generateAssessmentQuestionsWithGroq,
  type AssessmentQuestion,
} from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchTenQuestions(params: {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
}): Promise<AssessmentQuestion[]> {
  const desiredCount = 10;
  const maxAttempts = 3;
  const collected: AssessmentQuestion[] = [];
  const seen = new Set<string>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (collected.length >= desiredCount) break;
    const { questions } = await generateAssessmentQuestionsWithGroq(params);
    if (!Array.isArray(questions)) continue;

    for (const q of questions) {
      if (collected.length >= desiredCount) break;
      const text = q?.question_text?.trim();
      if (!text || seen.has(text)) continue;
      if (!Array.isArray(q.options) || q.options.length !== 4) continue;
      if (!["A", "B", "C", "D"].includes(q.correct_answer)) continue;
      seen.add(text);
      collected.push(q);
    }
  }

  if (collected.length < desiredCount) {
    throw new Error("Groq returned fewer than 10 valid questions.");
  }

  return collected.slice(0, desiredCount);
}

export async function GET(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing on the server.");
    }

    const { searchParams } = new URL(request.url);
    const roleName = searchParams.get("roleName") ?? "Frontend Developer";
    const experienceLevel = searchParams.get("experienceLevel") ?? "mid";
    const experienceYears = Number(searchParams.get("experienceYears") ?? 3);

    const questions = await fetchTenQuestions({
      roleName,
      experienceLevel,
      experienceYears: Number.isFinite(experienceYears) ? experienceYears : 3,
    });

    return Response.json(
      { questions },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate questions.";
    console.error("Assessment question generation failed:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
