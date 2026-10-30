import "server-only";

import { createHash } from "node:crypto";
import { getMongoDatabase } from "@/lib/mongodb";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type LoginAttempt = {
  _id: string;
  count: number;
  createdAt: Date;
  expiresAt: Date;
};

let indexPromise: Promise<string> | undefined;

async function getAttemptsCollection() {
  const db = await getMongoDatabase();
  const collection = db.collection<LoginAttempt>("auth_login_attempts");

  // MongoDB automatically cleans up old rate-limit records.
  if (!indexPromise) {
    indexPromise = collection
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .catch((error) => {
        indexPromise = undefined;
        throw error;
      });
  }

  await indexPromise;
  return collection;
}

export async function checkLoginRateLimit(login: string): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
}> {
  const normalizedLogin = login.trim().toLowerCase();

  const now = Date.now();
  const windowNumber = Math.floor(now / WINDOW_MS);
  const windowEndsAt = (windowNumber + 1) * WINDOW_MS;

  const loginHash = createHash("sha256").update(normalizedLogin).digest("hex");

  const collection = await getAttemptsCollection();

  // Each account identifier receives an independent counter.
  const result = await collection.findOneAndUpdate(
    {
      _id: `${loginHash}:${windowNumber}`,
    },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        createdAt: new Date(now),
        expiresAt: new Date(windowEndsAt + WINDOW_MS),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  const allowed = Boolean(result && result.count <= MAX_ATTEMPTS);

  return {
    allowed,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((windowEndsAt - now) / 1000)),
  };
}
