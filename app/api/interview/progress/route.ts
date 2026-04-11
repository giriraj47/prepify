import { createSupabaseServerClient } from "@/lib/supabase/server";
import { 
  advanceSessionProgress, 
  completeInterviewSession, 
  InterviewFeedback 
} from "@/lib/supabase/server-services";

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

    let result;

    if (status === "completed") {
      result = await completeInterviewSession(
        sessionId,
        0, 
        {} as Required<InterviewFeedback>,
        elapsedSeconds ?? 0
      );
    } else {
      result = await advanceSessionProgress(
        sessionId,
        currentQuestionIndex,
        elapsedSeconds ?? 0
      );
    }

    if (result.error) {
      console.error("Progress Update Error:", result.error);
      return Response.json({ error: "Failed to update progress" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Progress route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
