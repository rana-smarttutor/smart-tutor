import "server-only";

/**
 * Additional best-effort safety checks. A semantic model can still miss subtle
 * paraphrases or make a factual mistake: this is NOT a proof of official syllabus
 * compliance. Keep the editorial outlines in data/quiz-syllabus-2026-27.json
 * under review against the actual board documents.
 */

type AuditQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  syllabusUnit?: string;
};

type AuditInput = {
  apiKey: string;
  board: string;
  schoolClass: string;
  subject: string;
  academicYear: string;
  allowedUnits: string[];
  questions: AuditQuestion[];
  previouslySeen: string[];
};

type Review = {
  index: number;
  accepted: boolean;
  reason: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

function plainWords(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "being", "been",
  "in", "at", "on", "to", "of", "and", "or", "by", "for", "with", "from",
  "what", "which", "who", "whom", "when", "where", "how", "why", "does",
  "do", "did", "can", "could", "would", "should", "following", "given",
  "below", "choose", "correct", "option", "statement", "answer", "among",
  "that", "this", "these", "those", "it", "its", "as", "if", "then",
]);

function keywords(value: string): Set<string> {
  return new Set(plainWords(value).filter((word) => !STOP_WORDS.has(word)));
}

function similarity(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared++;
  return shared / (left.size + right.size - shared);
}

/**
 * Catches close paraphrases, punctuation changes and reordered wording.
 * It intentionally avoids broad 'same chapter' matching: 500 different exam
 * questions must not be mistaken for repeats merely for sharing a topic.
 */
export function findLikelyRepeatedQuizQuestion(
  candidate: string,
  previous: readonly string[],
): string | null {
  const candidateWords = plainWords(candidate);
  const candidateNormalized = candidateWords.join(" ");
  const candidateKeywords = keywords(candidate);
  for (const other of previous) {
    const otherWords = plainWords(other);
    const otherNormalized = otherWords.join(" ");
    if (candidateNormalized === otherNormalized) return other;
    if (candidateNormalized.length < 28 || otherNormalized.length < 28) continue;
    const otherKeywords = keywords(other);
    const both = Math.min(candidateKeywords.size, otherKeywords.size);
    const either = Math.max(candidateKeywords.size, otherKeywords.size);
    if (both < 6 || either === 0 || both / either < 0.72) continue;
    const overlap = similarity(candidateKeywords, otherKeywords);
    if (overlap >= 0.88) return other;
    if (both >= 10 && overlap >= 0.80) return other;
  }
  return null;
}

/**
 * An independent second model call screens every school-board round for
 * board/class/unit mismatch, ambiguous answers and recognizable paraphrases.
 * It cannot independently access/verify textbooks, so don't label its output
 * as an official board certification.
 */
export async function auditSchoolBoardQuiz(input: AuditInput): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const recent = input.previouslySeen.slice(-60);
  const prompt = [
    "You are an independent academic question reviewer, NOT the question writer.",
    "Review EACH of the ten multiple-choice questions and return one review per index.",
    `Curriculum: ${input.board}, Class ${input.schoolClass}, ${input.subject}, ${input.academicYear}.`,
    `Permitted topical units (provisional editorial outline, NOT proof of official coverage): ${JSON.stringify(input.allowedUnits)}`,
    "Reject a question when ANY of these conditions holds:",
    "(1) It tests content outside the selected class, board, subject or declared unit.",
    "(2) Its claimed syllabusUnit is not exactly one of the permitted units.",
    "(3) Its supplied correct answer is wrong, its options have multiple defensible answers, or its explanation is misleading.",
    "(4) It is substantially the same question/problem as an earlier question below, even if paraphrased or with answer options reordered.",
    "(5) It relies on a claimed textbook passage, poem or passage-specific fact not included in the question or supplied curriculum.",
    "If you cannot establish the key fact or scope with confidence, mark accepted=false.",
    "Do NOT claim to have opened the URL or verified an official PDF. This is a screening check.",
    `Previously shown question text (recent examples): ${JSON.stringify(recent)}`,
    `Candidate questions: ${JSON.stringify(input.questions.map((q, i) => ({ index: i + 1, ...q })))}`,
    "Return ONLY JSON with reviews containing index (1-based), accepted and concise reason.",
  ].join("\n");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 3000,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reviews: {
                type: "ARRAY",
                minItems: input.questions.length,
                maxItems: input.questions.length,
                items: {
                  type: "OBJECT",
                  properties: {
                    index: { type: "INTEGER" },
                    accepted: { type: "BOOLEAN" },
                    reason: { type: "STRING" },
                  },
                  required: ["index", "accepted", "reason"],
                },
              },
            },
            required: ["reviews"],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    console.warn("Quiz board audit unavailable, HTTP", response.status);
    return { ok: false, reason: "Independent academic audit unavailable" };
  }

  let reviews: Review[] | undefined;
  try {
    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.flatMap((c) => c.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("") ?? "";
    const result = JSON.parse(text) as { reviews?: Review[] };
    reviews = result.reviews;
  } catch {
    return { ok: false, reason: "Independent academic audit returned invalid data" };
  }

  if (!Array.isArray(reviews) || reviews.length !== input.questions.length) {
    return { ok: false, reason: "Independent academic audit was incomplete" };
  }
  const positions = new Set<number>();
  for (const review of reviews) {
    if (
      !Number.isInteger(review.index) || review.index < 1 ||
      review.index > input.questions.length || positions.has(review.index) ||
      typeof review.accepted !== "boolean" ||
      typeof review.reason !== "string"
    ) {
      return { ok: false, reason: "Independent academic audit failed validation" };
    }
    positions.add(review.index);
    if (!review.accepted) {
      return { ok: false, reason: `Question ${review.index}: ${review.reason.slice(0, 180)}` };
    }
  }
  return { ok: true };
}
