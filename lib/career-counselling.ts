import "server-only";

import { getMongoDatabase } from "@/lib/mongodb";
import type { Role } from "@/lib/types";

export const CAREER_ROLES: Role[] = [
  "admin",
  "educator",
  "staff",
  "counsellor",
];

export const CAREER_STATUSES = [
  "new",
  "in-progress",
  "follow-up",
  "completed",
] as const;

export type CareerStatus = (typeof CAREER_STATUSES)[number];

export type CareerDetails = {
  studentName: string;
  dateOfBirth: string;
  studentPhone: string;
  parentName: string;
  parentWhatsapp: string;
  email: string;
  city: string;
  classLevel: string;
  board: string;
  school: string;
  academicPercentage: string;
  strongSubjects: string[];
  weakSubjects: string[];
  interests: string[];
  careerGoal: string;
  preferredStream: string;
  preferredLearningStyle: string;
  examInterests: string[];
  parentExpectations: string;
  challenges: string;
  counsellorNotes: string;
  recommendedPrograms: string[];
  followUpDate: string;
  status: CareerStatus;
  aiConsent: boolean;
  whatsappConsent: boolean;
};

export type CareerRecord = CareerDetails & {
  id: string;
  aiSuggestion: string;
  aiReviewed: boolean;
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
};

export const EMPTY_CAREER_DETAILS: CareerDetails = {
  studentName: "",
  dateOfBirth: "",
  studentPhone: "",
  parentName: "",
  parentWhatsapp: "",
  email: "",
  city: "",
  classLevel: "",
  board: "",
  school: "",
  academicPercentage: "",
  strongSubjects: [],
  weakSubjects: [],
  interests: [],
  careerGoal: "",
  preferredStream: "",
  preferredLearningStyle: "",
  examInterests: [],
  parentExpectations: "",
  challenges: "",
  counsellorNotes: "",
  recommendedPrograms: [],
  followUpDate: "",
  status: "new",
  aiConsent: false,
  whatsappConsent: false,
};

const STRING_FIELDS = [
  "studentName",
  "dateOfBirth",
  "studentPhone",
  "parentName",
  "parentWhatsapp",
  "email",
  "city",
  "classLevel",
  "board",
  "school",
  "academicPercentage",
  "careerGoal",
  "preferredStream",
  "preferredLearningStyle",
  "parentExpectations",
  "challenges",
  "counsellorNotes",
  "followUpDate",
] as const;

const ARRAY_FIELDS = [
  "strongSubjects",
  "weakSubjects",
  "interests",
  "examInterests",
  "recommendedPrograms",
] as const;

export function parseCareerDetails(input: unknown): CareerDetails {
  const obj =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const result: CareerDetails = {
    ...EMPTY_CAREER_DETAILS,
    strongSubjects: [],
    weakSubjects: [],
    interests: [],
    examInterests: [],
    recommendedPrograms: [],
  };

  for (const field of STRING_FIELDS) {
    result[field] =
      typeof obj[field] === "string"
        ? obj[field].trim().slice(
            0,
            field === "counsellorNotes" ? 4000 : 800,
          )
        : "";
  }

  for (const field of ARRAY_FIELDS) {
    const raw = obj[field];

    result[field] = Array.isArray(raw)
      ? raw
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim().slice(0, 100))
          .filter(Boolean)
          .slice(0, 30)
      : [];
  }

  result.status = CAREER_STATUSES.includes(
    obj.status as CareerStatus,
  )
    ? (obj.status as CareerStatus)
    : "new";

  result.aiConsent = obj.aiConsent === true;
  result.whatsappConsent = obj.whatsappConsent === true;

  return result;
}

export async function careerCollection() {
  const database = await getMongoDatabase();

  return database.collection("career_counselling_enquiries");
}

export function toCareerRecord(
  doc: Record<string, any>,
): CareerRecord {
  return {
    ...parseCareerDetails(doc),

    id: String(doc._id),

    aiSuggestion:
      typeof doc.aiSuggestion === "string"
        ? doc.aiSuggestion
        : "",

    aiReviewed: doc.aiReviewed === true,

    createdBy: String(doc.createdBy ?? ""),

    createdByName: String(doc.createdByName ?? ""),

    updatedBy: String(doc.updatedBy ?? ""),

    createdAt: String(doc.createdAt ?? ""),

    updatedAt: String(doc.updatedAt ?? ""),
  };
}
