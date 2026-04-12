import {
  generateAssessmentQuestionsWithGroq,
  type AssessmentQuestion,
} from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeRoleName(value: string | null): string {
  if (!value) return "Frontend Developer";

  const input = value.trim().toLowerCase();

  if (input.includes("frontend")) return "Frontend Developer";
  if (input.includes("backend")) return "Backend Developer";
  if (input.includes("full") && input.includes("stack")) {
    return "Full Stack Developer";
  }
  if (input.includes("devops") || input.includes("sre")) return "DevOps / SRE";
  if (input.includes("qa") || input.includes("test")) return "QA / Test Engineer";

  return value;
}

async function fetchTenQuestions(params: {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
}): Promise<AssessmentQuestion[]> {
  const desiredCount = 10;
  const maxAttempts = 4;
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
    const roleName = normalizeRoleName(
      searchParams.get("roleName") ?? searchParams.get("role"),
    );
    const experienceLevel =
      searchParams.get("experienceLevel") ??
      searchParams.get("experience") ??
      "mid";
    const parsedYears = Number(
      searchParams.get("experienceYears") ?? searchParams.get("years") ?? 3,
    );
    const experienceYears = Number.isFinite(parsedYears) ? parsedYears : 3;

    const questions = await fetchTenQuestions({
      roleName,
      experienceLevel,
      experienceYears,
    });

    return Response.json(
      {
        questions,
        meta: {
          source: "groq",
          generatedAt: new Date().toISOString(),
          roleName,
          experienceLevel,
          experienceYears,
        },
      },
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
