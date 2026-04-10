import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, questionIndex, questionText, questionType, transcript, durationSeconds } = body;

    if (!sessionId || questionIndex === undefined || !questionText || !questionType) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error: upsertError } = await supabase
      .from("interview_responses")
      .upsert({
        session_id: sessionId,
        user_id: user.id,
        question_index: questionIndex,
        question_text: questionText,
        question_type: questionType,
        transcript: transcript,
        duration_seconds: durationSeconds,
      }, { onConflict: "session_id, question_index" });

    if (upsertError) {
      console.error("Response Upsert Error:", upsertError);
      return Response.json({ error: "Failed to save response" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Response route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
