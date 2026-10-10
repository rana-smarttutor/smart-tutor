
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
  newAssessmentDocument,
  publicAssessmentSession,
  validObjectId,
} from "@/lib/career-assessment-store";

import {
  getPublicAssessmentQuestions,
} from "@/lib/career-assessment-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorised() {
  const session = await getSessionUser();

  return session &&
    hasAnyRole(session, CAREER_ROLES) &&
    (!session.status || session.status === "active")
    ? session
    : null;
}

function responseHeaders() {
  return {
    "Cache-Control": "private, no-store",
  };
}

async function loadForEnquiry(enquiryId: string) {
  if (!validObjectId(enquiryId)) {
    return {
      error: "Invalid counselling enquiry ID.",
      status: 400,
    } as const;
  }

  const enquiryCollection = await careerCollection();

  const enquiry = await enquiryCollection.findOne({
    _id: new ObjectId(enquiryId),
  });

  if (!enquiry) {
    return {
      error: "Counselling enquiry not found.",
      status: 404,
    } as const;
  }

  const collection = await assessmentCollection();

  const latest = await collection
    .find({
      enquiryId: new ObjectId(enquiryId),
    })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .limit(1)
    .next();

  return {
    collection,
    latest,
  };
}

export async function GET(request: Request) {
  try {
    const session = await authorised();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);

    const enquiryId =
      url.searchParams.get("enquiryId") ?? "";

    const found = await loadForEnquiry(enquiryId);

    if ("error" in found) {
      return NextResponse.json(
        { error: found.error },
        { status: found.status },
      );
    }

    return NextResponse.json(
      {
        session: found.latest
          ? publicAssessmentSession(found.latest)
          : null,
        questions: getPublicAssessmentQuestions(),
      },
      {
        headers: responseHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Career assessment GET failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load assessment.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await authorised();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
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
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const enquiryId =
      typeof input.enquiryId === "string"
        ? input.enquiryId
        : "";

    const found = await loadForEnquiry(enquiryId);

    if ("error" in found) {
      return NextResponse.json(
        { error: found.error },
        { status: found.status },
      );
    }

    if (
      found.latest &&
      found.latest.status === "in-progress"
    ) {
      return NextResponse.json(
        {
          session: publicAssessmentSession(
            found.latest,
          ),
          questions: getPublicAssessmentQuestions(),
        },
        {
          headers: responseHeaders(),
        },
      );
    }

    // A submitted session remains the latest
    // official result. A retake requires a
    // separate explicitly authorised workflow.
    if (
      found.latest &&
      found.latest.status === "submitted"
    ) {
      return NextResponse.json(
        {
          session: publicAssessmentSession(
            found.latest,
          ),
          questions: getPublicAssessmentQuestions(),
        },
        {
          headers: responseHeaders(),
        },
      );
    }

    const document = newAssessmentDocument(
      new ObjectId(enquiryId),
      session.id,
    );

    await found.collection.insertOne(document);

    return NextResponse.json(
      {
        session: publicAssessmentSession(document),
        questions: getPublicAssessmentQuestions(),
      },
      {
        status: 201,
        headers: responseHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "Career assessment POST failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to start assessment.",
      },
      { status: 500 },
    );
  }
}
