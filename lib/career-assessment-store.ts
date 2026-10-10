
import "server-only";

import {
  ObjectId,
  type Collection,
} from "mongodb";

import { getMongoDatabase } from "@/lib/mongodb";

import {
  type AssessmentAnswers,
  type CareerAssessmentResult,
  scoreCareerAssessment,
} from "@/lib/career-assessment";

import {
  CAREER_APTITUDE_QUESTIONS,
  CAREER_INTEREST_QUESTIONS,
  CAREER_QUESTION_BANK_VERSION,
} from "@/lib/career-assessment-questions";

export const ASSESSMENT_DURATION_MINUTES = 45;

export type AssessmentStatus =
  | "in-progress"
  | "submitted";

export type AssessmentDocument = {
  _id: ObjectId;
  enquiryId: ObjectId;
  bankVersion: number;
  status: AssessmentStatus;
  answers: AssessmentAnswers;
  result: CareerAssessmentResult | null;
  createdBy: string;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  submittedAt?: string;
};

export async function assessmentCollection(): Promise<
  Collection<AssessmentDocument>
> {
  const database = await getMongoDatabase();

  return database.collection<AssessmentDocument>(
    "career_assessment_sessions",
  );
}

export function validObjectId(
  value: string,
): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function normalizeAssessmentAnswers(
  input: unknown,
): AssessmentAnswers {
  const source = isObject(input) ? input : {};

  const allowedAptitude = new Map(
    CAREER_APTITUDE_QUESTIONS.map((question) => [
      question.id,
      new Set(
        question.options.map((option) => option.id),
      ),
    ]),
  );

  const allowedInterest = new Set(
    CAREER_INTEREST_QUESTIONS.map(
      (question) => question.id,
    ),
  );

  const aptitudeMap = new Map<string, string>();
  const interestMap = new Map<string, number>();

  if (Array.isArray(source.aptitude)) {
    for (const raw of source.aptitude.slice(0, 300)) {
      if (!isObject(raw)) continue;

      const questionId = raw.questionId;
      const optionId = raw.optionId;

      if (
        typeof questionId === "string" &&
        typeof optionId === "string" &&
        allowedAptitude.get(questionId)?.has(optionId)
      ) {
        aptitudeMap.set(questionId, optionId);
      }
    }
  }

  if (Array.isArray(source.interests)) {
    for (const raw of source.interests.slice(0, 150)) {
      if (!isObject(raw)) continue;

      const questionId = raw.questionId;
      const rating = raw.rating;

      if (
        typeof questionId === "string" &&
        allowedInterest.has(questionId) &&
        typeof rating === "number" &&
        Number.isInteger(rating) &&
        rating >= 1 &&
        rating <= 5
      ) {
        interestMap.set(questionId, rating);
      }
    }
  }

  return {
    aptitude: Array.from(
      aptitudeMap,
      ([questionId, optionId]) => ({
        questionId,
        optionId,
      }),
    ),
    interests: Array.from(
      interestMap,
      ([questionId, rating]) => ({
        questionId,
        rating,
      }),
    ),
  };
}

export function calculateAssessmentResult(
  answers: AssessmentAnswers,
): CareerAssessmentResult {
  return scoreCareerAssessment(
    CAREER_APTITUDE_QUESTIONS,
    CAREER_INTEREST_QUESTIONS,
    answers,
  );
}

export function assessmentExpired(
  session: AssessmentDocument,
): boolean {
  return Date.now() >= Date.parse(session.expiresAt);
}

export function newAssessmentDocument(
  enquiryId: ObjectId,
  createdBy: string,
): AssessmentDocument {
  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      ASSESSMENT_DURATION_MINUTES * 60_000,
  );

  return {
    _id: new ObjectId(),
    enquiryId,
    bankVersion: CAREER_QUESTION_BANK_VERSION,
    status: "in-progress",
    answers: {
      aptitude: [],
      interests: [],
    },
    result: null,
    createdBy,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function publicAssessmentSession(
  session: AssessmentDocument,
) {
  return {
    id: session._id.toHexString(),
    enquiryId: session.enquiryId.toHexString(),
    bankVersion: session.bankVersion,
    status: session.status,
    answers: session.answers,
    result:
      session.status === "submitted"
        ? session.result
        : null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    submittedAt: session.submittedAt ?? null,
  };
}
