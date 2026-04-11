import {
  generateAssessmentQuestions,
  type AssessmentQuestion,
} from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 86400;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const ROLE_SLUG_MAP: Record<string, string> = {
  "Frontend Developer": "frontend-developer",
  "Backend Developer": "backend-developer",
  "Full Stack Developer": "fullstack-developer",
  "DevOps / SRE": "devops-sre",
  "QA / Test Engineer": "qa-engineer",
};

function isFresh(iso?: string | null): boolean {
  if (!iso) return false;
  const ts = new Date(iso).getTime();
  return Number.isFinite(ts) && Date.now() - ts < CACHE_TTL_MS;
}

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
    const { questions } = await generateAssessmentQuestions(params);
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
    throw new Error("Gemini returned fewer than 10 valid questions.");
  }

  return collected.slice(0, desiredCount);
}

export async function GET(request: Request) {
  try {
    if (
      !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
      !process.env.GEMINI_API_KEY
    ) {
      throw new Error(
        "GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) is missing on the server.",
      );
    }

    const { searchParams } = new URL(request.url);
    const roleName = searchParams.get("roleName") ?? "Frontend Developer";
    const experienceLevel = searchParams.get("experienceLevel") ?? "mid";
    const experienceYears = Number(searchParams.get("experienceYears") ?? 3);

    const supabase = await createSupabaseServerClient();
    const roleSlug = ROLE_SLUG_MAP[roleName] ?? null;
    let roleId: string | null = null;
    if (roleSlug) {
      const { data: roleRow } = await supabase
        .from("roles")
        .select("id")
        .eq("slug", roleSlug)
        .maybeSingle();
      roleId = roleRow?.id ?? null;
    } else {
      const { data: roleRow } = await supabase
        .from("roles")
        .select("id")
        .eq("name", roleName)
        .maybeSingle();
      roleId = roleRow?.id ?? null;
    }

    if (roleId) {
      const { data: existing } = await supabase
        .from("question_sets")
        .select("id, questions, generated_at")
        .eq("role_id", roleId)
        .eq("experience_level", experienceLevel)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.questions && isFresh(existing.generated_at)) {
        return Response.json(
          { questions: existing.questions as AssessmentQuestion[] },
          {
            headers: {
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
          },
        );
      }
    }

    const questions = await fetchTenQuestions({
      roleName,
      experienceLevel,
      experienceYears: Number.isFinite(experienceYears) ? experienceYears : 3,
    });

    if (roleId) {
      await supabase.from("question_sets").insert({
        role_id: roleId,
        experience_level: experienceLevel,
        questions,
        generated_at: new Date().toISOString(),
      });
    }

    return Response.json(
      { questions },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
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
