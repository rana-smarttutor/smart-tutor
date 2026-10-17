import "server-only";

import { generateGroqQuizJson } from "@/lib/groq-quiz";

/**
 * Additional best-effort academic checks.
 *
 * AI screening cannot certify official syllabus compliance.
 * Keep data/quiz-syllabus-2026-27.json reviewed against
 * the relevant board documents.
 */

type AuditQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  syllabusUnit?: string;
};

type AuditInput = {
  // Retained so existing route callers do not break.
  // Groq uses GROQ_API_KEY from the server environment.
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
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "being",
  "been",
  "in",
  "at",
  "on",
  "to",
  "of",
  "and",
  "or",
  "by",
  "for",
  "with",
  "from",
  "what",
  "which",
  "who",
  "whom",
  "when",
  "where",
  "how",
  "why",
  "does",
  "do",
  "did",
  "can",
  "could",
  "would",
  "should",
  "following",
  "given",
  "below",
  "choose",
  "correct",
  "option",
  "statement",
  "answer",
  "among",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "as",
  "if",
  "then",
]);

function keywords(value: string): Set<string> {
  return new Set(plainWords(value).filter((word) => !STOP_WORDS.has(word)));
}

function similarity(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;

  let shared = 0;

  for (const token of left) {
    if (right.has(token)) shared++;
  }

  return shared / (left.size + right.size - shared);
}

/**
 * Detect exact or close-paraphrased repeats without
 * rejecting unrelated questions from the same topic.
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

    if (candidateNormalized === otherNormalized) {
      return other;
    }

    if (candidateNormalized.length < 28 || otherNormalized.length < 28) {
      continue;
    }

    const otherKeywords = keywords(other);

    const both = Math.min(candidateKeywords.size, otherKeywords.size);

    const either = Math.max(candidateKeywords.size, otherKeywords.size);

    if (both < 6 || either === 0 || both / either < 0.72) {
      continue;
    }

    const overlap = similarity(candidateKeywords, otherKeywords);

    if (overlap >= 0.88) return other;

    if (both >= 10 && overlap >= 0.8) {
      return other;
    }
  }

  return null;
}

/**
 * Independently reviews school-board questions
 * through Groq.
 *
 * Fails closed if the review is incomplete,
 * invalid, unavailable or rejects any question.
 */
export async function auditSchoolBoardQuiz(input: AuditInput): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const recent = input.previouslySeen.slice(-60);

  const prompt = [
    "You are an independent academic question reviewer, NOT the question writer.",
    `Review EACH of the ${input.questions.length} multiple-choice questions.`,
    `Return exactly ${input.questions.length} reviews, one per index.`,
    `Curriculum: ${input.board}, Class ${input.schoolClass}, ${input.subject}, ${input.academicYear}.`,
    `Permitted topical units (provisional editorial outline, NOT proof of official coverage): ${JSON.stringify(input.allowedUnits)}`,
    "Reject a question when ANY of these conditions holds:",
    "(1) It tests content outside the selected class, board, subject or declared unit.",
    "(2) Its claimed syllabusUnit is not exactly one of the permitted units.",
    "(3) Its supplied correct answer is wrong, its options have multiple defensible answers, or its explanation is misleading.",
    "(4) It is substantially the same question/problem as an earlier question below, even if paraphrased or with answer options reordered.",
    "(5) It relies on a claimed textbook passage, poem or passage-specific fact not included in the question or supplied curriculum.",
    "If you cannot establish the key fact or scope with confidence, mark accepted=false.",
    "Do NOT claim to have opened a URL or verified an official PDF.",
    "This is an AI-assisted screening check, not official certification.",
    `Previously shown question text: ${JSON.stringify(recent)}`,
    `Candidate questions: ${JSON.stringify(
      input.questions.map((question, index) => ({
        index: index + 1,
        ...question,
      })),
    )}`,
    'Return ONLY JSON in this format: {"reviews":[{"index":1,"accepted":true,"reason":"Concise justification"}]}',
    "Indexes must start at 1 and include every question exactly once.",
  ].join("\n");

  let reviews: Review[] | undefined;

  try {
    const result = (await generateGroqQuizJson(prompt, {
      temperature: 0,
      maxTokens: 6000,
    })) as {
      reviews?: Review[];
    };

    reviews = result?.reviews;
  } catch (error) {
    console.warn("Groq school-board academic audit unavailable:", error);

    return {
      ok: false,
      reason: "Independent academic audit unavailable",
    };
  }

  if (!Array.isArray(reviews) || reviews.length !== input.questions.length) {
    return {
      ok: false,
      reason: "Independent academic audit was incomplete",
    };
  }

  const positions = new Set<number>();

  for (const review of reviews) {
    if (
      !review ||
      !Number.isInteger(review.index) ||
      review.index < 1 ||
      review.index > input.questions.length ||
      positions.has(review.index) ||
      typeof review.accepted !== "boolean" ||
      typeof review.reason !== "string"
    ) {
      return {
        ok: false,
        reason: "Independent academic audit failed validation",
      };
    }

    positions.add(review.index);

    if (!review.accepted) {
      return {
        ok: false,
        reason: `Question ${review.index}: ${review.reason.slice(0, 180)}`,
      };
    }
  }

  return { ok: true };
}
