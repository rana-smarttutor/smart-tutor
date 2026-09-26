import { NextResponse } from "next/server";

import { getAttendanceSheetsForRole, getStudentDirectory } from "@/lib/data-store";
import { getMongoDatabase } from "@/lib/mongodb";
import type { AttendanceStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WeeklyRecord = {
  date: string;
  subject: string;
  attendanceSheetId: string;
  status: AttendanceStatus;
  remarks: string;
};

type WeeklyReportDocument = {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  branch: string;
  startDate: string;
  endDate: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  attendancePercentage: number | null;
  records: WeeklyRecord[];
  deliveryStatus: "not_configured";
  generatedAt: string;
};

function indiaToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

function reportPeriod(): { startDate: string; endDate: string } {
  // Complete Monday–Sunday week, ending on the most recently finished Sunday.
  // The scheduled run occurs on Monday at 00:30 India time.
  const today = new Date(`${indiaToday()}T00:00:00.000Z`);
  const day = today.getUTCDay();
  today.setUTCDate(today.getUTCDate() - (day === 0 ? 7 : day));
  const endDate = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() - 6);
  return { startDate: today.toISOString().slice(0, 10), endDate };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (
    !secret ||
    secret.length < 16 ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { startDate, endDate } = reportPeriod();
    const [sheets, students, db] = await Promise.all([
      getAttendanceSheetsForRole("admin"),
      getStudentDirectory(),
      getMongoDatabase(),
    ]);

    const weeklySheets = sheets.filter(
      (sheet) =>
        sheet.date >= startDate &&
        sheet.date <= endDate &&
        sheet.lectureId !== "faculty",
    );

    const reports = db.collection<WeeklyReportDocument>(
      "weeklyAttendanceReports",
    );
    await reports.createIndex({ id: 1 }, { unique: true });

    let created = 0;
    let previouslyGenerated = 0;

    for (const student of students) {
      const records: WeeklyRecord[] = weeklySheets.flatMap((sheet) =>
        sheet.records
          .filter((record) => record.studentId === student.id)
          .map((record) => ({
            date: sheet.date,
            subject: sheet.subject || "General",
            attendanceSheetId: sheet.id,
            status: record.status,
            remarks: record.remarks || "",
          })),
      );

      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      const leave = records.filter((r) => r.status === "excused").length;
      const denominator = present + absent + late;

      const document: WeeklyReportDocument = {
        id: `${startDate}_${endDate}_${student.id}`,
        studentId: student.id,
        studentName: student.name,
        course:
          student.profile?.courseWantedTitle ||
          student.profile?.courseWanted ||
          student.program ||
          "Not assigned",
        branch: student.profile?.branch || "Not assigned",
        startDate,
        endDate,
        present,
        absent,
        late,
        leave,
        total: records.length,
        attendancePercentage:
          denominator > 0
            ? Math.round(((present + late) / denominator) * 100)
            : null,
        records,
        // No WhatsApp messages are sent until an approved provider and opt-in
        // process are configured. Never label these reports as delivered.
        deliveryStatus: "not_configured",
        generatedAt: new Date().toISOString(),
      };

      const result = await reports.updateOne(
        { id: document.id },
        { $setOnInsert: document },
        { upsert: true },
      );

      if (result.upsertedCount > 0) created += 1;
      else previouslyGenerated += 1;
    }

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      students: students.length,
      created,
      previouslyGenerated,
      whatsapp: "not_configured",
    });
  } catch (error) {
    console.error("Weekly attendance cron error:", error);
    return NextResponse.json(
      { error: "Unable to generate saved weekly attendance reports." },
      { status: 500 },
    );
  }
}
