import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateInterview } from "@/lib/gemini";
import { 
  getInterviewSession, 
  getSessionResponses,
  saveResponseEvaluations,
  completeInterviewSession,
  buildEvaluationInput,
  PoolQuestion,
  ClientInterviewQuestion
} from "@/lib/supabase/server-services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return Response.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Fetch session
    const { data: session, error: sessionError } = await getInterviewSession(sessionId, user.id);
    if (sessionError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "completed" && session.feedback?.score !== undefined) {
      // Already evaluated
      return Response.json({ success: true, evaluated: true, evaluation: { overall: session.feedback, responses: [] } });
    }

    // Fetch pool for evaluation criteria
    let poolQuestions: PoolQuestion[] = [];
    if (session.pool_id) {
      const { data: poolData } = await supabase
        .from("interview_question_pools")
        .select("questions")
        .eq("id", session.pool_id)
        .single();
      if (poolData && Array.isArray(poolData.questions)) {
        poolQuestions = poolData.questions as PoolQuestion[];
      }
    }

    // Fetch responses
    const { data: responses, error: responsesError } = await getSessionResponses(sessionId);
    if (responsesError || !responses) {
      return Response.json({ error: "Failed to fetch responses" }, { status: 500 });
    }

    // Map responses to inputs
    const inputs = buildEvaluationInput(
      poolQuestions.length > 0 ? poolQuestions : session.questions.map((q: ClientInterviewQuestion) => ({ ...q, evaluation_criteria: [] })) as any,
      responses
    );

    // Get role name
    const roleName = session.role_id 
      ? (await supabase.from("roles").select("name").eq("id", session.role_id).single()).data?.name ?? "Software Engineer"
      : "Software Engineer";
    const experienceLevel = session.experience_level ?? "mid_level";

    const evaluateParams = {
      roleName,
      experienceLevel,
      questions: inputs.map(i => ({ evaluation_criteria: i.evaluation_criteria })),
      responses: inputs.map(i => ({
        question_type: i.type,
        question_text: i.question,
        duration_seconds: i.duration_seconds,
        transcript: i.transcript,
      })),
    };

    const evaluation = await evaluateInterview(evaluateParams);

    // Save evaluation to DB
    await saveResponseEvaluations(sessionId, evaluation.responses);

    const elapsedSeconds = responses.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
    
    await completeInterviewSession(
      sessionId,
      evaluation.overall.score,
      evaluation.overall as any,
      elapsedSeconds || session.elapsed_seconds || 1
    );

    return Response.json({ success: true, evaluation });

  } catch (error) {
    console.error("Evaluation route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
