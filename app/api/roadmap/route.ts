import { NextResponse } from "next/server";
import { generateRoadmap, type Roadmap, type RoadmapTopic } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (head.ok) return true;
    if (head.status === 403 || head.status === 405) {
      const get = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
      return get.ok;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateRoadmapUrls(roadmap: Roadmap): Promise<{
  roadmap: Roadmap;
  hadInvalid: boolean;
}> {
  let hadInvalid = false;
  const topics: RoadmapTopic[] = [];

  for (const topic of roadmap.topics) {
    const resources = topic.resources ?? [];
    const validated = [];
    for (const resource of resources) {
      const ok = await isUrlReachable(resource.url);
      if (ok) validated.push(resource);
      else hadInvalid = true;
    }
    topics.push({ ...topic, resources: validated });
  }

  return { roadmap: { ...roadmap, topics }, hadInvalid };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      roleName?: string;
      experienceLevel?: string;
      experienceYears?: number;
      score?: number;
      correctAnswers?: number;
      totalQuestions?: number;
      weakTopics?: string[];
      strongTopics?: string[];
    };

    const { data: profile } = await supabase
      .from("users")
      .select("role_id, experience_level, experience_years, role:roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    const roleValue = Array.isArray(profile?.role)
      ? profile?.role[0]
      : profile?.role;

    const roleName =
      body.roleName ?? roleValue?.name ?? "Frontend Developer";
    const experienceLevel =
      body.experienceLevel ?? profile?.experience_level ?? "mid";
    const experienceYears =
      body.experienceYears ?? profile?.experience_years ?? 3;

    const buildRoadmap = async () => {
      return generateRoadmap({
        roleName,
        experienceLevel,
        experienceYears,
        score: body.score ?? 0,
        weakTopics: body.weakTopics ?? [],
        strongTopics: body.strongTopics ?? [],
        strictUrls: true,
      });
    };

    let roadmap = await buildRoadmap();
    let validated = await validateRoadmapUrls(roadmap.roadmap);
    if (validated.hadInvalid) {
      roadmap = await buildRoadmap();
      validated = await validateRoadmapUrls(roadmap.roadmap);
    }

    const { data: assessment } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        role_id: profile?.role_id ?? null,
        experience_level: experienceLevel,
        status: "completed",
        score: body.score ?? 0,
        total_questions: body.totalQuestions ?? 0,
        correct_answers: body.correctAnswers ?? 0,
        weak_topics: body.weakTopics ?? [],
        strong_topics: body.strongTopics ?? [],
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const { data: roadmapRow, error: roadmapError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        assessment_id: assessment?.id ?? null,
        role_id: profile?.role_id ?? null,
        title: validated.roadmap.title,
        description: validated.roadmap.description,
        status: "active",
        total_topics: validated.roadmap.topics.length,
        completed_topics: 0,
        estimated_weeks: validated.roadmap.estimated_weeks,
        ai_generated: true,
      })
      .select("id")
      .single();

    if (roadmapError || !roadmapRow) {
      throw roadmapError ?? new Error("Failed to save roadmap.");
    }

    const topicsToInsert = validated.roadmap.topics.map((topic) => ({
      roadmap_id: roadmapRow.id,
      title: topic.title,
      description: topic.description,
      order_index: topic.order_index,
      status: topic.status,
      estimated_hours: topic.estimated_hours,
      resources: (topic.resources ?? []).map((r) => ({
        ...r,
        completed: false,
      })),
    }));

    if (topicsToInsert.length) {
      await supabase.from("roadmap_topics").insert(topicsToInsert);
    }

    return NextResponse.json({
      roadmapId: roadmapRow.id,
      roadmap: validated.roadmap,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate roadmap.";
    console.error("[roadmap] generation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
