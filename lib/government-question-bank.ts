import { randomUUID, createHash } from "crypto";

import type { Document } from "mongodb";

import {
  COLLECTIONS,
  getCollection,
} from "@/lib/data-store";

import type {
  CompetitiveExam,
  QuizJourneyLevel,
} from "@/lib/quiz-arena-config";

/*
 * SmartIQ Institute
 *
 * Government Examination
 * Topic-Wise Question Bank
 *
 * Each examination has its own:
 *
 * - Subjects
 * - Topics
 * - Questions
 * - Difficulty progression
 *
 * The question bank does not combine
 * questions from different examinations.
 */

export type GovernmentQuestionStatus =
  | "pending"
  | "approved"
  | "rejected";

export type GovernmentQuestionSource =
  | "gemini"
  | "manual"
  | "import";

export type GovernmentQuestion = {
  id: string;

  exam: CompetitiveExam;

  subject: string;

  topicId: string;

  topicName: string;

  progressionLevel: QuizJourneyLevel;

  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  fingerprint: string;

  status: GovernmentQuestionStatus;

  source: GovernmentQuestionSource;

  syllabusYear: number;

  createdAt: string;

  updatedAt: string;

  reviewedAt?: string;

  reviewedBy?: string;
};

type GovernmentQuestionDocument =
  Document & GovernmentQuestion;

/*
 * Question limits
 *
 * 10 levels
 * 50 approved questions per level
 * 500 approved questions per topic
 */

export const GOVERNMENT_QUESTION_BANK_RULES = {
  levels: 10,

  questionsPerLevel: 50,

  questionsPerRound: 10,

  roundsPerLevel: 5,

  questionsPerTopic: 500,
} as const;

/*
 * Normalise question text before
 * producing a duplicate-detection hash.
 */

function normalizeQuestionText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/*
 * A fingerprint identifies an exact
 * normalised question.
 *
 * Near-duplicate detection will be
 * handled separately during review.
 */

export function createGovernmentQuestionFingerprint(
  question: string,
) {
  return createHash("sha256")
    .update(normalizeQuestionText(question))
    .digest("hex");
}

/*
 * MongoDB indexes.
 *
 * Prevent duplicate question IDs and
 * exact duplicate questions within an
 * examination's topic.
 */

let indexesPromise: Promise<void> | null = null;

export async function ensureGovernmentQuestionBankIndexes() {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection =
        await getCollection<GovernmentQuestionDocument>(
          COLLECTIONS.governmentQuestionBank,
        );

      await collection.createIndex(
        {
          id: 1,
        },
        {
          unique: true,
          name: "government_question_unique_id",
        },
      );

      await collection.createIndex(
        {
          exam: 1,
          subject: 1,
          topicId: 1,
          fingerprint: 1,
        },
        {
          unique: true,
          name: "government_question_unique_topic",
        },
      );

      await collection.createIndex(
        {
          exam: 1,
          subject: 1,
          topicId: 1,
          progressionLevel: 1,
          status: 1,
        },
        {
          name: "government_question_selection",
        },
      );
    })().catch((error) => {
      indexesPromise = null;

      throw error;
    });
  }

  return indexesPromise;
}

/*
 * Add a question to the permanent
 * Government Exam question bank.
 *
 * New questions are pending by default.
 *
 * AI-generated questions must not be
 * treated as approved automatically.
 */

export async function createGovernmentQuestion(input: {
  exam: CompetitiveExam;

  subject: string;

  topicId: string;

  topicName: string;

  progressionLevel: QuizJourneyLevel;

  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  source: GovernmentQuestionSource;

  syllabusYear: number;
}) {
  await ensureGovernmentQuestionBankIndexes();

  const questionText = input.question.trim();

  const options = input.options.map(
    (option) => option.trim(),
  );

  if (!questionText) {
    throw new Error("Question text is required.");
  }

  if (
    !Number.isInteger(input.progressionLevel) ||
    input.progressionLevel < 1 ||
    input.progressionLevel > 10
  ) {
    throw new Error(
      "Question level must be between 1 and 10.",
    );
  }

  if (
    !input.subject.trim() ||
    !input.topicId.trim() ||
    !input.topicName.trim()
  ) {
    throw new Error(
      "Examination subject and topic are required.",
    );
  }

  if (
    options.length !== 4 ||
    options.some((option) => !option)
  ) {
    throw new Error(
      "Exactly four non-empty answer options are required.",
    );
  }

  if (new Set(options).size !== options.length) {
    throw new Error(
      "Answer options must be distinct.",
    );
  }

  const correctAnswer = input.correctAnswer.trim();

  if (!options.includes(correctAnswer)) {
    throw new Error(
      "Correct answer must match one of the options.",
    );
  }

  if (!input.explanation.trim()) {
    throw new Error(
      "Every question must include an explanation.",
    );
  }

  if (
    !Number.isInteger(input.syllabusYear) ||
    input.syllabusYear < 2020
  ) {
    throw new Error(
      "A valid syllabus reference year is required.",
    );
  }

  const collection =
    await getCollection<GovernmentQuestionDocument>(
      COLLECTIONS.governmentQuestionBank,
    );

  const fingerprint =
    createGovernmentQuestionFingerprint(questionText);

  const existing = await collection.findOne({
    exam: input.exam,

    subject: input.subject.trim(),

    topicId: input.topicId.trim(),

    fingerprint,
  });

  if (existing) {
    throw new Error(
      "This question already exists in the selected examination topic.",
    );
  }

  const now = new Date().toISOString();

  const question: GovernmentQuestion = {
    id: `government-question-${randomUUID()}`,

    exam: input.exam,

    subject: input.subject.trim(),

    topicId: input.topicId.trim(),

    topicName: input.topicName.trim(),

    progressionLevel: input.progressionLevel,

    question: questionText,

    options,

    correctAnswer,

    explanation: input.explanation.trim(),

    fingerprint,

    status: "pending",

    source: input.source,

    syllabusYear: input.syllabusYear,

    createdAt: now,

    updatedAt: now,
  };

  await collection.insertOne(question);

  return question;
}

/*
 * Count approved questions for a
 * particular examination topic.
 */

export async function getGovernmentTopicQuestionCount(input: {
  exam: CompetitiveExam;

  subject: string;

  topicId: string;

  progressionLevel?: QuizJourneyLevel;
}) {
  const collection =
    await getCollection<GovernmentQuestionDocument>(
      COLLECTIONS.governmentQuestionBank,
    );

  return collection.countDocuments({
    exam: input.exam,

    subject: input.subject,

    topicId: input.topicId,

    status: "approved",

    ...(input.progressionLevel
      ? {
          progressionLevel: input.progressionLevel,
        }
      : {}),
  });
}

/*
 * Retrieve approved questions belonging
 * to one examination, subject, topic
 * and level.
 */

export async function getGovernmentTopicQuestions(input: {
  exam: CompetitiveExam;

  subject: string;

  topicId: string;

  progressionLevel: QuizJourneyLevel;
}) {
  const collection =
    await getCollection<GovernmentQuestionDocument>(
      COLLECTIONS.governmentQuestionBank,
    );

  const questions = await collection
    .find({
      exam: input.exam,

      subject: input.subject,

      topicId: input.topicId,

      progressionLevel: input.progressionLevel,

      status: "approved",
    })
    .toArray();

  return questions.map(({ _id, ...question }) => question);
}