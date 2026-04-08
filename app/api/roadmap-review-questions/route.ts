import {
  generateRoadmapReviewQuestions,
  type RoadmapReviewQuestion,
} from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const REVIEW_QUESTION_COUNT = 10;

function normalizeQuestions(
  questions: RoadmapReviewQuestion[] | undefined,
): RoadmapReviewQuestion[] {
  if (!Array.isArray(questions)) return [];

  return questions
    .filter((question) => {
      return (
        typeof question.question_text === "string" &&
        question.question_text.trim().length > 0 &&
        typeof question.topic === "string" &&
        question.topic.trim().length > 0 &&
        Array.isArray(question.expected_points) &&
        question.expected_points.length > 0
      );
    })
    .map((question) => ({
      question_text: question.question_text.trim(),
      topic: question.topic.trim(),
      expected_points: question.expected_points
        .map((point) => String(point).trim())
        .filter(Boolean)
        .slice(0, 5),
    }))
    .slice(0, REVIEW_QUESTION_COUNT);
}

function isValidStoredQuestions(
  value: unknown,
): value is RoadmapReviewQuestion[] {
  if (!Array.isArray(value) || value.length < REVIEW_QUESTION_COUNT)
    return false;
  return value.every((question) => {
    if (!question || typeof question !== "object") return false;
    const q = question as Record<string, unknown>;
    return (
      typeof q.question_text === "string" &&
      q.question_text.trim().length > 0 &&
      typeof q.topic === "string" &&
      q.topic.trim().length > 0 &&
      Array.isArray(q.expected_points) &&
      q.expected_points.length > 0
    );
  });
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

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roadmapId = searchParams.get("rid");

    const roadmapQuery = supabase
      .from("roadmaps")
      .select("id, title")
      .eq("user_id", user.id);

    const { data: roadmapRow, error: roadmapError } = roadmapId
      ? await roadmapQuery.eq("id", roadmapId).maybeSingle()
      : await roadmapQuery
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    if (roadmapError || !roadmapRow) {
      return Response.json(
        { error: "No roadmap found for this user." },
        { status: 404 },
      );
    }

    const { data: topicsRows, error: topicsError } = await supabase
      .from("roadmap_topics")
      .select("title, description")
      .eq("roadmap_id", roadmapRow.id)
      .order("order_index");

    if (topicsError || !topicsRows || topicsRows.length === 0) {
      return Response.json(
        { error: "No roadmap topics found." },
        { status: 404 },
      );
    }

    const { data: cachedReview } = await supabase
      .from("activity_log")
      .select("metadata")
      .eq("user_id", user.id)
      .eq("event_type", "roadmap_review_questions_generated")
      .eq("entity_type", "roadmap")
      .eq("entity_id", roadmapRow.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cachedQuestions = (cachedReview?.metadata as { questions?: unknown })
      ?.questions;
    if (isValidStoredQuestions(cachedQuestions)) {
      return Response.json({
        roadmapId: roadmapRow.id,
        roadmapTitle: roadmapRow.title,
        questions: cachedQuestions.slice(0, REVIEW_QUESTION_COUNT),
        cached: true,
      });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("experience_level, experience_years, role:roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    const roleValue = Array.isArray(profile?.role)
      ? profile.role[0]
      : profile?.role;

    const generated = await generateRoadmapReviewQuestions({
      roleName: roleValue?.name ?? "Frontend Developer",
      experienceLevel: profile?.experience_level ?? "mid",
      experienceYears: profile?.experience_years ?? 3,
      roadmapTitle: roadmapRow.title,
      topics: topicsRows,
    });

    const questions = normalizeQuestions(generated.questions);
    if (questions.length < REVIEW_QUESTION_COUNT) {
      return Response.json(
        {
          error: `Failed to generate ${REVIEW_QUESTION_COUNT} valid review questions.`,
        },
        { status: 500 },
      );
    }

    await supabase.from("activity_log").insert({
      user_id: user.id,
      event_type: "roadmap_review_questions_generated",
      entity_type: "roadmap",
      entity_id: roadmapRow.id,
      metadata: {
        questions,
      },
    });

    return Response.json({
      roadmapId: roadmapRow.id,
      roadmapTitle: roadmapRow.title,
      questions,
      cached: false,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate roadmap review questions.";
    console.error("Roadmap review question generation failed:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
