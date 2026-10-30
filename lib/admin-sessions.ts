
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getMongoDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "admin_sessions";

export const ADMIN_SESSION_PREFIX = "siq_admin_v1_";
export const ADMIN_IDLE_MS = 20 * 60 * 1000;
export const ADMIN_ABSOLUTE_MS = 2 * 60 * 60 * 1000;

type AdminSessionDocument = {
  tokenHash: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt?: Date;
};

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

async function getSessionsCollection() {
  const db = await getMongoDatabase();

  return db.collection<AdminSessionDocument>(
    COLLECTION_NAME,
  );
}

export async function createAdminSession(userId: string) {
  const token =
    ADMIN_SESSION_PREFIX + randomBytes(32).toString("hex");

  const now = new Date();
  const absoluteExpiresAt = new Date(
    now.getTime() + ADMIN_ABSOLUTE_MS,
  );

  const collection = await getSessionsCollection();

  await collection.insertOne({
    tokenHash: hashToken(token),
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + ADMIN_IDLE_MS),
    absoluteExpiresAt,
  });

  return token;
}


export async function validateAdminSession(
  token: string,
): Promise<string | null> {
  if (!/^siq_admin_v1_[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const collection = await getSessionsCollection();
  const now = new Date();

  const updated = await collection.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      revokedAt: { $exists: false },
      expiresAt: { $gt: now },
      absoluteExpiresAt: { $gt: now },
    },
    [
      {
        $set: {
          lastSeenAt: now,
          expiresAt: {
            $min: [
              new Date(now.getTime() + ADMIN_IDLE_MS),
              "$absoluteExpiresAt",
            ],
          },
        },
      },
    ],
    { returnDocument: "after" },
  );

  return updated?.userId ?? null;
}


export async function revokeAdminSession(
  token: string,
): Promise<void> {
  if (!/^siq_admin_v1_[a-f0-9]{64}$/.test(token)) {
    return;
  }

  const collection = await getSessionsCollection();

  await collection.updateOne(
    {
      tokenHash: hashToken(token),
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
}

export async function revokeAllAdminSessions(
  userId: string,
): Promise<void> {
  const collection = await getSessionsCollection();

  await collection.updateMany(
    {
      userId,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
}
