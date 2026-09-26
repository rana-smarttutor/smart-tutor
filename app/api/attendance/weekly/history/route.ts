import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredReport = {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  branch: string;
  batch?: string;
  startDate: string;
  endDate: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  attendancePercentage: number | null;
  records: Array<{
    date: string;
    subject: string;
    attendanceSheetId: string;
    status: string;
    remarks: string;
  }>;
  deliveryStatus?: string;
  generatedAt: string;
};

type SavedWeek = {
  startDate: string;
  endDate: string;
  reportCount: number;
  generatedAt: string;
};

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only Admin can access saved weekly attendance reports." },
        { status: 403 },
      );
    }

    const db = await getMongoDatabase();
    const collection = db.collection<StoredReport>("weeklyAttendanceReports");
    const requestedEndDate = new URL(request.url).searchParams.get("endDate");

    if (!requestedEndDate) {
      const weeks = await collection
        .aggregate<SavedWeek>([
          {
            $group: {
              _id: { startDate: "$startDate", endDate: "$endDate" },
              reportCount: { $sum: 1 },
              generatedAt: { $max: "$generatedAt" },
            },
          },
          { $sort: { "_id.endDate": -1 } },
          { $limit: 104 },
          {
            $project: {
              _id: 0,
              startDate: "$_id.startDate",
              endDate: "$_id.endDate",
              reportCount: 1,
              generatedAt: 1,
            },
          },
        ])
        .toArray();

      return NextResponse.json({ success: true, weeks });
    }

    if (!validDate(requestedEndDate)) {
      return NextResponse.json(
        { error: "Invalid saved report end date." },
        { status: 400 },
      );
    }

    // A saved report is an immutable snapshot: do not regenerate it here.
    const stored = await collection
      .find({ endDate: requestedEndDate }, { projection: { _id: 0 } })
      .sort({ studentName: 1, studentId: 1 })
      .toArray();

    if (stored.length === 0) {
      return NextResponse.json(
        { error: "No saved weekly report exists for that date." },
        { status: 404 },
      );
    }

    const reports = stored.map((report) => ({
      studentId: report.studentId,
      studentName: report.studentName,
      course: report.course,
      branch: report.branch,
      batch: report.batch ?? "Not assigned",
      startDate: report.startDate,
      endDate: report.endDate,
      present: report.present,
      absent: report.absent,
      late: report.late,
      leave: report.leave,
      total: report.total,
      attendancePercentage: report.attendancePercentage,
      records: report.records,
      deliveryStatus: report.deliveryStatus ?? "not_configured",
    }));

    const sum = (key: "total" | "present" | "absent" | "late" | "leave") =>
      reports.reduce((value, report) => value + report[key], 0);

    const studentsWithAttendance = reports.filter((r) => r.total > 0).length;

    return NextResponse.json({
      success: true,
      source: "saved",
      reportType: "weekly",
      startDate: stored[0].startDate,
      endDate: stored[0].endDate,
      generatedAt: stored.reduce(
        (latest, report) =>
          report.generatedAt > latest ? report.generatedAt : latest,
        stored[0].generatedAt,
      ),
      summary: {
        totalStudents: reports.length,
        studentsWithAttendance,
        studentsWithoutAttendance: reports.length - studentsWithAttendance,
        totalAttendanceSessions: sum("total"),
        totalPresent: sum("present"),
        totalAbsent: sum("absent"),
        totalLate: sum("late"),
        totalLeave: sum("leave"),
      },
      reports,
    });
  } catch (error) {
    console.error("Saved weekly attendance history error:", error);
    return NextResponse.json(
      { error: "Unable to load saved weekly attendance history." },
      { status: 500 },
    );
  }
}
