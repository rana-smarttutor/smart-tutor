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
  params: Promise<{
    id: string;
  }>;
};

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

    const collection = await careerCollection();

    const _id = new ObjectId(id);

    const old = await collection.findOne({ _id });

    if (!old) {
      return NextResponse.json(
        { error: "Record not found." },
        { status: 404 },
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
        { status: 400 },
      );
    }

    const obj =
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};

    const aiSuggestion =
      typeof obj.aiSuggestion === "string"
        ? obj.aiSuggestion.trim().slice(0, 10000)
        : String(old.aiSuggestion ?? "");

    const oldDetails = parseCareerDetails(old);

    const changedAcademicInputs =
      [
        "classLevel",
        "board",
        "school",
        "academicPercentage",
        "careerGoal",
        "preferredStream",
        "preferredLearningStyle",
        "parentExpectations",
        "challenges",
      ].some(
        (key) =>
          oldDetails[key as keyof typeof oldDetails] !==
          details[key as keyof typeof details],
      ) ||
      [
        "strongSubjects",
        "weakSubjects",
        "interests",
        "examInterests",
      ].some(
        (key) =>
          JSON.stringify(
            oldDetails[key as keyof typeof oldDetails],
          ) !==
          JSON.stringify(
            details[key as keyof typeof details],
          ),
      );

    const aiReviewed =
      Boolean(aiSuggestion) &&
      obj.aiReviewed === true &&
      !changedAcademicInputs;

    const now = new Date().toISOString();

    await collection.updateOne(
      { _id },
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

    const updated = await collection.findOne({ _id });

    return NextResponse.json({
      record: toCareerRecord(updated!),
    });
  } catch (error) {
    console.error(
      "Career counselling PATCH failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to update counselling record.",
      },
      {
        status: 500,
      },
    );
  }
}


// ============================================================
// DELETE CAREER COUNSELLING ENQUIRY
// ADMIN ONLY
// ============================================================

export async function DELETE(
  _request: Request,
  { params }: Context,
) {
  try {
    const session = await getSessionUser();

    // Counsellors may view/edit, but only admins may delete.
    if (
      !session ||
      session.role !== "admin" ||
      (session.status && session.status !== "active")
    ) {
      return NextResponse.json(
        { error: "Only admins can delete counselling enquiries." },
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
        { error: "Counselling enquiry not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        deletedId: id,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Career counselling DELETE failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to delete counselling enquiry.",
      },
      { status: 500 },
    );
  }
}