export type Difficulty = "easy" | "medium" | "hard";

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

export interface GenerateAssessmentQuestionsParams {
  roleName: string;
  experienceLevel: string;
  experienceYears: number;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

const ROLE_TOPICS: Record<string, string[]> = {
  "Frontend Developer": [
    "react",
    "state-management",
    "css-layout",
    "web-performance",
    "accessibility",
    "testing",
  ],
  "Backend Developer": [
    "api-design",
    "database-design",
    "concurrency",
    "caching-strategies",
    "security",
    "observability",
  ],
  "Full Stack Developer": [
    "frontend-architecture",
    "backend-architecture",
    "authentication",
    "api-integration",
    "performance",
    "testing-strategy",
  ],
  "DevOps / SRE": [
    "ci-cd",
    "infrastructure-as-code",
    "container-orchestration",
    "monitoring-alerting",
    "incident-response",
    "reliability-engineering",
  ],
  "QA / Test Engineer": [
    "test-strategy",
    "automation-frameworks",
    "api-testing",
    "regression-testing",
    "defect-lifecycle",
    "quality-metrics",
  ],
};

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  let slice = raw.slice(start, end + 1);
  slice = slice.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

async function callGroq<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number } = {},
): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing on the server.");
  }

  const body = {
    model: options.model ?? DEFAULT_GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a strict JSON assistant. Return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: options.temperature ?? 1,
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
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  const parsed = tryParseJson<T>(content);
  if (!parsed) {
    throw new Error("Groq response was not valid JSON.");
  }

  return parsed;
}

export async function generateAssessmentQuestionsWithGroq(
  params: GenerateAssessmentQuestionsParams,
): Promise<{ questions: AssessmentQuestion[] }> {
  const { roleName, experienceLevel, experienceYears } = params;
  const focusTopics = ROLE_TOPICS[roleName] ?? ["core-fundamentals"];

  const prompt = `
Generate exactly 10 unique multiple-choice technical assessment questions.

Candidate profile:
- Role: ${roleName}
- Experience level: ${experienceLevel}
- Years of experience: ${experienceYears}
- Role focus topics: ${focusTopics.join(", ")}
- Request nonce: ${crypto.randomUUID()}

Hard requirements:
- Questions MUST be role-specific. Do not ask generic software questions.
- At least 8 out of 10 questions must map directly to the role focus topics.
- Include a mix of conceptual and practical scenario questions.
- Keep difficulty aligned to ${experienceLevel}.
- Each question must have exactly 4 options (A/B/C/D), one correct answer.
- "topic" must be a short kebab-case slug.
- "explanation" must be concise and specific.
- Return JSON only using this shape:
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
      "correct_answer": "A",
      "explanation": "string",
      "topic": "string",
      "difficulty": "easy"
    }
  ]
}
`;

  return callGroq<{ questions: AssessmentQuestion[] }>(prompt, {
    temperature: 1,
  });
}
