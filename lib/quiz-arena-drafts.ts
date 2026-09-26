import "server-only";

import { randomUUID } from "crypto";

import type { Document } from "mongodb";

import {
  COLLECTIONS,
  getCollection,
} from "@/lib/data-store";

import type {
  CompetitiveExam,
  Difficulty,
  EducationLevel,
  QuizBoard,
  QuizJourneyLevel,
  QuizRound,
  QuizSchoolClass,
} from "@/lib/quiz-arena-config";

import type {
  QuizQuestion,
} from "@/lib/quiz-arena-questions";

export type QuizArenaDraftStatus =
  | "in_progress"
  | "completed"
  | "abandoned";

export type QuizArenaDraftSource =
  | "quiz-arena"
  | "mock-test";

export type QuizArenaDraft = {
  id: string;

  userId: string;

  source: QuizArenaDraftSource;

  level: EducationLevel;

  exam: CompetitiveExam;

  schoolClass: QuizSchoolClass | null;

  board: QuizBoard | null;

  subject: string;

  topicId?: string | null;

  progressionLevel: QuizJourneyLevel;

  round: QuizRound;

  difficulty: Difficulty;

  questions: QuizQuestion[];

  answersByIndex: Record<string, string>;

  timeByIndex: Record<string, number>;

  markedForReview: number[];

  questionIndex: number;

  elapsedMs: number;

  status: QuizArenaDraftStatus;

  revision: number;

  createdAt: string;

  updatedAt: string;
};

type QuizArenaDraftDocument =
  QuizArenaDraft & Document;

export type StartQuizArenaDraftInput =
  Omit<
    QuizArenaDraft,
    | "id"
    | "userId"
    | "status"
    | "revision"
    | "createdAt"
    | "updatedAt"
  > & {
    userId: string;

    replaceDraftId?: string;
  };

export type SaveQuizArenaDraftInput =
  Pick<
    QuizArenaDraft,
    | "answersByIndex"
    | "timeByIndex"
    | "markedForReview"
    | "questionIndex"
    | "elapsedMs"
    | "revision"
  > & {
    id: string;

    userId: string;
  };

let indexesPromise: Promise<void> | null =
  null;

async function getDraftCollection() {
  const collection =
    await getCollection<QuizArenaDraftDocument>(
      COLLECTIONS.quizArenaDrafts,
    );

  if (!indexesPromise) {
    indexesPromise = collection
      .createIndex(
        {
          userId: 1,
        },
        {
          unique: true,
          name: "quiz_drafts_unique_user",
        },
      )
      .then(() => undefined)
      .catch((error) => {
        indexesPromise = null;

        throw error;
      });
  }

  await indexesPromise;

  return collection;
}

export async function getActiveQuizArenaDraft(
  userId: string,
): Promise<QuizArenaDraft | null> {
  const collection =
    await getDraftCollection();

  const draft = await collection.findOne(
    {
      userId,

      status: "in_progress",
    },
    {
      projection: {
        _id: 0,
      },
    },
  );

  return draft ?? null;
}

export async function startQuizArenaDraft(
  input: StartQuizArenaDraftInput,
): Promise<QuizArenaDraft> {
  const {
    userId,
    replaceDraftId,
    ...draftData
  } = input;

  const collection =
    await getDraftCollection();

  const existing = await collection.findOne({
    userId,
  });

  if (
    existing?.status === "in_progress" &&
    existing.id !== replaceDraftId
  ) {
    throw new Error(
      "An unfinished quiz already exists. Continue it or confirm that you want to start a new quiz.",
    );
  }

  const now = new Date().toISOString();

  const draft: QuizArenaDraft = {
    ...draftData,

    id: `quiz-draft-${randomUUID()}`,

    userId,

    answersByIndex: {},

    timeByIndex: {},

    markedForReview: [],

    questionIndex: 0,

    elapsedMs: 0,

    status: "in_progress",

    revision: 0,

    createdAt: now,

    updatedAt: now,
  };

  if (existing) {
    const result = await collection.updateOne(
      {
        userId,

        id: existing.id,

        status: existing.status,
      },
      {
        $set: draft,
      },
    );

    if (result.matchedCount !== 1) {
      throw new Error(
        "The previous quiz changed. Please refresh and try again.",
      );
    }
  } else {
    await collection.insertOne(draft);
  }

  return draft;
}

export async function saveQuizArenaDraft(
  input: SaveQuizArenaDraftInput,
): Promise<boolean> {
  const collection =
    await getDraftCollection();

  const result = await collection.updateOne(
    {
      id: input.id,

      userId: input.userId,

      status: "in_progress",

      revision: {
        $lt: input.revision,
      },
    },
    {
      $set: {
        answersByIndex:
          input.answersByIndex,

        timeByIndex:
          input.timeByIndex,

        markedForReview:
          input.markedForReview,

        questionIndex:
          input.questionIndex,

        elapsedMs:
          input.elapsedMs,

        revision:
          input.revision,

        updatedAt:
          new Date().toISOString(),
      },
    },
  );

  return result.matchedCount === 1;
}

export async function setQuizArenaDraftStatus(
  input: {
    id: string;

    userId: string;

    status: "completed" | "abandoned";
  },
): Promise<boolean> {
  const collection =
    await getDraftCollection();

  const result = await collection.updateOne(
    {
      id: input.id,

      userId: input.userId,

      status: "in_progress",
    },
    {
      $set: {
        status: input.status,

        updatedAt:
          new Date().toISOString(),
      },
    },
  );

  return result.matchedCount === 1;
}