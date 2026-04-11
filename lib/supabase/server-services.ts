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

// lib/supabase-interview-service.ts
// ─────────────────────────────────────────────────────────────
// Supabase data layer for the mock interview feature.
// Covers:
//   1.  Types
//   2.  Interview question pool (cache)
//   3.  Interview session (create / fetch / pause / resume)
//   4.  Interview responses (save transcript per question)
//   5.  Interview completion + AI evaluation storage
//   6.  Interview history (dashboard / results page)
// ─────────────────────────────────────────────────────────────

import type { Database } from "@/types/database";
import type { ExperienceLevel, ServiceResult } from "@/lib/supabase-service";

// Use the existing server client factory

// ─────────────────────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────────────────────

export type InterviewSessionStatus =
  | "pending"
  | "in_progress"
  | "paused"
  | "completed"
  | "abandoned";

export type InterviewQuestionType =
  | "introduction"
  | "technical"
  | "system_design"
  | "problem_solving"
  | "behavioural"
  | "closing";

// ── Question as stored in the pool / session JSONB ───────────
// evaluation_criteria is kept server-side only —
// it is stripped before sending questions to the client.

export interface PoolQuestion {
  order_index: number;
  type: InterviewQuestionType;
  question: string;
  follow_up: string;
  expected_duration_mins: number;
  evaluation_criteria: string[]; // server-side rubric, never sent to client
}

// Safe version sent to the browser
export interface ClientInterviewQuestion {
  order_index: number;
  type: InterviewQuestionType;
  question: string;
  follow_up: string;
  expected_duration_mins: number;
}

// ── Pool ─────────────────────────────────────────────────────

export interface InterviewQuestionPool {
  id: string;
  role_id: string;
  experience_level: ExperienceLevel;
  questions: PoolQuestion[];
  generated_at: string;
}

// ── Session ──────────────────────────────────────────────────

export interface InterviewSession {
  id: string;
  user_id: string;
  pool_id: string | null;
  role_id: string | null;
  experience_level: ExperienceLevel | null;
  questions: ClientInterviewQuestion[]; // evaluation_criteria stripped
  status: InterviewSessionStatus;
  current_question_index: number;
  elapsed_seconds: number;
  overall_score: number | null;
  feedback: InterviewFeedback;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Response (one per question per session) ──────────────────

export interface InterviewResponse {
  id: string;
  session_id: string;
  user_id: string;
  question_index: number;
  question_text: string;
  question_type: InterviewQuestionType;
  transcript: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_strong_points: string[];
  ai_weak_points: string[];
  created_at: string;
  updated_at: string;
}

// ── AI evaluation shapes ──────────────────────────────────────

export interface PerResponseEvaluation {
  question_index: number;
  score: number;
  strong_points: string[];
  weak_points: string[];
  feedback: string;
}

export interface InterviewFeedback {
  score?: number;
  grade?: string;
  summary?: string;
  strong_areas?: string[];
  weak_areas?: string[];
  recommendations?: string[];
}

export interface EvaluationResult {
  responses: PerResponseEvaluation[];
  overall: Required<InterviewFeedback>;
}

// ── Insert payloads ───────────────────────────────────────────

export interface CreateSessionPayload {
  user_id: string;
  pool_id: string;
  role_id: string;
  experience_level: ExperienceLevel;
  // Client questions (evaluation_criteria already stripped)
  questions: ClientInterviewQuestion[];
}

export interface UpsertResponsePayload {
  session_id: string;
  user_id: string;
  question_index: number;
  question_text: string;
  question_type: InterviewQuestionType;
  transcript: string;
  audio_url?: string;
  duration_seconds: number;
}

// ─────────────────────────────────────────────────────────────
// SUPABASE CLIENT FACTORY
// ─────────────────────────────────────────────────────────────

async function getServerSupabase() {
  return await createSupabaseServerClient();
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const POOL_TTL_DAYS = 1; // 24 hours cache as requested

/** Strip evaluation_criteria before sending questions to the client */
export function toClientQuestions(questions: PoolQuestion[]): ClientInterviewQuestion[] {
  return questions.map(({ evaluation_criteria: _stripped, ...safe }) => safe);
}

/** Cast raw JSONB from DB into typed PoolQuestion array */
function parsePoolQuestions(raw: unknown): PoolQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as PoolQuestion[];
}

/** Cast raw JSONB from DB into typed ClientInterviewQuestion array */
function parseClientQuestions(raw: unknown): ClientInterviewQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as ClientInterviewQuestion[];
}

