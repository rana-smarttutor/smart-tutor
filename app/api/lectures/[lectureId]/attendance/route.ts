import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";

import {
  getLecturesForRole,
  recordLectureAttendanceAction,
  saveLectureAttendanceTimes,
  type LectureAttendanceAction,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ lectureId: string }>;
};

type AttendanceStatus = "present" | "absent" | "late" | "leave";

type AttendanceBody = {
  action?: unknown;
  attendanceStatus?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function indiaDate(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

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

function parseAttendanceTime(
  lectureDate: string,
  value: unknown,
  label: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a time string.`);
  }

  const time = value.trim();

  if (!time) return "";

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error(`${label} must use HH:MM format.`);
  }

  const date = new Date(`${lectureDate}T${time}:00+05:30`);

  if (
    !Number.isFinite(date.getTime()) ||
    indiaDate(date.toISOString()) !== lectureDate
  ) {
    throw new Error(`${label} is invalid.`);
  }

  return date.toISOString();
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === "present" || value === "absent" || value === "late" || value === "leave";
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

    if (!lectureId?.trim()) {
      return errorResponse("Lecture ID is required.", 400);
    }

    let body: AttendanceBody;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request body.", 400);
    }

    const action = body.action;

    if (
      action !== "save" &&
      action !== "checkin" &&
      action !== "checkout" &&
      action !== "complete"
    ) {
      return errorResponse("Invalid attendance action.", 400);
    }

    const roleForRead = session.role === "counsellor" ? "staff" : session.role;

    const lectures = await getLecturesForRole(roleForRead, session.id);

    const lecture = lectures.find((item) => item.id === lectureId);

    if (!lecture) {
      return errorResponse("Lecture not found or access denied.", 404);
    }

    if (session.role === "educator" && lecture.teacherId !== session.id) {
      return errorResponse("You may only update your own lectures.", 403);
    }

    const previous = {
      attendanceStatus: lecture.lectureAttendanceStatus ?? null,
      lectureStatus: lecture.status,
      checkIn: lecture.lectureCheckInAt ?? null,
      checkOut: lecture.lectureCheckOutAt ?? null,
    };

    let updated;

    if (action === "save") {
      if (lecture.status !== "scheduled" && lecture.status !== "completed") {
        return errorResponse(
          "Cannot edit attendance for a cancelled lecture.",
          409,
        );
      }

      if (!isAttendanceStatus(body.attendanceStatus)) {
        return errorResponse(
          "Enter lecture times or select Absent / Leave.",
          400,
        );
      }

      const attendanceStatus = body.attendanceStatus;

      const lectureDate = indiaDate(lecture.startsAt);

      if (!lectureDate) {
        return errorResponse("Invalid lecture date.", 400);
      }

      let checkInAt = "";
      let checkOutAt = "";

      // Present and Late have identical time-entry
      // validation. Their saved attendance status
      // remains different.
      if (attendanceStatus !== "absent" && attendanceStatus !== "leave") {
        try {
          checkInAt = parseAttendanceTime(
            lectureDate,
            body.checkIn,
            "Check-in",
          );

          checkOutAt = parseAttendanceTime(
            lectureDate,
            body.checkOut,
            "Check-out",
          );
        } catch (error) {
          return errorResponse(
            error instanceof Error ? error.message : "Invalid lecture times.",
            400,
          );
        }

        if (!checkInAt) {
          return errorResponse(
            `Enter Check In for ${
              attendanceStatus === "late" ? "Late" : "Present"
            } attendance.`,
            400,
          );
        }

        if (checkOutAt && Date.parse(checkOutAt) <= Date.parse(checkInAt)) {
          return errorResponse("Check Out must be later than Check In.", 400);
        }

        const now = Date.now();

        if (
          Date.parse(checkInAt) > now ||
          (checkOutAt && Date.parse(checkOutAt) > now)
        ) {
          return errorResponse("Attendance cannot contain a future time.", 400);
        }
      }

      const scheduledStartMs = Date.parse(lecture.startsAt);

      if (!Number.isFinite(scheduledStartMs)) {
        return errorResponse("Invalid scheduled lecture time.", 400);
      }

      const finalAttendanceStatus =
        attendanceStatus === "absent" || attendanceStatus === "leave"
          ? attendanceStatus
          : Date.parse(checkInAt) > scheduledStartMs
            ? "late"
            : "present";

      try {
        updated = await saveLectureAttendanceTimes(lectureId, {
          attendanceStatus: finalAttendanceStatus,
          checkInAt,
          checkOutAt,
        });
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : "Unable to save attendance.",
          409,
        );
      }
    } else {
      // Existing automatic actions remain available
      // for integrations that still use them.
      if (lecture.status !== "scheduled") {
        return errorResponse("Lecture is not scheduled.", 409);
      }

      if (lecture.lectureAttendanceStatus === "absent" || lecture.lectureAttendanceStatus === "leave") {
        return errorResponse(
          "Change attendance to Present or Late before recording lecture actions.",
          409,
        );
      }

      const now = new Date();

      if (
        (action === "checkin" || action === "checkout") &&
        indiaDate(lecture.startsAt) !== indiaDate(now.toISOString())
      ) {
        return errorResponse(
          "Automatic check-in/out is only available on the lecture date.",
          400,
        );
      }

      if (action === "checkin") {
        const start = Date.parse(lecture.startsAt);

        if (!Number.isFinite(start) || now.getTime() < start - 15 * 60 * 1000) {
          return errorResponse(
            "Automatic check-in opens 15 minutes before the scheduled start.",
            400,
          );
        }
      }

      try {
        updated = await recordLectureAttendanceAction(
          lectureId,
          action as LectureAttendanceAction,
        );
      } catch (error) {
        return errorResponse(
          error instanceof Error
            ? error.message
            : "Unable to record attendance.",
          409,
        );
      }
    }

    if (!updated) {
      return errorResponse("Lecture not found.", 404);
    }

    try {
      await logAction({
        action: "update",
        category: "courses",
        details: `Lecture attendance ${action}: ${updated.title}`,
        path: `/api/lectures/${lectureId}/attendance`,
        method: "POST",
        request,
        session,
        metadata: {
          lectureId,
          attendanceAction: action,
          teacherId: updated.teacherId,
          previousAttendanceStatus: previous.attendanceStatus,
          attendanceStatus: updated.lectureAttendanceStatus ?? null,
          previousLectureStatus: previous.lectureStatus,
          lectureStatus: updated.status,
          previousCheckInAt: previous.checkIn,
          previousCheckOutAt: previous.checkOut,
          lectureCheckInAt: updated.lectureCheckInAt ?? null,
          lectureCheckOutAt: updated.lectureCheckOutAt ?? null,
          lectureCompletedAt: updated.lectureCompletedAt ?? null,
        },
      });
    } catch (error) {
      console.error("Lecture attendance audit failed:", error);
    }

    return NextResponse.json({
      success: true,
      lecture: updated,
      message:
        action === "save"
          ? updated.lectureAttendanceStatus === "absent"
            ? "Faculty marked Absent successfully."
            : updated.lectureAttendanceStatus === "late"
              ? "Faculty marked Late successfully."
              : "Faculty Present attendance saved successfully."
          : action === "checkin"
            ? "Lecture check-in recorded."
            : action === "checkout"
              ? "Lecture check-out recorded."
              : "Lecture marked completed.",
    });
  } catch (error) {
    console.error("Lecture attendance error:", error);

    return errorResponse("Unable to process lecture attendance.", 500);
  }
}
