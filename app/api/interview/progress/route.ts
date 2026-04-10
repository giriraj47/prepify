import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, currentQuestionIndex, elapsedSeconds, status } = body;

    if (!sessionId || currentQuestionIndex === undefined) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updates: any = {
      current_question_index: currentQuestionIndex,
    };
    if (elapsedSeconds !== undefined) updates.elapsed_seconds = elapsedSeconds;
    if (status !== undefined) updates.status = status;

    const { error: updateError } = await supabase
      .from("interview_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Progress Update Error:", updateError);
      return Response.json({ error: "Failed to update progress" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Progress route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
