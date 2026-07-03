import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createDailyActivity,
  getBatchesForRole,
  getDailyActivitiesForRole,
} from "@/lib/data-store";
import type { StudentDailyActivity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PARTICIPATION_VALUES = new Set([
  "excellent",
  "good",
  "needs-improvement",
  "not-recorded",
]);

function getRequiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getStudyMinutes(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new Error("Study minutes must be zero or greater.");
  }

  return Math.round(minutes);
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activities = await getDailyActivitiesForRole(
      session.role,
      session.id,
    );

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Get daily activities error:", error);

    return NextResponse.json(
      { error: "Unable to load daily activities." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const batchId = getRequiredText(body.batchId, "Batch");
    const studentId = getRequiredText(body.studentId, "Student ID");
    const studentName = getRequiredText(body.studentName, "Student name");
    const date = getRequiredText(body.date, "Activity date");

    const allowedBatches = await getBatchesForRole(
      session.role,
      session.id,
    );

    const batch = allowedBatches.find(
      (item) => item.id === batchId && item.status === "active",
    );

    if (!batch) {
      return NextResponse.json(
        {
          error:
            "This batch is unavailable or is not assigned to your account.",
        },
        { status: 403 },
      );
    }

    if (!batch.studentIds.includes(studentId)) {
      return NextResponse.json(
        { error: "This student is not assigned to the selected batch." },
        { status: 403 },
      );
    }

    const rawParticipation =
      typeof body.participation === "string"
        ? body.participation.trim()
        : "not-recorded";

    if (!PARTICIPATION_VALUES.has(rawParticipation)) {
      return NextResponse.json(
        { error: "Invalid participation value." },
        { status: 400 },
      );
    }

    const activity = await createDailyActivity({
      studentId,
      studentName,

      batchId: batch.id,
      batchName: batch.name,

      teacherId: session.id,
      teacherName: session.name,

      subject: getOptionalText(body.subject) ?? batch.subject,
      date,

      topicStudied: getOptionalText(body.topicStudied),

      homeworkCompleted: getBoolean(body.homeworkCompleted),
      assignmentCompleted: getBoolean(body.assignmentCompleted),
      revisionCompleted: getBoolean(body.revisionCompleted),

      doubtsRaised: getOptionalText(body.doubtsRaised),

      participation:
        rawParticipation as StudentDailyActivity["participation"],

      studyMinutes: getStudyMinutes(body.studyMinutes),

      teacherVerified: getBoolean(body.teacherVerified, true),
      teacherNote: getOptionalText(body.teacherNote),

      visibleToParent: getBoolean(body.visibleToParent, true),
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Create daily activity error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save daily activity.",
      },
      { status: 500 },
    );
  }
}