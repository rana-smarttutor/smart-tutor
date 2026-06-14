import { NextResponse } from "next/server";

import {
  createAttendanceSheet,
  getAttendanceSheetsForRole,
} from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attendanceSheets = await getAttendanceSheetsForRole(
    session.role,
    session.id,
  );

  return NextResponse.json({ attendanceSheets });
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

  const attendanceSheet = await createAttendanceSheet({
    title: String(body.title ?? ""),
    date: String(body.date ?? ""),
    batchName: body.batchName ? String(body.batchName) : undefined,
    subject: body.subject ? String(body.subject) : undefined,
    createdBy: session.id,
    records: Array.isArray(body.records) ? body.records : [],
  });

  return NextResponse.json({ attendanceSheet });
}