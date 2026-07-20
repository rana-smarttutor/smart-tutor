import type { Db } from "mongodb";

const COLLECTION_NAME = "chatPolicyViolations";

type ChatPolicyDocument = {
  userId: string;
  violationCount: number;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: Date;
  updatedAt: Date;
  blockedAt?: Date;
};

export async function getChatPolicy(
  database: Db,
  userId: string,
) {
  const policy = await database
    .collection<ChatPolicyDocument>(COLLECTION_NAME)
    .findOne({ userId });

  return {
    violationCount: policy?.violationCount ?? 0,
    isBlocked: policy?.isBlocked ?? false,
    blockReason:
      policy?.blockReason ??
      "Chat access has been blocked because of repeated policy violations.",
  };
}

export async function registerChatViolation(
  database: Db,
  userId: string,
) {
  const collection =
    database.collection<ChatPolicyDocument>(
      COLLECTION_NAME,
    );

  const now = new Date();

  await collection.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        isBlocked: false,
        createdAt: now,
      },
      $inc: {
        violationCount: 1,
      },
      $set: {
        updatedAt: now,
      },
    },
    {
      upsert: true,
    },
  );

  const policy = await collection.findOne({ userId });

  const violationCount = policy?.violationCount ?? 1;
  const shouldBlock = violationCount >= 3;

  if (shouldBlock) {
    await collection.updateOne(
      { userId },
      {
        $set: {
          isBlocked: true,
          blockedAt: now,
          updatedAt: now,
          blockReason:
            "Chat access was blocked after repeated attempts to share restricted information.",
        },
      },
    );
  }

  return {
    violationCount,
    warningCount: Math.min(violationCount, 2),
    warningsRemaining: Math.max(0, 2 - violationCount),
    blocked: shouldBlock,
  };
}