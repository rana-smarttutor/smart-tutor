import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createLecture,
  createMessage,
  createNotifications,
  findUserById,
  getLecturesForRole,
  getNotificationRecipientIdsForStudents,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    : [];
}

function getLectureStatus(value: unknown) {
  if (
    value === "scheduled" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "scheduled";
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lectures = await getLecturesForRole(session.role, session.id);

    return NextResponse.json({ lectures });
  } catch (error) {
    console.error("Get lectures error:", error);

    return NextResponse.json(
      { error: "Unable to load lectures." },
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

    const title = getOptionalText(body.title);
    const startsAt = getOptionalText(body.startsAt);

    if (!title) {
      return NextResponse.json(
        { error: "Lecture title is required." },
        { status: 400 },
      );
    }

    if (!startsAt) {
      return NextResponse.json(
        { error: "Lecture start time is required." },
        { status: 400 },
      );
    }

    const status = getLectureStatus(body.status);

    const lecture = await createLecture({
      title,
      subject: getOptionalText(body.subject),
      batchName: getOptionalText(body.batchName),
      batchId: getOptionalText(body.batchId),
      teacherId: session.id,

      description: getOptionalText(body.description),
      startsAt,
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

      createdBy: session.id,
    });

    const author = (await findUserById(session.id))?.name || session.id;

    const startTime = new Date(lecture.startsAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const isCompletedReport = lecture.status === "completed";

    const notificationRecipientIds =
      lecture.assignedStudentIds && lecture.assignedStudentIds.length > 0
        ? await getNotificationRecipientIdsForStudents(
            lecture.assignedStudentIds,
          )
        : [];

    let messageBody = isCompletedReport
      ? `A daily lecture report has been submitted.\n\n`
      : `A new class has been scheduled.\n\n`;

    messageBody += `Title: ${lecture.title}\n`;

    if (lecture.subject) {
      messageBody += `Subject: ${lecture.subject}\n`;
    }

    if (lecture.batchName) {
      messageBody += `Batch: ${lecture.batchName}\n`;
    }

    messageBody += `Date & Time: ${startTime}\n`;

    if (lecture.topicCovered) {
      messageBody += `Topic Covered: ${lecture.topicCovered}\n`;
    }

    if (lecture.homeworkGiven) {
      messageBody += `Homework: ${lecture.homeworkGiven}\n`;
    }

    if (lecture.assignmentGiven) {
      messageBody += `Assignment: ${lecture.assignmentGiven}\n`;
    }

    if (lecture.revisionTask) {
      messageBody += `Revision Task: ${lecture.revisionTask}\n`;
    }

    if (lecture.doubtsSolved) {
      messageBody += `Doubts Solved: ${lecture.doubtsSolved}\n`;
    }

    if (lecture.nextTopic) {
      messageBody += `Next Topic: ${lecture.nextTopic}\n`;
    }

    if (lecture.meetingLink && !isCompletedReport) {
      messageBody += `Join Class: ${lecture.meetingLink}\n`;
    }

    await createMessage({
      title: isCompletedReport
        ? `Lecture Report: ${lecture.title}`
        : `New Class: ${lecture.title}`,
      body: messageBody,
      channel: isCompletedReport ? "Daily Lecture Report" : "Academic Update",
      author,
      audience: ["student", "parent"],
      userIds:
        lecture.assignedStudentIds && lecture.assignedStudentIds.length > 0
          ? notificationRecipientIds
          : undefined,
      expiresAt: null,
    });

    if (notificationRecipientIds.length > 0) {
      const notificationTitle = isCompletedReport
        ? `Lecture report: ${lecture.title}`
        : `New class: ${lecture.title}`;

      const notificationMessage = isCompletedReport
        ? `The lecture report for ${lecture.title} is available.`
        : `${lecture.title} is scheduled for ${startTime}.`;

      await createNotifications({
        userIds: notificationRecipientIds,
        title: notificationTitle,
        message: notificationMessage,
        type: "lecture",
        link: "/dashboard",
      });
    }

    return NextResponse.json(
      {
        lecture,
        notified: notificationRecipientIds.length > 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create lecture error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create lecture.",
      },
      { status: 500 },
    );
  }
}