/** Cast raw JSONB from DB into typed InterviewFeedback */
function parseFeedback(raw: unknown): InterviewFeedback {
  if (!raw || typeof raw !== "object") return {};
  return raw as InterviewFeedback;
}

/** Cast raw JSONB array from DB into string[] */
function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw as string[];
}

// ─────────────────────────────────────────────────────────────
// 2. INTERVIEW QUESTION POOL (CACHE)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch the cached question pool for a (role_id, experience_level) pair.
 */
export async function getCachedInterviewPool(
  roleId: string,
  experienceLevel: ExperienceLevel,
): Promise<ServiceResult<InterviewQuestionPool | null>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_question_pools")
    .select("id, role_id, experience_level, questions, generated_at")
    .eq("role_id", roleId)
    .eq("experience_level", experienceLevel)
    .single();

  if (error?.code === "PGRST116") return { data: null, error: null };
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const ageDays =
    (Date.now() - new Date(data.generated_at).getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays >= POOL_TTL_DAYS) {
    return { data: null, error: null };
  }

  return {
    data: {
      ...data,
      experience_level: data.experience_level as ExperienceLevel,
      questions: parsePoolQuestions(data.questions),
    },
    error: null,
  };
}

/**
 * Upsert a freshly generated question pool.
 */
export async function upsertInterviewQuestionPool(
  roleId: string,
  experienceLevel: ExperienceLevel,
  questions: PoolQuestion[],
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_question_pools")
    .upsert(
      {
        role_id: roleId,
        experience_level: experienceLevel,
        questions: questions as any,
        generated_at: new Date().toISOString(),
      },
      {
        onConflict: "role_id,experience_level",
        ignoreDuplicates: false,
      },
    )
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

// ─────────────────────────────────────────────────────────────
// 3. INTERVIEW SESSION
// ─────────────────────────────────────────────────────────────

/**
 * Create a new interview session for a user.
 */
export async function createInterviewSession(
  payload: CreateSessionPayload,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: payload.user_id,
      pool_id: payload.pool_id,
      role_id: payload.role_id,
      experience_level: payload.experience_level,
      questions: payload.questions as any,
      status: "in_progress",
      current_question_index: 0,
      elapsed_seconds: 0,
      feedback: {},
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

/**
 * Fetch a full interview session by ID.
 */
export async function getInterviewSession(
  sessionId: string,
  userId: string,
): Promise<ServiceResult<InterviewSession>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) return { data: null, error: error.message };

  return {
    data: {
      ...data,
      experience_level: data.experience_level as ExperienceLevel | null,
      status: data.status as InterviewSessionStatus,
      questions: parseClientQuestions(data.questions),
      feedback: parseFeedback(data.feedback),
    },
    error: null,
  };
}

/**
 * Mark session as in_progress and update current question index.
 */
