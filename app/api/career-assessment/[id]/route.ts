
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  CAREER_ROLES,
  careerCollection,
} from "@/lib/career-counselling";

import {
  assessmentCollection,
  calculateAssessmentResult,
  normalizeAssessmentAnswers,
  publicAssessmentSession,
  validObjectId,
  type AssessmentDocument,
} from "@/lib/career-assessment-store";

import {
  CAREER_QUESTION_BANK_VERSION,
} from "@/lib/career-assessment-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

async function authorised() {
  const session = await getSessionUser();

  return session &&
    hasAnyRole(session, CAREER_ROLES) &&
    (!session.status || session.status === "active")
    ? session
    : null;
}

async function findSession(id: string) {
  if (!validObjectId(id)) {
    return null;
  }

  const collection = await assessmentCollection();

  const record = await collection.findOne({
    _id: new ObjectId(id),
  });

  if (!record) return null;

  // Never use an assessment with a removed
  // counselling enquiry.
  const enquiries = await careerCollection();

  const enquiry = await enquiries.findOne({
    _id: record.enquiryId,
  });

  return enquiry ? record : null;
}

function expired(record: AssessmentDocument): boolean {
  return Date.now() >= Date.parse(record.expiresAt);
}

async function submitAssessment(
  record: AssessmentDocument,
  answersInput: unknown,
  submittedBy: string,
) {
  const collection = await assessmentCollection();

  const answers = normalizeAssessmentAnswers(
    answersInput,
  );

  const result = calculateAssessmentResult(answers);

  const now = new Date().toISOString();

  // Last valid record version wins only if
  // the assessment is still in progress.
  const update = await collection.updateOne(
    {
      _id: record._id,
      status: "in-progress",
      updatedAt: record.updatedAt,
    },
    {
      $set: {
        status: "submitted",
        answers,
        result,
        submittedBy,
        submittedAt: now,
        updatedAt: now,
      },
    },
  );

  if (update.matchedCount !== 1) {
    return NextResponse.json(
      {
        error:
          "Assessment changed while submitting. Reload the latest answers and try again.",
      },
      { status: 409 },
    );
  }

  const saved = await collection.findOne({
    _id: record._id,
  });

  return NextResponse.json(
    {
      session: publicAssessmentSession(saved!),
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function GET(
  _request: Request,
  { params }: Context,
) {
  try {
    const session = await authorised();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const record = await findSession(id);

    if (!record) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        session: publicAssessmentSession(record),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Assessment session GET failed:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load assessment." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: Context,
) {
  try {
    const session = await authorised();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const record = await findSession(id);

    if (!record) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    if (
      record.bankVersion !==
      CAREER_QUESTION_BANK_VERSION
    ) {
      return NextResponse.json(
        {
          error:
            "This assessment uses an older question bank.",
        },
        { status: 409 },
      );
    }

    if (record.status !== "in-progress") {
      return NextResponse.json(
        {
          error: "Assessment already submitted.",
        },
        { status: 409 },
      );
    }

    if (expired(record)) {
      return NextResponse.json(
        {
          error:
            "Assessment time has expired. Submit the answers saved before the deadline.",
        },
        { status: 409 },
      );
    }

    const body: unknown = await request
      .json()
      .catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid answers." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    // Prevent a stale browser tab from silently
    // overwriting more recent answers.
    if (
      typeof input.updatedAt !== "string" ||
      input.updatedAt !== record.updatedAt
    ) {
      return NextResponse.json(
        {
          error:
            "Answers changed in another request. Reload before saving.",
        },
        { status: 409 },
      );
    }

    const answers = normalizeAssessmentAnswers(
      input.answers,
    );

    const now = new Date().toISOString();

    const collection = await assessmentCollection();

    const update = await collection.updateOne(
      {
        _id: record._id,
        status: "in-progress",
        updatedAt: record.updatedAt,
      },
      {
        $set: {
          answers,
          updatedAt: now,
        },
      },
    );

    if (update.matchedCount !== 1) {
      return NextResponse.json(
        {
          error:
            "Concurrent assessment update detected.",
        },
        { status: 409 },
      );
    }

    const saved = await collection.findOne({
      _id: record._id,
    });

    return NextResponse.json(
      {
        session: publicAssessmentSession(saved!),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Assessment autosave failed:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to save answers." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: Context,
) {
  try {
    const session = await authorised();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const record = await findSession(id);

    if (!record) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    if (
      record.bankVersion !==
      CAREER_QUESTION_BANK_VERSION
    ) {
      return NextResponse.json(
        {
          error:
            "Question bank version mismatch. Do not rescore this session using changed questions.",
        },
        { status: 409 },
      );
    }

    if (record.status === "submitted") {
      return NextResponse.json({
        session: publicAssessmentSession(record),
      });
    }

    const body: unknown = await request
      .json()
      .catch(() => null);

    const input =
      body &&
      typeof body === "object" &&
      !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};

    const isExpired = expired(record);

    // Once the timer expires, accept only the
    // answers already persisted on the server.
    const answers = isExpired
      ? record.answers
      : input.answers ?? record.answers;

    return submitAssessment(
      record,
      answers,
      session.id,
    );
  } catch (error) {
    console.error(
      "Assessment submission failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to submit assessment.",
      },
      { status: 500 },
    );
  }
}
