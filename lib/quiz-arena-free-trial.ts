import "server-only";

import { getMongoDatabase } from "@/lib/mongodb";

export const QUIZ_ARENA_FREE_TRIAL_COLLECTION = "quiz_arena_free_trial_state";

export type QuizArenaFreeTrialState = {
  _id: string;
  userId: string;
  draftId: string | null;
  consumed: boolean;
  completedAttemptId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export class QuizArenaTrialError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "FREE_TRIAL_USED"
      | "FREE_TRIAL_RESERVED"
      | "FREE_TRIAL_ROUND_INVALID"
      | "FREE_TRIAL_NOT_RESERVED"
      | "FREE_TRIAL_DRAFT_MISMATCH"
      | "FREE_TRIAL_ATTEMPT_MISMATCH",
  ) {
    super(message);
    this.name = "QuizArenaTrialError";
  }
}

async function getTrialCollection() {
  const db = await getMongoDatabase();

  // MongoDB automatically provides a unique _id index.
  // The student ID is the permanent trial identifier.
  return db.collection<QuizArenaFreeTrialState>(
    QUIZ_ARENA_FREE_TRIAL_COLLECTION,
  );
}

export async function getQuizArenaFreeTrialState(
  userId: string,
): Promise<QuizArenaFreeTrialState | null> {
  if (!userId.trim()) {
    throw new Error("Student ID is required.");
  }

  const collection = await getTrialCollection();

  return collection.findOne({
    _id: userId,
  });
}

export async function reserveQuizArenaFreeTrial(input: {
  userId: string;
  draftId: string;
  progressionLevel: number;
  round: number;
}): Promise<QuizArenaFreeTrialState> {
  if (input.progressionLevel !== 1 || input.round !== 1) {
    throw new QuizArenaTrialError(
      "Your free trial is available for Level 1, Round 1 only.",
      "FREE_TRIAL_ROUND_INVALID",
    );
  }

  if (!input.userId.trim() || !input.draftId.trim()) {
    throw new Error("Student ID and draft ID are required.");
  }

  const collection = await getTrialCollection();
  const now = new Date().toISOString();

  // A permanent record is created only once per student.
  //
  // MongoDB's unique _id ensures that the same student
  // cannot obtain multiple trial records.
  //
  // This operation does not reset an existing trial.
  try {
    await collection.updateOne(
      {
        _id: input.userId,
      },
      {
        $setOnInsert: {
          userId: input.userId,
          draftId: null,
          consumed: false,
          completedAttemptId: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        },
      },
      {
        upsert: true,
      },
    );
  } catch (error) {
    // Concurrent first-time requests may race to insert
    // the same _id. Only one insert can win.
    //
    // Continue to the atomic reservation check.
    const isDuplicateKey =
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000;

    if (!isDuplicateKey) {
      throw error;
    }
  }

  // Atomically bind the trial to one draft.
  //
  // Another draft cannot replace this reservation.
  // A repeated request for the same draft is safe.
  const reserved = await collection.findOneAndUpdate(
    {
      _id: input.userId,
      consumed: false,
      $or: [{ draftId: null }, { draftId: input.draftId }],
    },
    {
      $set: {
        draftId: input.draftId,
        updatedAt: now,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (reserved) {
    return reserved;
  }

  const existing = await collection.findOne({
    _id: input.userId,
  });

  if (existing?.consumed) {
    throw new QuizArenaTrialError(
      "Your free Quiz Arena trial has ended. Please subscribe to continue.",
      "FREE_TRIAL_USED",
    );
  }

  throw new QuizArenaTrialError(
    "You already have a free quiz in progress. Please resume that quiz.",
    "FREE_TRIAL_RESERVED",
  );
}

/**
 * Permanently consumes a student's free trial.
 *
 * IMPORTANT:
 * Call this function ONLY after the server has verified
 * and successfully saved the completed quiz attempt.
 *
 * Do not call it from a client request that merely
 * claims a quiz was completed.
 *
 * For an existing draft, the attempt must belong to
 * the same student and reserved draft.
 */
export async function consumeQuizArenaFreeTrial(input: {
  userId: string;
  draftId: string;
  completedAttemptId: string;
}): Promise<QuizArenaFreeTrialState> {
  const userId = input.userId.trim();
  const draftId = input.draftId.trim();
  const completedAttemptId = input.completedAttemptId.trim();

  if (!userId || !draftId || !completedAttemptId) {
    throw new Error(
      "Student ID, draft ID and completed attempt ID are required.",
    );
  }

  const collection = await getTrialCollection();
  const now = new Date().toISOString();

  // Only the original, reserved draft can consume
  // this student's trial.
  //
  // Atomic update protects against simultaneous
  // completion requests.
  const consumed = await collection.findOneAndUpdate(
    {
      _id: userId,
      userId,
      draftId,
      consumed: false,
    },
    {
      $set: {
        consumed: true,
        completedAttemptId,
        completedAt: now,
        updatedAt: now,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (consumed) {
    return consumed;
  }

  const existing = await collection.findOne({
    _id: userId,
  });

  // Retry-safe: the exact same attempt may have
  // already completed successfully.
  if (
    existing?.consumed &&
    existing.draftId === draftId &&
    existing.completedAttemptId === completedAttemptId
  ) {
    return existing;
  }

  if (existing?.consumed) {
    throw new QuizArenaTrialError(
      "This free trial has already been completed by another attempt.",
      "FREE_TRIAL_ATTEMPT_MISMATCH",
    );
  }

  if (!existing || !existing.draftId) {
    throw new QuizArenaTrialError(
      "No reserved free quiz was found for this student.",
      "FREE_TRIAL_NOT_RESERVED",
    );
  }

  if (existing.draftId !== draftId) {
    throw new QuizArenaTrialError(
      "The completed quiz does not match the reserved free trial.",
      "FREE_TRIAL_DRAFT_MISMATCH",
    );
  }

  throw new Error("Unable to finalise the free trial. Please try again.");
}
