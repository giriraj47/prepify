import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReviewAnswerPayload = {
  roadmapId: string;
  answers: Record<number, string>;
};

export type SaveReviewAnswerResult = {
  success: boolean;
  message: string;
};

/**
 * Saves or updates review answers for a user
 * Creates a new record if one doesn't exist, updates if it does
 */
export async function saveReviewAnswers(
  payload: ReviewAnswerPayload,
): Promise<SaveReviewAnswerResult> {
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { roadmapId, answers } = payload;
  const timestamp = new Date().toISOString();

  // Check if review_answers record exists
  const { data: existingRecord, error: fetchError } = await supabase
    .from("review_answers")
    .select("id")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch existing record: ${fetchError.message}`);
  }

  // Update or insert
  if (existingRecord) {
    const { error: updateError } = await supabase
      .from("review_answers")
      .update({
        answers,
        updated_at: timestamp,
      })
      .eq("id", existingRecord.id);

    if (updateError) {
      throw new Error(`Failed to update answers: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase
      .from("review_answers")
      .insert({
        user_id: user.id,
        roadmap_id: roadmapId,
        answers,
        created_at: timestamp,
        updated_at: timestamp,
        submitted: false,
      });

    if (insertError) {
      throw new Error(`Failed to save answers: ${insertError.message}`);
    }
  }

  return {
    success: true,
    message: "Answers saved successfully",
  };
}

/**
 * Retrieves saved review answers for a user and roadmap
 */
export async function getReviewAnswers(roadmapId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("review_answers")
    .select("answers, submitted, updated_at")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch answers: ${error.message}`);
  }

  return data;
}

/**
 * Marks review answers as submitted
 */
export async function submitReviewAnswers(roadmapId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const timestamp = new Date().toISOString();

  const { error } = await supabase
    .from("review_answers")
    .update({
      submitted: true,
      updated_at: timestamp,
    })
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId);

  if (error) {
    throw new Error(`Failed to submit answers: ${error.message}`);
  }

  return {
    success: true,
    message: "Answers submitted successfully",
  };
}
