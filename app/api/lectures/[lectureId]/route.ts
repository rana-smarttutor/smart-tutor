import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  getLecturesForRole,
  updateLecture,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    lectureId: string;
  }>;
};

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
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
  if (
    value === "scheduled" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return undefined;
}

async function getAllowedLecture(
  lectureId: string,
  role: "admin" | "educator",
  userId: string,
) {
  const lectures = await getLecturesForRole(role, userId);

  return lectures.find((lecture) => lecture.id === lectureId) ?? null;
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

    const { lectureId } = await context.params;
    const existingLecture = await getAllowedLecture(
  lectureId,
  session.role,
  session.id,
);

if (!existingLecture) {
  return NextResponse.json(
    {
      error:
        "Lecture not found or you do not have permission to edit it.",
    },
    { status: 404 },
  );
}
    const body = (await request.json()) as Record<string, unknown>;

    const status = getLectureStatus(body.status);

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
      return NextResponse.json(
        { error: "Lecture not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ lecture });
  } catch (error) {
    console.error("Update lecture error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update lecture.",
      },
      { status: 500 },
    );
  }
}