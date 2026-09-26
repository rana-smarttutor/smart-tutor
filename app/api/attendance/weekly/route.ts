import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  getAttendanceSheetsForRole,
  getStudentDirectory,
} from "@/lib/data-store";

import type {
  AttendanceStatus,
  AttendanceSheet,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AttendanceCounts = {
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  attendancePercentage: number | null;
};

function indiaDate(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function getWeekStart(endDate: string): string {
  const date = new Date(`${endDate}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() - 6);

  return date.toISOString().slice(0, 10);
}

function calculateCounts(
  statuses: AttendanceStatus[],
): AttendanceCounts {
  const present = statuses.filter(
    (status) => status === "present",
  ).length;

  const absent = statuses.filter(
    (status) => status === "absent",
  ).length;

  const late = statuses.filter(
    (status) => status === "late",
  ).length;

  const leave = statuses.filter(
    (status) => status === "excused",
  ).length;

  const total = statuses.length;

  // Approved leave is excluded from the percentage denominator.
  const eligibleSessions = present + absent + late;

  const attendancePercentage =
    eligibleSessions > 0
      ? Math.round(
          ((present + late) / eligibleSessions) * 100,
        )
      : null;

  return {
    present,
    absent,
    late,
    leave,
    total,
    attendancePercentage,
  };
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Only Admin can access all student weekly attendance reports.",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const endDate =
      searchParams.get("endDate") || indiaDate();

    if (!isValidDate(endDate)) {
      return NextResponse.json(
        { error: "Invalid report end date." },
        { status: 400 },
      );
    }

    if (endDate > indiaDate()) {
      return NextResponse.json(
        {
          error:
            "Weekly reports cannot include future dates.",
        },
        { status: 400 },
      );
    }

    const startDate = getWeekStart(endDate);

    const [allSheets, students] = await Promise.all([
      getAttendanceSheetsForRole(
        "admin",
        session.id,
      ),

      getStudentDirectory(),
    ]);

    const weeklySheets = allSheets.filter(
      (sheet: AttendanceSheet) =>
        sheet.date >= startDate &&
        sheet.date <= endDate &&
        sheet.lectureId !== "faculty",
    );

    const reports = students.map((student) => {
      const studentRecords = weeklySheets.flatMap(
        (sheet: AttendanceSheet) =>
          sheet.records
            .filter(
              (record) =>
                record.studentId === student.id,
            )
            .map((record) => ({
              date: sheet.date,
              subject: sheet.subject || "General",
              attendanceSheetId: sheet.id,
              status: record.status,
              remarks: record.remarks || "",
            })),
      );

      const counts = calculateCounts(
        studentRecords.map(
          (record) => record.status,
        ),
      );

      return {
        studentId: student.id,
        studentName: student.name,

        course:
          student.profile?.courseWantedTitle ||
          student.profile?.courseWanted ||
          student.program ||
          "Not assigned",

        branch:
          student.profile?.campusLocationTitle ||
          student.profile?.branch ||
          "Not assigned",

        // The existing student profile does not
        // reliably expose a separate batch field.
        batch: "Not assigned",

        startDate,
        endDate,

        ...counts,

        records: studentRecords,
      };
    });

    const studentsWithAttendance = reports.filter(
      (report) => report.total > 0,
    ).length;

    const summary = {
      totalStudents: students.length,
      studentsWithAttendance,
      studentsWithoutAttendance:
        students.length - studentsWithAttendance,

      totalAttendanceSessions: reports.reduce(
        (sum, report) => sum + report.total,
        0,
      ),

      totalPresent: reports.reduce(
        (sum, report) => sum + report.present,
        0,
      ),

      totalAbsent: reports.reduce(
        (sum, report) => sum + report.absent,
        0,
      ),

      totalLate: reports.reduce(
        (sum, report) => sum + report.late,
        0,
      ),

      totalLeave: reports.reduce(
        (sum, report) => sum + report.leave,
        0,
      ),
    };

    return NextResponse.json({
      success: true,

      reportType: "weekly",

      startDate,
      endDate,

      generatedAt: new Date().toISOString(),

      summary,
      reports,

      deliveryStatus: "not_configured",
    });
  } catch (error) {
    console.error(
      "Weekly attendance report error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate weekly attendance report.",
      },
      { status: 500 },
    );
  }
}
