import { NextResponse } from "next/server";

import {
  deleteAttendanceSheet,
  updateAttendanceSheet,
} from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    attendanceId: string;
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

  const { attendanceId } = await context.params;
  const body = await request.json();

  const attendanceSheet = await updateAttendanceSheet(attendanceId, {
    title: body.title,
    date: body.date,
    batchName: body.batchName,
    subject: body.subject,
    records: body.records,
  });

  if (!attendanceSheet) {
    return NextResponse.json(
      { error: "Attendance sheet not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ attendanceSheet });
}
export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "educator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { attendanceId } = await context.params;

  const deleted = await deleteAttendanceSheet(attendanceId);

  if (!deleted) {
    return NextResponse.json(
      { error: "Attendance sheet not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}