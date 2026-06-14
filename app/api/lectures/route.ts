import { NextResponse } from "next/server";

import { createLecture, getLecturesForRole } from "@/lib/data-store";
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

  return NextResponse.json({ lecture });
}