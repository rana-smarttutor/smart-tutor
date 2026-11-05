import "server-only";

import { createHash, randomUUID } from "crypto";
import type { Document } from "mongodb";
import { getMongoDatabase } from "@/lib/mongodb";
import type { QuizQuestion } from "@/lib/quiz-arena-questions";

const COLLECTION = "quiz_arena_generated_question_sets";
const VALID_FOR_MS = 24 * 60 * 60 * 1000;

type GeneratedSet = Document & {
  id: string;
  userId: string;
  source: "quiz-arena" | "mock-test";
  questionDigest: string;
  createdAt: Date;
  expiresAt: Date;
};

function digest(questions: QuizQuestion[]): string {
  return createHash("sha256").update(JSON.stringify(questions)).digest("hex");
}

async function getCollection() {
  const db = await getMongoDatabase();
  const collection = db.collection<GeneratedSet>(COLLECTION);
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ userId: 1, id: 1 }, { unique: true });
  return collection;
}

/** Record the exact question set created by the authenticated server. */
export async function registerQuizArenaGeneratedSet(input: {
  userId: string;
  source: "quiz-arena" | "mock-test";
  questions: QuizQuestion[];
}): Promise<void> {
  const collection = await getCollection();
  const now = new Date();
  await collection.insertOne({
    id: randomUUID(),
    userId: input.userId,
    source: input.source,
    questionDigest: digest(input.questions),
    createdAt: now,
    expiresAt: new Date(now.getTime() + VALID_FOR_MS),
  });
}

/** Reject manipulated or fabricated question sets before saving a draft. */
export async function isServerGeneratedQuizArenaSet(input: {
  userId: string;
  source: "quiz-arena" | "mock-test";
  questions: QuizQuestion[];
}): Promise<boolean> {
  const collection = await getCollection();
  const record = await collection.findOne({
    userId: input.userId,
    source: input.source,
    questionDigest: digest(input.questions),
    expiresAt: { $gt: new Date() },
  });
  return Boolean(record);
}
