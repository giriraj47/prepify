// lib/gemini.ts

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function getGeminiApiUrl(modelOverride?: string): string {
  const model =
    modelOverride ??
    process.env.GEMINI_MODEL ??
    process.env.GOOGLE_GENERATIVE_AI_MODEL ??
    DEFAULT_GEMINI_MODEL;
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// ─── Shared types ────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "true_false" | "short_answer" | "voice";
export type ResourceType = "article" | "video" | "docs" | "course";
export type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export interface QuestionOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

export interface AssessmentQuestion {
  question_text: string;
  options: QuestionOption[];
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: Difficulty;
}

export interface GenerateQuestionsResult {
  questions: AssessmentQuestion[];
}

export interface RoadmapResource {
  title: string;
  url: string;
  type: ResourceType;
}

export interface RoadmapTopic {
  title: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  status: TopicStatus;
  resources: RoadmapResource[];
}

export interface Roadmap {
  title: string;
  description: string;
  estimated_weeks: number;
  topics: RoadmapTopic[];
}

export interface GenerateRoadmapResult {
  roadmap: Roadmap;
}

export interface RoadmapReviewQuestion {
  question_text: string;
  topic: string;
  expected_points: string[];
}

export interface GenerateRoadmapReviewQuestionsResult {
  questions: RoadmapReviewQuestion[];
}

// ─── Gemini API types ────────────────────────────────────────

interface GeminiCallOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

// ─── Core function ───────────────────────────────────────────

async function callGemini<T>(
  prompt: string,
  options: GeminiCallOptions = {},
): Promise<T> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) is not set.",
    );

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 4096,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(getGeminiApiUrl(options.model), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) throw new Error("Gemini returned an empty response.");

  const parsed = tryParseJson<T>(raw);
  if (parsed) return parsed;
  throw new Error(`Gemini response was not valid JSON: ${raw.slice(0, 200)}`);
}

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue to extraction/cleanup
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  let slice = raw.slice(start, end + 1);
  // Remove trailing commas before } or ]
  slice = slice.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

// ─── Exported AI functions ───────────────────────────────────

interface GenerateQuestionsParams {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
}

export async function generateAssessmentQuestions(
  params: GenerateQuestionsParams,
): Promise<GenerateQuestionsResult> {
  const { roleName, experienceLevel, experienceYears } = params;

  const prompt = `
You are an expert technical interviewer. Generate exactly 5 multiple-choice assessment questions
to evaluate a ${experienceLevel}-level ${roleName} with ${experienceYears} year(s) of experience.

Rules:
- Cover a VARIETY of topics relevant to this role (not just one area)
- Mix difficulty: 3 easy, 5 medium, 2 hard
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Keep question_text concise and unambiguous
- The "topic" field should be a short slug like "react-hooks", "css-flexbox", "system-design"
- The "explanation" should be 1-2 sentences explaining WHY the correct answer is right

Strict output requirements:
- Output MUST be valid JSON and nothing else (no markdown, no code fences, no commentary).
- Use double quotes for all strings and keys.
- Do NOT include trailing commas.
- Do NOT include any extra keys or text outside the JSON object.

Return ONLY a JSON object matching this exact schema:
{
  "questions": [
    {
      "question_text": "string",
      "options": [
        { "key": "A", "text": "string" },
        { "key": "B", "text": "string" },
        { "key": "C", "text": "string" },
        { "key": "D", "text": "string" }
      ],
      "correct_answer": "A" | "B" | "C" | "D",
      "explanation": "string",
      "topic": "string",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}
`;

  return callGemini<GenerateQuestionsResult>(prompt, { temperature: 0.8 });
}

interface GenerateRoadmapParams {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
  score: number;
  weakTopics: string[];
  strongTopics: string[];
  strictUrls?: boolean;
}

