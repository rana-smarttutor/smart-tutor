import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  deleteAttendanceSheet,
  getAttendanceSheetsForRole,
  updateAttendanceSheet,
} from "@/lib/data-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    attendanceId: string;
  }>;
};

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

async function getAllowedAttendanceSheet(
  attendanceId: string,
  role: "admin" | "educator",
  userId: string,
) {
  const attendanceSheets = await getAttendanceSheetsForRole(
    role,
    userId,
  );

  return (
    attendanceSheets.find((sheet) => sheet.id === attendanceId) ?? null
  );
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

    const { attendanceId } = await context.params;
    const existingAttendanceSheet = await getAllowedAttendanceSheet(
  attendanceId,
  session.role,
  session.id,
);

if (!existingAttendanceSheet) {
  return NextResponse.json(
    {
      error:
        "Attendance sheet not found or you do not have permission to edit it.",
    },
    { status: 404 },
  );
}
    const body = (await request.json()) as Record<string, unknown>;

    const attendanceSheet = await updateAttendanceSheet(attendanceId, {
      title: getOptionalText(body.title),
      date: getOptionalText(body.date),
      subject: getOptionalText(body.subject),
      lectureId: getOptionalText(body.lectureId),
      records: Array.isArray(body.records) ? body.records : undefined,
    });

    if (!attendanceSheet) {
      return NextResponse.json(
        { error: "Attendance sheet not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ attendanceSheet });
  } catch (error) {
    console.error("Update attendance error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update attendance sheet.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { attendanceId } = await context.params;
    const existingAttendanceSheet = await getAllowedAttendanceSheet(
  attendanceId,
  session.role,
  session.id,
);

if (!existingAttendanceSheet) {
  return NextResponse.json(
    {
      error:
        "Attendance sheet not found or you do not have permission to delete it.",
    },
    { status: 404 },
  );
}
    const deleted = await deleteAttendanceSheet(attendanceId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Attendance sheet not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attendance error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete attendance sheet.",
      },
      { status: 500 },
    );
  }
}