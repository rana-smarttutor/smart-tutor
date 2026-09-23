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

async function authenticated() {
  const session = await getSessionUser();

  return session &&
    hasAnyRole(session, CAREER_ROLES) &&
    (!session.status || session.status === "active")
    ? session
    : null;
}

export async function GET() {
  try {
    const session = await authenticated();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const collection = await careerCollection();

    const records = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json(
      {
        records: records.map(toCareerRecord),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Career counselling GET failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load counselling records.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await authenticated();

    if (!session) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const payload = await request.json().catch(() => null);

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
        {
          status: 400,
        },
      );
    }

    const now = new Date().toISOString();

    const collection = await careerCollection();

    const record = {
      ...details,

      aiSuggestion: "",

      aiReviewed: false,

      createdBy: session.id,

      createdByName: session.name,

      updatedBy: session.id,

      createdAt: now,

      updatedAt: now,
    };

    const result = await collection.insertOne(record);

    return NextResponse.json(
      {
        record: toCareerRecord({
          ...record,
          _id: result.insertedId,
        }),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Career counselling POST failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to save counselling enquiry.",
      },
      {
        status: 500,
      },
    );
  }
}
