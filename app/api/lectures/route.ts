import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit-log";
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
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStudentIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string =>
        typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function getLectureStatus(value: unknown): "scheduled" | "completed" | "cancelled" {
  if (value === "scheduled" || value === "completed" || value === "cancelled") {
    return value;
  }
  return "scheduled";
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Staff and counsellors need a faculty-wide view to schedule lectures.
    // The datastore already provides the staff-level list.
    const roleForRead = session.role === "counsellor" ? "staff" : session.role;
    const lectures = await getLecturesForRole(roleForRead, session.id);
    return NextResponse.json({ lectures });
  } catch (error) {
    console.error("Get lectures error:", error);
    return NextResponse.json({ error: "Unable to load lectures." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canAssignFaculty =
      session.role === "admin" ||
      session.role === "staff" ||
      session.role === "counsellor";
    if (!canAssignFaculty && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const body = rawBody as Record<string, unknown>;
    const title = getOptionalText(body.title);
    const startsAt = getOptionalText(body.startsAt);
    const endsAt = getOptionalText(body.endsAt);

    if (!title) return NextResponse.json({ error: "Lecture title is required." }, { status: 400 });
    if (!startsAt || !Number.isFinite(Date.parse(startsAt))) {
      return NextResponse.json({ error: "Valid lecture start time is required." }, { status: 400 });
    }
    if (endsAt && (!Number.isFinite(Date.parse(endsAt)) || Date.parse(endsAt) <= Date.parse(startsAt))) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const requestedTeacherId = getOptionalText(body.teacherId);
    if (session.role === "educator" && requestedTeacherId && requestedTeacherId !== session.id) {
      return NextResponse.json({ error: "Educators can only create their own lectures." }, { status: 403 });
    }
    const teacherId = canAssignFaculty ? requestedTeacherId || session.id : session.id;
    const teacher = await findUserById(teacherId);
    if (!teacher || (teacher.role !== "educator" && !(session.role === "admin" && teacher.id === session.id))) {
      return NextResponse.json({ error: "Select a valid teaching faculty member." }, { status: 400 });
    }
    // Admin-created legacy lectures without teacherId remain compatible.
    const status = getLectureStatus(body.status);
    const lecture = await createLecture({
      title,
      subject: getOptionalText(body.subject),
      teacherId: teacher.id,
      teacherName: teacher.name,
      description: getOptionalText(body.description),
      startsAt,
      endsAt,
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
        ? await getNotificationRecipientIdsForStudents(lecture.assignedStudentIds)
        : [];

    let messageBody = isCompletedReport
      ? "A daily lecture report has been submitted.\n\n"
      : "A new class has been scheduled.\n\n";
    messageBody += `Title: ${lecture.title}\n`;
    if (lecture.subject) messageBody += `Subject: ${lecture.subject}\n`;
    messageBody += `Faculty: ${lecture.teacherName}\n`;
    messageBody += `Date & Time: ${startTime}\n`;
    if (lecture.topicCovered) messageBody += `Topic Covered: ${lecture.topicCovered}\n`;
    if (lecture.homeworkGiven) messageBody += `Homework: ${lecture.homeworkGiven}\n`;
    if (lecture.assignmentGiven) messageBody += `Assignment: ${lecture.assignmentGiven}\n`;
    if (lecture.revisionTask) messageBody += `Revision Task: ${lecture.revisionTask}\n`;
    if (lecture.doubtsSolved) messageBody += `Doubts Solved: ${lecture.doubtsSolved}\n`;
    if (lecture.nextTopic) messageBody += `Next Topic: ${lecture.nextTopic}\n`;
    if (lecture.meetingLink && !isCompletedReport) {
      messageBody += `Join Class: ${lecture.meetingLink}\n`;
    }

    await createMessage({
      title: isCompletedReport ? `Lecture Report: ${lecture.title}` : `New Class: ${lecture.title}`,
      body: messageBody,
      channel: isCompletedReport ? "Daily Lecture Report" : "Academic Update",
      author,
      audience: ["student", "parent"],
      userIds: notificationRecipientIds.length ? notificationRecipientIds : undefined,
      expiresAt: null,
    });

    if (notificationRecipientIds.length > 0) {
      await createNotifications({
        userIds: notificationRecipientIds,
        title: isCompletedReport ? `Lecture report: ${lecture.title}` : `New class: ${lecture.title}`,
        message: isCompletedReport
          ? `The lecture report for ${lecture.title} is available.`
          : `${lecture.title} is scheduled for ${startTime}.`,
        type: "lecture",
        link: "/dashboard",
      });
    }

    await logAction({
      action: "create",
      category: "courses",
      details: `Lecture created: ${lecture.title}, faculty: ${teacher.name}`,
      path: "/api/lectures",
      method: "POST",
      request,
      session,
      metadata: {
        lectureId: lecture.id,
        title: lecture.title,
        subject: lecture.subject,
        teacherId: teacher.id,
        createdBy: session.id,
      },
    });

    return NextResponse.json(
      { lecture, notified: notificationRecipientIds.length > 0 },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create lecture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create lecture." },
      { status: 500 },
    );
  }
}
