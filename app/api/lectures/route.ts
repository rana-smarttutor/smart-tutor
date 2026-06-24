import { NextResponse } from "next/server";

import {
  createLecture,
  createMessage,
  getLecturesForRole,
  findUserById,
} from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lectures = await getLecturesForRole(session.role, session.id);

  return NextResponse.json({ lectures });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "educator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const lecture = await createLecture({
    title: String(body.title ?? ""),
    subject: body.subject ? String(body.subject) : undefined,
    batchName: body.batchName ? String(body.batchName) : undefined,
    description: body.description ? String(body.description) : undefined,
    startsAt: String(body.startsAt ?? ""),
    endsAt: body.endsAt ? String(body.endsAt) : undefined,
    meetingLink: body.meetingLink ? String(body.meetingLink) : undefined,
    recordingLink: body.recordingLink ? String(body.recordingLink) : undefined,
    materialLink: body.materialLink ? String(body.materialLink) : undefined,
    assignedStudentIds: Array.isArray(body.assignedStudentIds)
      ? body.assignedStudentIds
      : [],
    status: body.status ?? "scheduled",
    createdBy: session.id,
  });

  const author = (await findUserById(session.id))?.name || session.id;
  const startTime = lecture.startsAt
    ? new Date(lecture.startsAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "TBD";

  let msgBody = `A new class has been scheduled.\n\n`;
  msgBody += `Title: ${lecture.title}\n`;
  if (lecture.subject) msgBody += `Subject: ${lecture.subject}\n`;
  if (lecture.batchName) msgBody += `Batch: ${lecture.batchName}\n`;
  if (lecture.description) msgBody += `Details: ${lecture.description}\n`;
  msgBody += `Start: ${startTime}\n`;
  if (lecture.meetingLink) msgBody += `Join: ${lecture.meetingLink}\n`;

  await createMessage({
    title: `New Class: ${lecture.title}`,
    body: msgBody,
    channel: "Academic Update",
    author,
    audience: ["student", "parent"],
    userIds:
      lecture.assignedStudentIds?.length
        ? lecture.assignedStudentIds
        : undefined,
    expiresAt: lecture.startsAt
      ? new Date(
          new Date(lecture.startsAt).getTime() + 24 * 60 * 60 * 1000,
        ).toISOString()
      : null,
  });

  return NextResponse.json({ lecture, notified: true });
}