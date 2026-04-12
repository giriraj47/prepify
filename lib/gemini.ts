// lib/gemini.ts (Powered by Groq)

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
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

async function callGroq<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number } = {},
): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env.local");

  const model = options.model ?? DEFAULT_GROQ_MODEL;

  const body = {
    model: model,
    messages: [
      {
        role: "system",
        content: "You are a specialized JSON assistant. Always return valid JSON and nothing else.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    response_format: { type: "json_object" },
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errorText}`);
  }

  const data = (await res.json()) as GroqResponse;
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) throw new Error("Groq returned an empty response.");

  const parsed = tryParseJson<T>(raw);
  if (parsed) return parsed;
  throw new Error(`Groq response was not valid JSON: ${raw.slice(0, 200)}`);
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
You are an expert technical interviewer. Generate exactly 10 multiple-choice assessment questions
to evaluate a ${experienceLevel}-level ${roleName} with ${experienceYears} year(s) of experience.
[Request ID: ${Math.random().toString(36).substring(2, 9)}]

Rules:
- Focus on concepts, tools, and best practices EXCLUSIVE and ESSENTIAL to the ${roleName} role.
- Cover a VARIETY of sub-topics relevant to this role (e.g., if it's Frontend, cover state, styling, performance, framework specifics).
- Ensure the difficulty matches the ${experienceLevel} level precisely.
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Keep question_text concise and unambiguous
- The "topic" field should be a short slug like "react-hooks", "css-flexbox", "system-design"
- The "explanation" should be 1-2 sentences explaining WHY the correct answer is right

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

  return callGroq<GenerateQuestionsResult>(prompt, { temperature: 0.8 });
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
    process.env.GROQ_MODEL_ROADMAP ??
    process.env.GROQ_MODEL ??
    DEFAULT_GROQ_MODEL;

  try {
    return await callGroq<GenerateRoadmapResult>(prompt, {
      temperature: 0.7,
      maxTokens: 6000,
      model: preferredModel,
    });
  } catch (err) {
    return callGroq<GenerateRoadmapResult>(prompt, {
      temperature: 0.7,
      maxTokens: 6000,
      model: DEFAULT_GROQ_MODEL,
    });
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

  return callGroq<GenerateRoadmapReviewQuestionsResult>(prompt, {
    temperature: 0.5,
    maxTokens: 5000,
  });
}

export interface InterviewQuestion {
  order_index: number;
  type: "introduction" | "technical" | "system_design" | "problem_solving" | "behavioural" | "closing";
  question: string;
  follow_up?: string;
  expected_duration_mins: number;
  evaluation_criteria: string[];
}

export interface GenerateInterviewQuestionsResult {
  questions: InterviewQuestion[];
}

export interface GenerateInterviewQuestionsParams {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
}

export async function generateInterviewQuestions(
  params: GenerateInterviewQuestionsParams,
): Promise<GenerateInterviewQuestionsResult> {
  const { roleName, experienceLevel, experienceYears } = params;

  const prompt = `
You are a senior engineering interviewer conducting a real technical interview.
Generate exactly 10 interview questions for a ${experienceLevel}-level ${roleName}
with ${experienceYears} year(s) of experience.

The interview should take 35-50 minutes total if answered thoroughly.

Question distribution (follow this exactly):
1. introduction     — 1 question  — 3-4 min expected answer
2. technical        — 4 questions — 4-6 min each
3. system_design    — 1 questions — 5-7 min each  
4. problem_solving  — 1 question  — 4-5 min
5. behavioural      — 1 question  — 3-4 min
6. closing          — 1 question  — 2-3 min

Rules:
- Questions must require EXPLANATION, not just a yes/no or one-liner
- Technical questions must probe deep understanding, not surface definitions
- System design questions must ask the candidate to architect something real
- Behavioural questions must use the STAR format prompt (Situation, Task, Action, Result)
- evaluation_criteria is a list of 3-5 things a GOOD answer would mention
- follow_up is an optional probing question to go deeper (not asked automatically)
- expected_duration_mins is how long a thorough answer should take

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "order_index": 1,
      "type": "introduction" | "technical" | "system_design" | "problem_solving" | "behavioural" | "closing",
      "question": "string — the actual question text",
      "follow_up": "string — optional probing follow-up",
      "expected_duration_mins": number,
      "evaluation_criteria": ["string", "string", "string"]
    }
  ]
}
`;

  return callGroq<GenerateInterviewQuestionsResult>(prompt, {
    temperature: 0.7,
    maxTokens: 5000,
  });
}

export interface EvaluateInterviewParams {
  roleName: string;
  experienceLevel: string;
  questions: Array<{
    evaluation_criteria: string[];
  }>;
  responses: Array<{
    question_type: string;
    question_text: string;
    duration_seconds: number;
    transcript: string;
  }>;
}

export interface EvaluationResult {
  responses: Array<{
    question_index: number;
    score: number;
    strong_points: string[];
    weak_points: string[];
    feedback: string;
  }>;
  overall: {
    score: number;
    grade: "A" | "B+" | "B" | "C+" | "C" | "D";
    summary: string;
    strong_areas: string[];
    weak_areas: string[];
    recommendations: string[];
  };
}

export async function evaluateInterview(
  params: EvaluateInterviewParams,
): Promise<EvaluationResult> {
  const { roleName, experienceLevel, questions, responses } = params;

  const answersContext = responses.map((r, i) => `
Question ${i + 1} [${r.question_type}]: ${r.question_text}
Evaluation criteria: ${(questions[i]?.evaluation_criteria || []).join(", ")}
Candidate's answer (${r.duration_seconds}s): ${r.transcript || "No answer given"}
`).join("\n---\n");

  const prompt = `
You are evaluating a technical interview for a ${experienceLevel} ${roleName}.

${answersContext}

For each question, provide:
- A score from 0-100
- 2-3 specific strong points from their answer
- 2-3 specific weak points or things they missed
- Brief personalised feedback

Then provide an overall summary with:
- Overall score (weighted average, system_design and technical worth more)
- Top 3 strong areas
- Top 3 weak areas  
- 3 concrete recommendations to improve

Return ONLY valid JSON:
{
  "responses": [
    {
      "question_index": 0,
      "score": number,
      "strong_points": ["string"],
      "weak_points": ["string"],
      "feedback": "string"
    }
  ],
  "overall": {
    "score": number,
    "grade": "A" | "B+" | "B" | "C+" | "C" | "D",
    "summary": "string",
    "strong_areas": ["string"],
    "weak_areas": ["string"],
    "recommendations": ["string"]
  }
}
`;

  return callGroq<EvaluationResult>(prompt, {
    temperature: 0.2, // Lower temperature for more objective evaluation
    maxTokens: 6000,
  });
}
