import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";

import { getLecturesForRole, updateLecture } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    lectureId: string;
  }>;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStudentIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : undefined;
}

function getLectureStatus(value: unknown) {
  if (value === "scheduled" || value === "completed" || value === "cancelled") {
    return value;
  }

  return undefined;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const canEdit = session.role === "admin" || session.role === "educator";

    const canManageStatus =
      session.role === "admin" ||
      session.role === "staff" ||
      session.role === "counsellor";

    if (!canEdit && !canManageStatus) {
      return errorResponse("Forbidden", 403);
    }

    const { lectureId } = await context.params;

    if (!lectureId) {
      return errorResponse("Invalid lecture ID.", 400);
    }

    const roleForRead = session.role === "counsellor" ? "staff" : session.role;

    const accessibleLectures = await getLecturesForRole(
      roleForRead,
      session.id,
    );

    const existingLecture = accessibleLectures.find(
      (lecture) => lecture.id === lectureId,
    );

    if (!existingLecture) {
      return errorResponse("Lecture not found or access denied.", 404);
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return errorResponse("Invalid JSON request.", 400);
    }

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return errorResponse("Invalid request body.", 400);
    }

    const body = rawBody as Record<string, unknown>;

    const status = getLectureStatus(body.status);

    if (body.status !== undefined && !status) {
      return errorResponse("Invalid lecture status.", 400);
    }

    // Staff and Counsellor can only change
    // Scheduled / Cancelled.
    // They cannot edit the lecture's content.
    if (!canEdit) {
      const keys = Object.keys(body);

      if (
        keys.length !== 1 ||
        keys[0] !== "status" ||
        (status !== "scheduled" && status !== "cancelled")
      ) {
        return errorResponse(
          "Only Scheduled and Cancelled status changes are permitted.",
          403,
        );
      }
    }

    // Do not reopen completed lectures.
    if (
      existingLecture.status === "completed" &&
      status &&
      status !== "completed"
    ) {
      return errorResponse("Completed lectures cannot be reopened.", 409);
    }

    // Do not cancel a lecture that has started.
    if (
      status === "cancelled" &&
      (existingLecture.lectureCheckInAt || existingLecture.lectureCheckOutAt)
    ) {
      return errorResponse(
        "A lecture already checked in cannot be cancelled.",
        409,
      );
    }

    // Do not reset a lecture in progress.
    if (status === "scheduled" && existingLecture.lectureCheckInAt) {
      return errorResponse(
        "A lecture already in progress cannot be reset.",
        409,
      );
    }

    // Staff / Counsellor status-only update.
    if (!canEdit) {
      const lecture = await updateLecture(lectureId, { status });

      if (!lecture) {
        return errorResponse("Lecture not found.", 404);
      }

      await logAction({
        action: "update",
        category: "courses",
        details: `Lecture status changed: ${lecture.title} -> ${status}`,
        path: `/api/lectures/${lectureId}`,
        method: "PATCH",
        request,
        session,
        metadata: {
          lectureId,
          previousStatus: existingLecture.status,
          newStatus: status,
        },
      });

      return NextResponse.json({ lecture });
    }

    // Preserve existing Admin / Educator
    // lecture editing functionality.
    const lecture = await updateLecture(lectureId, {
      title: getOptionalText(body.title),
      subject: getOptionalText(body.subject),
      description: getOptionalText(body.description),
      startsAt: getOptionalText(body.startsAt),
      endsAt: getOptionalText(body.endsAt),
      meetingLink: getOptionalText(body.meetingLink),
      recordingLink: getOptionalText(body.recordingLink),
      materialLink: getOptionalText(body.materialLink),
      assignedStudentIds: getStudentIds(body.assignedStudentIds),
      status,
      topicCovered: getOptionalText(body.topicCovered),
      homeworkGiven: getOptionalText(body.homeworkGiven),
      assignmentGiven: getOptionalText(body.assignmentGiven),
      revisionTask: getOptionalText(body.revisionTask),
      doubtsSolved: getOptionalText(body.doubtsSolved),
      nextTopic: getOptionalText(body.nextTopic),
      attendanceSheetId: getOptionalText(body.attendanceSheetId),
      lectureReportSubmittedAt:
        status === "completed"
          ? new Date().toISOString()
          : getOptionalText(body.lectureReportSubmittedAt),
    });

    if (!lecture) {
      return errorResponse("Lecture not found.", 404);
    }

    await logAction({
      action: "update",
      category: "courses",
      details: `Lecture updated: ${lecture.title}`,
      path: `/api/lectures/${lectureId}`,
      method: "PATCH",
      request,
      session,
      metadata: {
        lectureId,
        title: lecture.title,
      },
    });

    return NextResponse.json({ lecture });
  } catch (error) {
    console.error("Update lecture error:", error);

    return errorResponse("Unable to update lecture.", 500);
  }
}
