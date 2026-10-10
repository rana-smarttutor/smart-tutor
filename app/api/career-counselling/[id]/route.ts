
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  CAREER_ROLES,
  careerCollection,
  parseCareerDetails,
  toCareerRecord,
} from "@/lib/career-counselling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function text(value: unknown, max = 800): string {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) => item.trim().slice(0, 100))
        .filter(Boolean)
        .slice(0, 30)
    : [];
}

const EDITABLE_FIELDS = {
  aboutYou: [
    "studentName",
    "dateOfBirth",
    "gender",
    "mobile",
    "email",
    "city",
    "language",
    "guardianName",
    "guardianRelation",
    "guardianMobile",
  ],
  education: [
    "currentClass",
    "board",
    "institution",
    "recentScore",
    "class10Score",
    "class12Score",
    "degree",
    "currentStream",
    "tuition",
    "strongSubjects",
    "weakSubjects",
    "entranceExams",
  ],
  interests: [
    "areas",
    "careerGoal",
    "preferredStream",
    "learningStyle",
    "hobbies",
    "parentExpectations",
    "constraints",
  ],
  routine: [
    "sleepHours",
    "schoolHours",
    "selfStudyHours",
    "tuitionHours",
    "screenHours",
    "physicalHours",
    "focusMinutes",
    "wakeTime",
    "bedtime",
    "biggestObstacle",
    "preferredStudyTime",
  ],
} as const;

const ARRAY_FIELDS = new Set([
  "strongSubjects",
  "weakSubjects",
  "entranceExams",
  "areas",
]);

function ageFromDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);
  const today = new Date();

  if (
    year < 1900 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > today
  ) {
    return null;
  }

  let age = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 &&
      today.getDate() < day)
  ) {
    age--;
  }

  return age;
}

function normalizeSection(
  existing: JsonObject,
  incoming: JsonObject,
  fields: readonly string[],
): JsonObject {
  const result: JsonObject = { ...existing };

  for (const key of fields) {
    if (!Object.prototype.hasOwnProperty.call(incoming, key)) {
      continue;
    }

    result[key] = ARRAY_FIELDS.has(key)
      ? stringArray(incoming[key])
      : text(
          incoming[key],
          key === "biggestObstacle" ||
            key === "parentExpectations" ||
            key === "constraints"
            ? 2000
            : 800,
        );
  }

  return result;
}

function buildQuestionnaireUpdate(
  incoming: unknown,
  existing: unknown,
):
  | { questionnaire: JsonObject }
  | { error: string } {
  if (!isObject(incoming)) {
    return { error: "Invalid questionnaire data." };
  }

  if (!isObject(existing) || existing.version !== 1) {
    return {
      error:
        "This enquiry does not have an editable five-step questionnaire.",
    };
  }

  if (incoming.version !== 1) {
    return {
      error: "Unsupported questionnaire version.",
    };
  }

  const aboutYou = normalizeSection(
    isObject(existing.aboutYou) ? existing.aboutYou : {},
    isObject(incoming.aboutYou) ? incoming.aboutYou : {},
    EDITABLE_FIELDS.aboutYou,
  );

  const education = normalizeSection(
    isObject(existing.education) ? existing.education : {},
    isObject(incoming.education) ? incoming.education : {},
    EDITABLE_FIELDS.education,
  );

  const interests = normalizeSection(
    isObject(existing.interests) ? existing.interests : {},
    isObject(incoming.interests) ? incoming.interests : {},
    EDITABLE_FIELDS.interests,
  );

  const routine = normalizeSection(
    isObject(existing.routine) ? existing.routine : {},
    isObject(incoming.routine) ? incoming.routine : {},
    EDITABLE_FIELDS.routine,
  );

  const name = text(aboutYou.studentName);
  const dob = text(aboutYou.dateOfBirth);
  const studentPhone = text(aboutYou.mobile);
  const guardianPhone = text(aboutYou.guardianMobile);

  const validPhone = (phone: string) =>
    /^[6-9]\d{9}$/.test(phone);

  if (name.length < 2) {
    return { error: "Student name is required." };
  }

  const age = ageFromDate(dob);

  if (age === null) {
    return { error: "Enter a valid date of birth." };
  }

  if (
    (studentPhone && !validPhone(studentPhone)) ||
    (guardianPhone && !validPhone(guardianPhone))
  ) {
    return {
      error: "Enter valid 10-digit mobile numbers.",
    };
  }

  if (!studentPhone && !guardianPhone) {
    return {
      error: "A student or guardian mobile number is required.",
    };
  }

  if (
    age < 18 &&
    (
      !text(aboutYou.guardianName) ||
      !guardianPhone ||
      !text(aboutYou.guardianRelation) ||
      aboutYou.guardianConsent !== true
    )
  ) {
    return {
      error:
        "A minor requires guardian details and previously recorded guardian consent.",
    };
  }

  const email = text(aboutYou.email);

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Enter a valid email address." };
  }

  for (const key of [
    "sleepHours",
    "schoolHours",
    "selfStudyHours",
    "tuitionHours",
    "screenHours",
    "physicalHours",
    "focusMinutes",
  ]) {
    const value = text(routine[key]);

    if (!value) continue;

    const maximum = key === "focusMinutes" ? 600 : 24;
    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0 ||
      number > maximum
    ) {
      return {
        error: `Invalid value for ${key}.`,
      };
    }
  }

  // Preserve original consent values.
  // General questionnaire edits cannot grant
  // or alter existing consent.
  const questionnaire: JsonObject = {
    ...existing,
    version: 1,
    aboutYou,
    education,
    interests,
    routine,
    consent: isObject(existing.consent)
      ? { ...existing.consent }
      : {},
  };

  return { questionnaire };
}

