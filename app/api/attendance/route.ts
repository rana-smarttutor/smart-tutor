import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createAttendanceSheet,
  createNotifications,
  getAttendanceSheetsForRole,
  getNotificationRecipientIdsForStudents,
} from "@/lib/data-store";
import type { AttendanceSheet } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendanceSheets = await getAttendanceSheetsForRole(
      session.role,
      session.id,
    );

    return NextResponse.json({ attendanceSheets });
  } catch (error) {
    console.error("Get attendance error:", error);

    return NextResponse.json(
      { error: "Unable to load attendance sheets." },
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
    const date = getOptionalText(body.date);

    if (!title) {
      return NextResponse.json(
        { error: "Attendance title is required." },
        { status: 400 },
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Attendance date is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.records) || body.records.length === 0) {
      return NextResponse.json(
        { error: "Add at least one student attendance record." },
        { status: 400 },
      );
    }

    const attendanceSheet = await createAttendanceSheet({
      title,
      date,
      lectureId: getOptionalText(body.lectureId),
      subject: getOptionalText(body.subject),
      createdBy: session.id,
      records: body.records as AttendanceSheet["records"],
    });

    const notificationResults = await Promise.all(
  attendanceSheet.records.map(async (record) => {
    const recipientIds = await getNotificationRecipientIdsForStudents([
      record.studentId,
    ]);

    if (!recipientIds.length) {
      return false;
    }

    const attendanceDate = new Date(
      `${attendanceSheet.date}T00:00:00`,
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    await createNotifications({
      userIds: recipientIds,
      title: `Attendance updated: ${attendanceSheet.title}`,
      message: `Attendance for ${attendanceDate} has been marked as ${record.status}.`,
      type: "attendance",
      link: "/dashboard",
    });

    return true;
  }),
);

return NextResponse.json(
  {
    attendanceSheet,
    notified: notificationResults.filter(Boolean).length > 0,
  },
  { status: 201 },
);
  } catch (error) {
    console.error("Create attendance error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create attendance sheet.",
      },
      { status: 500 },
    );
  }
}