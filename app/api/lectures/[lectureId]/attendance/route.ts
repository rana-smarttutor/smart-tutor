import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  getLecturesForRole,
  recordLectureAttendanceAction,
  type LectureAttendanceAction,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ lectureId: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function dateInIndia(value: string): string {
  const date = new Date(value);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function POST(request: Request, context: Context) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    if (
      session.role !== "admin" &&
      session.role !== "staff" &&
      session.role !== "counsellor" &&
      session.role !== "educator"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const { lectureId } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request body.", 400);
    }

    const action = (body as Record<string, unknown>).action;

    if (
      action !== "checkin" &&
      action !== "checkout" &&
      action !== "complete"
    ) {
      return errorResponse("Invalid attendance action.", 400);
    }

    const roleForRead =
      session.role === "counsellor" ? "staff" : session.role;

    const lectures = await getLecturesForRole(
      roleForRead,
      session.id,
    );

    const lecture = lectures.find((item) => item.id === lectureId);

    if (!lecture) {
      return errorResponse("Lecture not found or access denied.", 404);
    }

    if (
      session.role === "educator" &&
      lecture.teacherId !== session.id
    ) {
      return errorResponse("You may only update your own lectures.", 403);
    }

    if (lecture.status !== "scheduled") {
      return errorResponse("Lecture is not scheduled.", 409);
    }

    const now = new Date();

    if (
      (action === "checkin" || action === "checkout") &&
      dateInIndia(lecture.startsAt) !== dateInIndia(now.toISOString())
    ) {
      return errorResponse(
        "Check-in and check-out must happen on the lecture date.",
        400,
      );
    }

    if (action === "checkin") {
      const startMs = Date.parse(lecture.startsAt);

      if (
        !Number.isFinite(startMs) ||
        now.getTime() < startMs - 15 * 60 * 1000
      ) {
        return errorResponse(
          "Check-in opens 15 minutes before the scheduled start.",
          400,
        );
      }
    }

    let updated;

    try {
      updated = await recordLectureAttendanceAction(
        lectureId,
        action as LectureAttendanceAction,
      );
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Unable to record action.",
        409,
      );
    }

    if (!updated) {
      return errorResponse("Lecture not found.", 404);
    }

    try {
      await logAction({
        action: "update",
        category: "courses",
        details: `Lecture ${action}: ${updated.title}`,
        path: `/api/lectures/${lectureId}/attendance`,
        method: "POST",
        request,
        session,
        metadata: {
          lectureId,
          attendanceAction: action,
          teacherId: updated.teacherId,
          lectureCheckInAt: updated.lectureCheckInAt,
          lectureCheckOutAt: updated.lectureCheckOutAt,
          lectureCompletedAt: updated.lectureCompletedAt,
        },
      });
    } catch (error) {
      console.error("Lecture attendance audit failed:", error);
    }

    return NextResponse.json({
      success: true,
      lecture: updated,
      message:
        action === "checkin"
          ? "Lecture check-in recorded."
          : action === "checkout"
            ? "Lecture check-out recorded."
            : "Lecture marked completed.",
    });
  } catch (error) {
    console.error("Lecture attendance error:", error);

    return errorResponse(
      "Unable to process lecture attendance.",
      500,
    );
  }
}
