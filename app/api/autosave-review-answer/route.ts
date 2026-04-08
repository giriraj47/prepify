import { saveReviewAnswers } from "@/lib/supabase/server-services";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roadmapId, answers } = body as {
      roadmapId: string;
      answers: Record<number, string>;
    };

    if (!roadmapId || !answers) {
      return NextResponse.json(
        { error: "Missing roadmapId or answers" },
        { status: 400 },
      );
    }

    const result = await saveReviewAnswers({ roadmapId, answers });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Autosave error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    if (errorMessage === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
