import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Activity = {
  classTaken: string;
  subjectTopic: string;
  homeworkGiven: string;
  workCompleted: string;
  remarks: string;
};

type StaffUser = {
  id: string;
  name?: string;
  role?: string;
  employeeCode?: string;
  deletedAt?: string;
  profile?: { branch?: string; department?: string; designation?: string };
};

type StaffRecord = {
  id: string;
  userId: string;
  date: string;
  activity?: Activity;
  updatedAt?: string;
};

const staffRoles = new Set(["admin", "educator", "staff", "counsellor"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    datePattern.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function readField(value: unknown, name: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${name} must be text.`);
  const text = value.trim();
  if (text.length > 2000) throw new Error(`${name} cannot exceed 2,000 characters.`);
  return text;
}

async function context(userId: string, date: string) {
  const db = await getMongoDatabase();
  const staff = await db.collection<StaffUser>("users").findOne({
    id: userId,
    deletedAt: { $exists: false },
  });
  if (!staff || !staff.role || !staffRoles.has(staff.role)) return null;

  const attendance = await db.collection<StaffRecord>("staffAttendance").findOne({
    userId,
    date,
  });
  return { db, staff, attendance };
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !staffRoles.has(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? "";
    const userId = url.searchParams.get("userId") || session.id;
    if (!validDate(date)) {
      return NextResponse.json({ error: "Valid YYYY-MM-DD date required." }, { status: 400 });
    }
    if (session.role !== "admin" && userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await context(userId, date);
    if (!result) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }
    return NextResponse.json({
      hasAttendance: Boolean(result.attendance),
      attendanceRecordId: result.attendance?.id ?? null,
      activity: result.attendance?.activity ?? null,
      staff: {
        name: result.staff.name,
        employeeCode: result.staff.employeeCode ?? "",
        staffType: result.staff.role === "educator" ? "teaching" : "non_teaching",
        branch: result.staff.profile?.branch ?? "",
        department: result.staff.profile?.department ?? "",
        designation: result.staff.profile?.designation ?? "",
      },
    });
  } catch (error) {
    console.error("Get staff activities error:", error);
    return NextResponse.json({ error: "Unable to load activities." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !staffRoles.has(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
      if (!body || Array.isArray(body) || typeof body !== "object") throw Error();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const date = typeof body.date === "string" ? body.date : "";
    const userId = typeof body.userId === "string" && body.userId ? body.userId : session.id;
    if (!validDate(date)) {
      return NextResponse.json({ error: "Valid YYYY-MM-DD date required." }, { status: 400 });
    }
    if (session.role !== "admin" && userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await context(userId, date);
    if (!result) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }
    if (!result.attendance) {
      return NextResponse.json(
        { error: "Mark attendance for this employee and date before saving activities." },
        { status: 409 },
      );
    }

    let activity: Activity;
    try {
      const teaching = result.staff.role === "educator";
      activity = {
        classTaken: teaching ? readField(body.classTaken, "Class / batch") : "",
        subjectTopic: teaching ? readField(body.subjectTopic, "Subject / topic") : "",
        homeworkGiven: teaching ? readField(body.homeworkGiven, "Homework") : "",
        workCompleted: teaching ? "" : readField(body.workCompleted, "Work completed"),
        remarks: readField(body.remarks, "Remarks"),
      };
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid activity fields." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const before = result.attendance.activity ?? null;
    await result.db.collection<StaffRecord>("staffAttendance").updateOne(
      { _id: result.attendance._id },
      { $set: { activity, updatedAt: now } },
    );
    await result.db.collection("attendanceAuditLogs").insertOne({
      id: randomUUID(),
      attendanceRecordId: result.attendance.id,
      employeeId: result.staff.employeeCode ?? null,
      staffUserId: userId,
      date,
      action: "update_staff_activity",
      before,
      after: activity,
      changedBy: session.id,
      changedByName: session.name,
      changedAt: now,
    });
    return NextResponse.json({ success: true, activity, savedAt: now });
  } catch (error) {
    console.error("Save staff activities error:", error);
    return NextResponse.json({ error: "Unable to save activities." }, { status: 500 });
  }
}