export async function PATCH(
  request: Request,
  { params }: Context,
) {
  try {
    const session = await getSessionUser();

    if (
      !session ||
      !hasAnyRole(session, CAREER_ROLES) ||
      (session.status && session.status !== "active")
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid record ID." },
        { status: 400 },
      );
    }

    const payload: unknown = await request
      .json()
      .catch(() => null);

    if (!isObject(payload)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const collection = await careerCollection();
    const _id = new ObjectId(id);

    const old = await collection.findOne({ _id });

    if (!old) {
      return NextResponse.json(
        { error: "Record not found." },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    // ----------------------------------------
    // FULL QUESTIONNAIRE UPDATE
    // ----------------------------------------
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "questionnaire",
      )
    ) {
      if (
        typeof payload.updatedAt !== "string" ||
        payload.updatedAt !== old.updatedAt
      ) {
        return NextResponse.json(
          {
            error:
              "This enquiry has changed. Refresh the record before editing again.",
          },
          { status: 409 },
        );
      }

      const normalized = buildQuestionnaireUpdate(
        payload.questionnaire,
        old.questionnaire,
      );

      if ("error" in normalized) {
        return NextResponse.json(
          { error: normalized.error },
          { status: 400 },
        );
      }

      const next = normalized.questionnaire;

      const about = isObject(next.aboutYou)
        ? next.aboutYou
        : {};

      const education = isObject(next.education)
        ? next.education
        : {};

      const interests = isObject(next.interests)
        ? next.interests
        : {};

      const routine = isObject(next.routine)
        ? next.routine
        : {};

      const oldAbout = isObject(old.questionnaire)
        ? isObject(old.questionnaire.aboutYou)
          ? old.questionnaire.aboutYou
          : {}
        : {};

      const oldEducation = isObject(old.questionnaire)
        ? isObject(old.questionnaire.education)
          ? old.questionnaire.education
          : {}
        : {};

      const oldInterests = isObject(old.questionnaire)
        ? isObject(old.questionnaire.interests)
          ? old.questionnaire.interests
          : {}
        : {};

      const oldRoutine = isObject(old.questionnaire)
        ? isObject(old.questionnaire.routine)
          ? old.questionnaire.routine
          : {}
        : {};

      const changedForAI =
        JSON.stringify(oldEducation) !==
          JSON.stringify(education) ||
        JSON.stringify(oldInterests) !==
          JSON.stringify(interests) ||
        JSON.stringify(oldRoutine) !==
          JSON.stringify(routine) ||
        JSON.stringify(oldAbout.educationStage) !==
          JSON.stringify(about.educationStage);

      const previousDetails = parseCareerDetails(old);

      const stage = text(about.educationStage);

      const classLevel = stage.startsWith("class-")
        ? text(education.currentClass)
        : stage === "college"
          ? "Undergraduate"
          : stage === "graduate"
            ? "Graduate"
            : stage === "working"
              ? "Working Professional"
              : previousDetails.classLevel;

      const nextDetails = {
        studentName: text(about.studentName),
        dateOfBirth: text(about.dateOfBirth),
        studentPhone: text(about.mobile),
        parentName: text(about.guardianName),
        parentWhatsapp:
          text(about.guardianMobile) ||
          text(about.mobile),
        email: text(about.email),
        city: text(about.city),
        classLevel,
        board: text(education.board),
        school: text(education.institution),
        academicPercentage:
          text(education.recentScore),
        strongSubjects:
          stringArray(education.strongSubjects),
        weakSubjects:
          stringArray(education.weakSubjects),
        interests:
          stringArray(interests.areas),
        careerGoal: text(interests.careerGoal),
        preferredStream:
          text(interests.preferredStream) ||
          text(education.currentStream),
        preferredLearningStyle:
          text(interests.learningStyle),
        examInterests:
          stringArray(education.entranceExams),
        parentExpectations:
          text(interests.parentExpectations),
        challenges:
          text(routine.biggestObstacle),
      };

      if (
        !nextDetails.classLevel ||
        !nextDetails.parentWhatsapp
      ) {
        return NextResponse.json(
          {
            error:
              "Education level and a contact number are required.",
          },
          { status: 400 },
        );
      }

      const result = await collection.updateOne(
        {
          _id,
          updatedAt: old.updatedAt,
        },
        {
          $set: {
            questionnaire: next,
            ...nextDetails,
            aiReviewed: changedForAI
              ? false
              : old.aiReviewed === true,
            updatedBy: session.id,
            updatedAt: now,
          },
        },
      );

      if (result.matchedCount !== 1) {
        return NextResponse.json(
          {
            error:
              "The record changed while saving. Reload and retry.",
          },
          { status: 409 },
        );
      }

      const updated = await collection.findOne({ _id });

      return NextResponse.json(
        {
          record: toCareerRecord(updated!),
        },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    // ----------------------------------------
    // EXISTING COUNSELLOR EDITOR UPDATE
    // ----------------------------------------
    const details = parseCareerDetails(payload);

    if (
      !details.studentName ||
      !details.classLevel ||
      !details.parentWhatsapp
    ) {
      return NextResponse.json(
        {
          error:
            "Student name, class/level and parent WhatsApp number are required.",
        },
        { status: 400 },
      );
    }

    const aiSuggestion =
      typeof payload.aiSuggestion === "string"
        ? payload.aiSuggestion.trim().slice(0, 10000)
        : String(old.aiSuggestion ?? "");

    const oldDetails = parseCareerDetails(old);

    const academicFields = [
      "classLevel",
      "board",
      "school",
      "academicPercentage",
      "careerGoal",
      "preferredStream",
      "preferredLearningStyle",
      "parentExpectations",
      "challenges",
    ] as const;

    const arrayFields = [
      "strongSubjects",
      "weakSubjects",
      "interests",
      "examInterests",
    ] as const;

    const changedAcademicInputs =
      academicFields.some(
        (field) =>
          oldDetails[field] !== details[field],
      ) ||
      arrayFields.some(
        (field) =>
          JSON.stringify(oldDetails[field]) !==
          JSON.stringify(details[field]),
      );

    const changedConsent =
      oldDetails.aiConsent !== details.aiConsent;

    const changedReport =
      String(old.aiSuggestion ?? "").trim() !==
      aiSuggestion;

    // A modified report must be saved first
    // and approved in a separate action.
    const aiReviewed =
      Boolean(aiSuggestion) &&
      payload.aiReviewed === true &&
      !changedAcademicInputs &&
      !changedConsent &&
      !changedReport;

    const result = await collection.updateOne(
      {
        _id,
        updatedAt: old.updatedAt,
      },
      {
        $set: {
          ...details,
          aiSuggestion,
          aiReviewed,
          updatedBy: session.id,
          updatedAt: now,
        },
      },
    );

    if (result.matchedCount !== 1) {
      return NextResponse.json(
        {
          error:
            "The record changed while saving. Refresh and retry.",
        },
        { status: 409 },
      );
    }

    // No questionnaire field in $set:
    // the full questionnaire remains intact.
    const updated = await collection.findOne({ _id });

    return NextResponse.json(
      {
        record: toCareerRecord(updated!),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Career counselling PATCH failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to update counselling record.",
      },
      { status: 500 },
    );
  }
}

// ----------------------------------------
// DELETE: ADMIN ONLY
// ----------------------------------------
export async function DELETE(
  _request: Request,
  { params }: Context,
) {
  try {
    const session = await getSessionUser();

    if (
      !session ||
      session.role !== "admin" ||
      (session.status && session.status !== "active")
    ) {
      return NextResponse.json(
        {
          error:
            "Only admins can delete counselling enquiries.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid record ID." },
        { status: 400 },
      );
    }

    const collection = await careerCollection();

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount !== 1) {
      return NextResponse.json(
        {
          error: "Counselling enquiry not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error(
      "Career counselling DELETE failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete counselling enquiry.",
      },
      { status: 500 },
    );
  }
}
