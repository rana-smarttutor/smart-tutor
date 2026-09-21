import "server-only";

import { createHash, randomUUID } from "crypto";
import type { Document } from "mongodb";
import { COLLECTIONS, getCollection } from "@/lib/data-store";

type SeenQuestion = Document & {
  userId: string;
  hash: string;
  question: string;
  reservationId: string;
  createdAt: string;
};

let indexPromise: Promise<string> | null = null;

function collection() {
  return getCollection<SeenQuestion>(COLLECTIONS.quizArenaSeenQuestions);
}

export function questionHash(question: string): string {
  // Equivalent case, spacing and punctuation produce the same fingerprint.
  const normalized = question.normalize("NFKC").toLowerCase()
    .replace(/[^\p{L}\p{N}+*\/=<>%-]+/gu, " ")
    .replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex");
}

export async function getPreviouslySeenQuizQuestions(
  userId: string,
): Promise<string[]> {
  const [seen, attempts, draft] = await Promise.all([
    (await collection()).find({ userId }, { projection: { question: 1, _id: 0 } }).toArray(),
    (await getCollection<Document>(COLLECTIONS.quizArenaAttempts))
      .find({ userId }, { projection: { questions: 1, _id: 0 } }).toArray(),
    (await getCollection<Document>(COLLECTIONS.quizArenaDrafts))
      .find({ userId }, { projection: { questions: 1, _id: 0 } }).toArray(),
  ]);

  const all = [
    ...seen.map((row) => row.question),
    ...attempts.flatMap((attempt) =>
      (Array.isArray(attempt.questions) ? attempt.questions : [])
        .map((question: { question?: unknown }) => question?.question),
    ),
    ...draft.flatMap((item) =>
      (Array.isArray(item.questions) ? item.questions : [])
        .map((question: { question?: unknown }) => question?.question),
    ),
  ];

  const result: string[] = [];
  const hashes = new Set<string>();
  for (const value of all) {
    if (typeof value !== "string" || !value.trim()) continue;
    const hash = questionHash(value);
    if (hashes.has(hash)) continue;
    hashes.add(hash);
    result.push(value);
  }
  return result;
}

/**
 * Reserve on generation (not only after finishing) so a quiz the learner
 * has already opened cannot silently reappear after Save & Exit / replacement.
 * A compound unique index prevents two concurrent requests from reserving
 * identical questions for one user.
 */
export async function reserveQuizQuestions(
  userId: string,
  questions: string[],
): Promise<boolean> {
  const coll = await collection();
  if (!indexPromise) {
    indexPromise = coll.createIndex(
      { userId: 1, hash: 1 },
      { unique: true, name: "quiz_seen_unique_user_hash" },
    ).catch((error) => {
      indexPromise = null;
      throw error;
    });
  }
  await indexPromise;

  const hashes = questions.map(questionHash);
  if (new Set(hashes).size !== hashes.length) return false;

  const reservationId = randomUUID();
  try {
    await coll.insertMany(
      questions.map((question, index) => ({
        userId,
        hash: hashes[index],
        question,
        reservationId,
        createdAt: new Date().toISOString(),
      })),
      { ordered: false },
    );
    return true;
  } catch (error) {
    // A bulk insert may partially succeed. Release only our own reservations.
    await coll.deleteMany({ userId, reservationId });
    const duplicate = typeof error === "object" && error !== null &&
      "code" in error && error.code === 11000;
    if (duplicate) return false;
    throw error;
  }
}
