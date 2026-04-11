import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInterviewQuestions } from "@/lib/gemini";
import { 
  getCachedInterviewPool, 
  upsertInterviewQuestionPool, 
  createInterviewSession,
  PoolQuestion,
} from "@/lib/supabase/server-services";
import { ExperienceLevel } from "@/lib/supabase/services";

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

    const experienceLevel = profile.experience_level as ExperienceLevel;
    const roleId = profile.role_id;
    const roleValue = Array.isArray(profile.role) ? profile.role[0] : profile.role;
    const roleName = roleValue?.name ?? "Software Engineer";
    const experienceYears = profile.experience_years ?? 3;

    // 1. Check pool cache (using centralized service - 24h TTL)
    const { data: pool, error: poolFetchError } = await getCachedInterviewPool(roleId, experienceLevel);

    if (poolFetchError) {
      console.error("Pool fetch error:", poolFetchError);
    }

    let questions: PoolQuestion[] = pool?.questions || [];
    let poolId = pool?.id;

    // 2. Generate questions if cache miss
    if (questions.length === 0) {
      console.log(`Cache miss for ${roleName}. Generating fresh questions...`);
      const generated = await generateInterviewQuestions({
        roleName,
        experienceLevel,
        experienceYears,
      });

      questions = generated.questions as PoolQuestion[];

      if (!questions || questions.length === 0) {
        return Response.json({ error: "Failed to generate questions." }, { status: 500 });
      }

      // 3. Upsert pool
      const { data: newPool, error: poolUpsertError } = await upsertInterviewQuestionPool(
        roleId, 
        experienceLevel, 
        questions
      );

      if (poolUpsertError) {
        console.error("Pool Upsert Error (Check RLS Policies):", poolUpsertError);
      } else {
        poolId = newPool?.id;
      }
    } else {
      console.log(`Serving cached questions for ${roleName}.`);
    }

    // 4. Create session (stripping evaluation_criteria for the client)
    const clientQuestions = questions.map(({ evaluation_criteria: _stripped, ...safe }) => safe);

    const { data: session, error: sessionError } = await createInterviewSession({
      user_id: user.id,
      pool_id: poolId ?? null as any,
      role_id: roleId,
      experience_level: experienceLevel,
      questions: clientQuestions,
    });

    if (sessionError || !session) {
      console.error("Session creation error:", sessionError);
      return Response.json({ error: "Failed to create interview session." }, { status: 500 });
    }

    // 5. Return session_id + questions
    return Response.json({
      sessionId: session.id,
      questions: clientQuestions,
    });
  } catch (error) {
    console.error("Interview start error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
