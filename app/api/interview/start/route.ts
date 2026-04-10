import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInterviewQuestions } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to get role and experience
    const { data: profile } = await supabase
      .from("users")
      .select("role_id, experience_level, experience_years, role:roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.role_id || !profile.experience_level) {
      return Response.json({ error: "Incomplete profile. Please configure your role and experience level." }, { status: 400 });
    }

    const experienceLevel = profile.experience_level;
    const roleId = profile.role_id;
    const roleValue = Array.isArray(profile.role) ? profile.role[0] : profile.role;
    const roleName = roleValue?.name ?? "Software Engineer";
    const experienceYears = profile.experience_years ?? 3;

    // 1. Check pool cache (7-day TTL)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let { data: pool } = await supabase
      .from("interview_question_pools")
      .select("*")
      .eq("role_id", roleId)
      .eq("experience_level", experienceLevel)
      .gt("generated_at", sevenDaysAgo.toISOString())
      .maybeSingle();

    let questions = pool?.questions || [];

    // 2. Generate questions if stale (1 AI call)
    if (!pool || questions.length === 0) {
      const generated = await generateInterviewQuestions({
        roleName,
        experienceLevel,
        experienceYears,
      });

      questions = generated.questions as any;

      if (!questions || questions.length === 0) {
        return Response.json({ error: "Failed to generate questions." }, { status: 500 });
      }

      // 3. Upsert pool
      const { data: newPool, error: poolError } = await supabase
        .from("interview_question_pools")
        .upsert({
          role_id: roleId,
          experience_level: experienceLevel,
          questions: questions,
          generated_at: new Date().toISOString(),
        }, { onConflict: "role_id, experience_level" })
        .select()
        .single();

      if (poolError) {
        console.error("Pool Upsert Error:", poolError);
        // Continue anyway to create session
      } else {
        pool = newPool;
      }
    }

    // 4. Create session (copy questions onto it)
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: user.id,
        pool_id: pool?.id ?? null,
        role_id: roleId,
        experience_level: experienceLevel,
        questions: questions,
        status: "in_progress",
        current_question_index: 0,
        elapsed_seconds: 0,
      })
      .select("id, questions")
      .single();

    if (sessionError || !session) {
      console.error("Session creation error:", sessionError);
      return Response.json({ error: "Failed to create interview session." }, { status: 500 });
    }

    // Remove evaluation_criteria before returning
    const safeQuestions = (session.questions as any[]).map((q) => {
      const { evaluation_criteria, ...safeQ } = q;
      return safeQ;
    });

    // 5. Return session_id + questions
    return Response.json({
      sessionId: session.id,
      questions: safeQuestions,
    });
  } catch (error) {
    console.error("Interview start error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