export async function advanceSessionProgress(
  sessionId: string,
  currentQuestionIndex: number,
  elapsedSeconds: number,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_sessions")
    .update({
      status: "in_progress",
      current_question_index: currentQuestionIndex,
      elapsed_seconds: elapsedSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

/**
 * Abandon an interview session.
 */
export async function abandonInterviewSession(
  sessionId: string,
  userId: string,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_sessions")
    .update({
      status: "abandoned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

// ─────────────────────────────────────────────────────────────
// 4. INTERVIEW RESPONSES
// ─────────────────────────────────────────────────────────────

/**
 * Upsert a response for a single question.
 */
export async function upsertInterviewResponse(
  payload: UpsertResponsePayload,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_responses")
    .upsert(
      {
        session_id: payload.session_id,
        user_id: payload.user_id,
        question_index: payload.question_index,
        question_text: payload.question_text,
        question_type: payload.question_type,
        transcript: payload.transcript,
        audio_url: payload.audio_url ?? null,
        duration_seconds: payload.duration_seconds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "session_id,question_index",
        ignoreDuplicates: false,
      },
    )
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

/**
 * Fetch all responses for a session.
 */
export async function getSessionResponses(
  sessionId: string,
): Promise<ServiceResult<InterviewResponse[]>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_responses")
    .select("*")
    .eq("session_id", sessionId)
    .order("question_index");

  if (error) return { data: null, error: error.message };

  const typed = (data ?? []).map((r) => ({
    ...r,
    question_type: r.question_type as InterviewQuestionType,
    ai_strong_points: parseStringArray(r.ai_strong_points),
    ai_weak_points: parseStringArray(r.ai_weak_points),
  })) as InterviewResponse[];

  return { data: typed, error: null };
}

// ─────────────────────────────────────────────────────────────
// 5. COMPLETION & HISTORY
// ─────────────────────────────────────────────────────────────

/**
 * Save per-response AI evaluation scores back to the DB.
 */
export async function saveResponseEvaluations(
  sessionId: string,
  evaluations: PerResponseEvaluation[],
): Promise<ServiceResult<{ saved: number }>> {
  const supabase = await getServerSupabase();

  const updates = evaluations.map((ev) =>
    supabase
      .from("interview_responses")
      .update({
        ai_score: ev.score,
        ai_feedback: ev.feedback,
        ai_strong_points: ev.strong_points,
        ai_weak_points: ev.weak_points,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("question_index", ev.question_index),
  );

  const results = await Promise.allSettled(updates);
  const saved = results.filter((r) => r.status === "fulfilled").length;
  return { data: { saved }, error: null };
}

/**
 * Mark the session as completed.
 */
export async function completeInterviewSession(
  sessionId: string,
  overallScore: number,
  feedback: Required<InterviewFeedback>,
  elapsedSeconds: number,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      overall_score: overallScore,
      feedback: feedback as any,
      elapsed_seconds: elapsedSeconds,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as { id: string }, error: null };
}

/**
 * Fetch a completed session with responses.
 */
export async function getCompletedSessionWithResponses(
  sessionId: string,
  userId: string,
): Promise<
  ServiceResult<{
    session: InterviewSession;
    responses: InterviewResponse[];
  }>
> {
  const supabase = await getServerSupabase();

  const { data: sessionData, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "completed")
    .single();

  if (sessionError) return { data: null, error: sessionError.message };

  const { data: responsesData, error: responsesError } = await supabase
    .from("interview_responses")
    .select("*")
    .eq("session_id", sessionId)
    .order("question_index");

  if (responsesError) return { data: null, error: responsesError.message };

  const session: InterviewSession = {
    ...sessionData,
    experience_level: sessionData.experience_level as ExperienceLevel | null,
    status: sessionData.status as InterviewSessionStatus,
    questions: parseClientQuestions(sessionData.questions),
    feedback: parseFeedback(sessionData.feedback),
  };

  const responses: InterviewResponse[] = (responsesData ?? []).map((r) => ({
    ...r,
    question_type: r.question_type as InterviewQuestionType,
    ai_strong_points: parseStringArray(r.ai_strong_points),
    ai_weak_points: parseStringArray(r.ai_weak_points),
  }));

  return { data: { session, responses }, error: null };
}

export function buildEvaluationInput(
  poolQuestions: PoolQuestion[],
  responses: InterviewResponse[],
): Array<{
  order_index: number;
  type: InterviewQuestionType;
  question: string;
  evaluation_criteria: string[];
  transcript: string;
  duration_seconds: number;
}> {
  const responseMap = new Map(responses.map((r) => [r.question_index, r]));

  return poolQuestions.map((q) => {
    const response = responseMap.get(q.order_index);
    return {
      order_index: q.order_index,
      type: q.type,
      question: q.question,
      evaluation_criteria: q.evaluation_criteria,
      transcript: response?.transcript ?? "",
      duration_seconds: response?.duration_seconds ?? 0,
    };
  });
}

