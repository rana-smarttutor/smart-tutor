import { NextResponse } from "next/server";

import { updateLecture } from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    lectureId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "educator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lectureId } = await context.params;
  const body = await request.json();

  const lecture = await updateLecture(lectureId, {
    title: body.title,
    subject: body.subject,
    batchName: body.batchName,
    description: body.description,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    meetingLink: body.meetingLink,
    recordingLink: body.recordingLink,
    materialLink: body.materialLink,
    assignedStudentIds: body.assignedStudentIds,
    status: body.status,
  });

  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  return NextResponse.json({ lecture });
}