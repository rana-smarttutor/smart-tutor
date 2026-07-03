import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  deleteDailyActivity,
  getDailyActivitiesForRole,
  updateDailyActivity,
} from "@/lib/data-store";
import type { StudentDailyActivity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    activityId: string;
  }>;
};

const PARTICIPATION_VALUES = new Set([
  "excellent",
  "good",
  "needs-improvement",
  "not-recorded",
]);

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

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

async function getAllowedActivity(
  activityId: string,
  role: "admin" | "educator",
  userId: string,
) {
  const activities = await getDailyActivitiesForRole(role, userId);

  return activities.find((activity) => activity.id === activityId) ?? null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { activityId } = await context.params;

    const existingActivity = await getAllowedActivity(
      activityId,
      session.role,
      session.id,
    );

    if (!existingActivity) {
      return NextResponse.json(
        {
          error:
            "Daily activity not found or you do not have permission to edit it.",
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const updates: Partial<{
      subject: string;
      date: string;
      topicStudied: string;
      homeworkCompleted: boolean;
      assignmentCompleted: boolean;
      revisionCompleted: boolean;
      doubtsRaised: string;
      participation: StudentDailyActivity["participation"];
      studyMinutes: number;
      teacherVerified: boolean;
      teacherNote: string;
      visibleToParent: boolean;
    }> = {};

    if (hasField(body, "subject")) {
      updates.subject = getOptionalText(body.subject) ?? "";
    }

    if (hasField(body, "date")) {
      updates.date = getRequiredText(body.date, "Activity date");
    }

    if (hasField(body, "topicStudied")) {
      updates.topicStudied = getOptionalText(body.topicStudied) ?? "";
    }

    if (hasField(body, "homeworkCompleted")) {
      if (typeof body.homeworkCompleted !== "boolean") {
        return NextResponse.json(
          { error: "Homework completion must be true or false." },
          { status: 400 },
        );
      }

      updates.homeworkCompleted = body.homeworkCompleted;
    }

    if (hasField(body, "assignmentCompleted")) {
      if (typeof body.assignmentCompleted !== "boolean") {
        return NextResponse.json(
          { error: "Assignment completion must be true or false." },
          { status: 400 },
        );
      }

      updates.assignmentCompleted = body.assignmentCompleted;
    }

    if (hasField(body, "revisionCompleted")) {
      if (typeof body.revisionCompleted !== "boolean") {
        return NextResponse.json(
          { error: "Revision completion must be true or false." },
          { status: 400 },
        );
      }

      updates.revisionCompleted = body.revisionCompleted;
    }

    if (hasField(body, "doubtsRaised")) {
      updates.doubtsRaised = getOptionalText(body.doubtsRaised) ?? "";
    }

    if (hasField(body, "participation")) {
      const participation = getRequiredText(
        body.participation,
        "Participation",
      );

      if (!PARTICIPATION_VALUES.has(participation)) {
        return NextResponse.json(
          { error: "Invalid participation value." },
          { status: 400 },
        );
      }

      updates.participation =
        participation as StudentDailyActivity["participation"];
    }

    if (hasField(body, "studyMinutes")) {
      const minutes = getStudyMinutes(body.studyMinutes);

      if (minutes === undefined) {
        return NextResponse.json(
          { error: "Study minutes must be zero or greater." },
          { status: 400 },
        );
      }

      updates.studyMinutes = minutes;
    }

    if (hasField(body, "teacherVerified")) {
      if (typeof body.teacherVerified !== "boolean") {
        return NextResponse.json(
          { error: "Teacher verification must be true or false." },
          { status: 400 },
        );
      }

      updates.teacherVerified = body.teacherVerified;
    }

    if (hasField(body, "teacherNote")) {
      updates.teacherNote = getOptionalText(body.teacherNote) ?? "";
    }

    if (hasField(body, "visibleToParent")) {
      if (typeof body.visibleToParent !== "boolean") {
        return NextResponse.json(
          { error: "visibleToParent must be true or false." },
          { status: 400 },
        );
      }

      updates.visibleToParent = body.visibleToParent;
    }

    const activity = await updateDailyActivity(activityId, updates);

    if (!activity) {
      return NextResponse.json(
        { error: "Daily activity not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Update daily activity error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update daily activity.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { activityId } = await context.params;

    const existingActivity = await getAllowedActivity(
      activityId,
      session.role,
      session.id,
    );

    if (!existingActivity) {
      return NextResponse.json(
        {
          error:
            "Daily activity not found or you do not have permission to delete it.",
        },
        { status: 404 },
      );
    }

    const deleted = await deleteDailyActivity(activityId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Daily activity not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete daily activity error:", error);

    return NextResponse.json(
      { error: "Unable to delete daily activity." },
      { status: 500 },
    );
  }
}