export async function generateRoadmap(
  params: GenerateRoadmapParams,
): Promise<GenerateRoadmapResult> {
  const {
    roleName,
    experienceLevel,
    experienceYears,
    score,
    weakTopics,
    strongTopics,
    strictUrls,
  } = params;

  const prompt = `
You are a senior engineering mentor creating a personalised study roadmap.

Candidate profile:
- Role: ${roleName}
- Experience: ${experienceLevel} (${experienceYears} year(s))
- Assessment score: ${score}%
- Weak topics (needs work): ${weakTopics.join(", ") || "none identified"}
- Strong topics (already knows): ${strongTopics.join(", ") || "none identified"}

Instructions:
- Create a roadmap with 6 to 10 topics
- Prioritise weak topics - they should appear earlier in the roadmap
- Strong topics can be skipped or placed later as refreshers
- Each topic should include 2-4 learning resources (mix of free articles, docs, videos)
- estimated_hours should be realistic for a working professional
- The first topic should always have status "available", all others "locked"
- estimated_weeks should be the total realistic completion time
${strictUrls ? "- Use only real, publicly accessible https URLs. Do NOT use placeholders or broken links.\n- Prefer official docs and reputable sources (MDN, web.dev, React, TypeScript, Google, etc.).\n- Double-check that each URL is valid and specific to the resource title.\n" : ""}

Strict output requirements:
- Output MUST be valid JSON and nothing else (no markdown, no code fences, no commentary).
- Use double quotes for all strings and keys.
- Do NOT include trailing commas.
- Do NOT include any extra keys or text outside the JSON object.

Return ONLY a JSON object matching this exact schema:
{
  "roadmap": {
    "title": "string",
    "description": "string",
    "estimated_weeks": number,
    "topics": [
      {
        "title": "string",
        "description": "string",
        "order_index": number,
        "estimated_hours": number,
        "status": "available" | "locked",
        "resources": [
          {
            "title": "string",
            "url": "string",
            "type": "article" | "video" | "docs" | "course"
          }
        ]
      }
    ]
  }
}
`;

  const preferredModel =
    process.env.GOOGLE_GENERATIVE_AI_MODEL_ROADMAP ??
    process.env.GEMINI_MODEL_ROADMAP ??
    process.env.GOOGLE_GENERATIVE_AI_MODEL ??
    process.env.GEMINI_MODEL ??
    "gemini-3.1-pro";

  try {
    return await callGemini<GenerateRoadmapResult>(prompt, {
      temperature: 0.7,
      maxTokens: 6000,
      model: preferredModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("not found") || message.includes("404")) {
      return callGemini<GenerateRoadmapResult>(prompt, {
        temperature: 0.7,
        maxTokens: 6000,
        model: DEFAULT_GEMINI_MODEL,
      });
    }
    throw err;
  }
}

interface GenerateRoadmapReviewQuestionsParams {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
  roadmapTitle: string;
  topics: Array<{ title: string; description?: string | null }>;
}

export async function generateRoadmapReviewQuestions(
  params: GenerateRoadmapReviewQuestionsParams,
): Promise<GenerateRoadmapReviewQuestionsResult> {
  const { roleName, experienceLevel, experienceYears, roadmapTitle, topics } =
    params;

  const topicLines = topics
    .map(
      (topic, index) =>
        `${index + 1}. ${topic.title}${topic.description ? ` - ${topic.description}` : ""}`,
    )
    .join("\n");

  const prompt = `
You are a senior interviewer creating a roadmap progress review.

Candidate profile:
- Role: ${roleName}
- Experience: ${experienceLevel} (${experienceYears} year(s))
- Roadmap: ${roadmapTitle}

Roadmap topics:
${topicLines}

Task:
- Generate exactly 10 descriptive (open-ended) questions.
- Questions must evaluate practical understanding and reasoning, not definitions only.
- Every question must map to one roadmap topic.
- Cover as many different roadmap topics as possible.
- Do NOT generate MCQ or true/false questions.

Strict output requirements:
- Output MUST be valid JSON and nothing else (no markdown, no code fences, no commentary).
- Use double quotes for all strings and keys.
- Do NOT include trailing commas.
- Do NOT include any extra keys or text outside the JSON object.

Return ONLY this schema:
{
  "questions": [
    {
      "question_text": "string",
      "topic": "string",
      "expected_points": ["string", "string", "string"]
    }
  ]
}
`;

  return callGemini<GenerateRoadmapReviewQuestionsResult>(prompt, {
    temperature: 0.5,
    maxTokens: 5000,
  });
}
