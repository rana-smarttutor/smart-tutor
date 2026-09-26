import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";

import {
  bulkMarkStaffAttendance,
  createRegularisationRequest,
  findUserById,
  getRegularisationRequests,
  getStaffAttendanceForDate,
  getStaffAttendanceForDateRange,
  getStaffAttendanceForToday,
  getStaffAttendanceStats,
  reviewRegularisationRequest,
  selfCheckIn,
  selfCheckOut,
} from "@/lib/data-store";

import type {
  Role,
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  StaffCategory,
  EmploymentType,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF_ROLES: Role[] = [
  "admin",
  "educator",
  "staff",
  "counsellor",
];

const VALID_STATUSES: StaffAttendanceStatus[] = [
  "present",
  "absent",
  "half_day",
  "late",
  "on_leave",
  "holiday",
];

const VALID_EMPLOYMENT_TYPES: EmploymentType[] = [
  "full_time",
  "part_time",
  "contractual",
  "hourly",
];

function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

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

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function categoryForRole(role: Role): StaffCategory {
  if (role === "admin") return "Admin";
  if (role === "educator") return "Teacher";
  if (role === "counsellor") return "Counsellor";

  return "Staff";
}

function calculateStats(records: StaffAttendanceRecord[]) {
  return {
    total: records.length,
    present: records.filter((record) => record.status === "present").length,
    absent: records.filter((record) => record.status === "absent").length,
    halfDay: records.filter((record) => record.status === "half_day").length,
    late: records.filter((record) => record.status === "late").length,
    onLeave: records.filter((record) => record.status === "on_leave").length,
    holiday: records.filter((record) => record.status === "holiday").length,
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

    if (!isStaffRole(session.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const requestedUserId = searchParams.get("userId");

    if (
      session.role !== "admin" &&
      requestedUserId &&
      requestedUserId !== session.id
    ) {
      return NextResponse.json(
        { error: "You can only view your own attendance." },
        { status: 403 },
      );
    }

    if (startDate || endDate) {
      if (
        !startDate ||
        !endDate ||
        !isValidDate(startDate) ||
        !isValidDate(endDate) ||
        startDate > endDate
      ) {
        return NextResponse.json(
          { error: "Invalid attendance date range." },
          { status: 400 },
        );
      }

      const userId =
        session.role === "admin"
          ? requestedUserId || undefined
          : session.id;

      const records = await getStaffAttendanceForDateRange(
        startDate,
        endDate,
        userId,
      );

      return NextResponse.json({
        records,
        startDate,
        endDate,
      });
    }

    const date = searchParams.get("date") || todayInIndia();

    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: "Invalid date." },
        { status: 400 },
      );
    }

    if (session.role === "admin") {
      const records = await getStaffAttendanceForDate(date);
      const stats = await getStaffAttendanceStats(date);

      return NextResponse.json({
        records,
        stats,
        date,
      });
    }

    const myRecord = await getStaffAttendanceForToday(
      session.id,
      date,
    );

    const records = myRecord ? [myRecord] : [];

    return NextResponse.json({
      records,
      stats: calculateStats(records),
      date,
    });
  } catch (error) {
    console.error("Get staff attendance error:", error);

    return NextResponse.json(
      { error: "Unable to load staff attendance." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isStaffRole(session.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const action = String(body.action || "");
    const date = String(body.date || todayInIndia());

    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: "Invalid attendance date." },
        { status: 400 },
      );
    }

    // ========================================
    // SELF CHECK-IN
    // ========================================

    if (action === "checkin") {
      if (date !== todayInIndia()) {
        return NextResponse.json(
          { error: "Check-in is only allowed for today." },
          { status: 400 },
        );
      }

      const existing = await getStaffAttendanceForToday(
        session.id,
        date,
      );

      if (existing?.checkIn) {
        return NextResponse.json(
          { error: "You have already checked in today." },
          { status: 409 },
        );
      }

      await selfCheckIn(
        session.id,
        session.name,
        session.email,
        session.role,
        date,
      );

      const updated = await getStaffAttendanceForToday(
        session.id,
        date,
      );

      await logAction({
        action: "create",
        category: "attendance",
        details: `Staff check-in recorded for ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: {
          action: "checkin",
          date,
          before: existing,
          after: updated,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Check-in recorded.",
        record: updated,
      });
    }

    // ========================================
    // SELF CHECK-OUT
    // ========================================

    if (action === "checkout") {
      if (date !== todayInIndia()) {
        return NextResponse.json(
          { error: "Check-out is only allowed for today." },
          { status: 400 },
        );
      }

      const existing = await getStaffAttendanceForToday(
        session.id,
        date,
      );

      if (!existing?.checkIn) {
        return NextResponse.json(
          { error: "Check in first." },
          { status: 400 },
        );
      }

      if (existing.checkOut) {
        return NextResponse.json(
          { error: "You have already checked out today." },
          { status: 409 },
        );
      }

      await selfCheckOut(session.id, date);

      const updated = await getStaffAttendanceForToday(
        session.id,
        date,
      );

      await logAction({
        action: "update",
        category: "attendance",
        details: `Staff check-out recorded for ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: {
          action: "checkout",
          date,
          before: existing,
          after: updated,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Check-out recorded.",
        record: updated,
      });
    }

    // ========================================
    // ADMIN BULK ATTENDANCE
    // ========================================

    if (action === "bulk-mark") {
      if (session.role !== "admin") {
        return NextResponse.json(
          { error: "Only Admin can mark staff attendance." },
          { status: 403 },
        );
      }

      if (
        !Array.isArray(body.records) ||
        body.records.length === 0 ||
        body.records.length > 200
      ) {
        return NextResponse.json(
          {
            error:
              "Provide between 1 and 200 attendance records.",
          },
          { status: 400 },
        );
      }

      const submittedRecords = body.records as Array<
        Record<string, unknown>
      >;

      const validatedRecords = [];

      const seenUserIds = new Set<string>();

      for (const submitted of submittedRecords) {
        const userId = String(submitted.userId || "");

        if (!userId || seenUserIds.has(userId)) {
          return NextResponse.json(
            { error: "Missing or duplicate employee ID." },
            { status: 400 },
          );
        }

        seenUserIds.add(userId);

        const user = await findUserById(userId);

        if (!user || !isStaffRole(user.role)) {
          return NextResponse.json(
            {
              error: `Invalid staff account: ${userId}`,
            },
            { status: 400 },
          );
        }

        const status = String(
          submitted.status || "",
        ) as StaffAttendanceStatus;

        if (!VALID_STATUSES.includes(status)) {
          return NextResponse.json(
            {
              error: `Invalid attendance status for ${user.name}.`,
            },
            { status: 400 },
          );
        }

        const checkIn = submitted.checkIn
          ? String(submitted.checkIn)
          : undefined;

        const checkOut = submitted.checkOut
          ? String(submitted.checkOut)
          : undefined;

        if (
          (checkIn && !isValidTime(checkIn)) ||
          (checkOut && !isValidTime(checkOut))
        ) {
          return NextResponse.json(
            {
              error: `Invalid check-in/out time for ${user.name}.`,
            },
            { status: 400 },
          );
        }

        if (checkOut && !checkIn) {
          return NextResponse.json(
            {
              error: `${user.name} cannot check out without checking in.`,
            },
            { status: 400 },
          );
        }

        const submittedEmploymentType = String(
          submitted.employmentType || "full_time",
        ) as EmploymentType;

        const employmentType =
          VALID_EMPLOYMENT_TYPES.includes(submittedEmploymentType)
            ? submittedEmploymentType
            : "full_time";

        validatedRecords.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          category: categoryForRole(user.role),
          employmentType,
          status,
          checkIn,
          checkOut,
        });
      }

      const before = await getStaffAttendanceForDate(date);

      const results = await bulkMarkStaffAttendance(
        validatedRecords,
        date,
        session.id,
      );

      await logAction({
        action: "update",
        category: "attendance",
        details:
          `Staff attendance marked for ${results.length} employees on ${date}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: {
          action: "bulk-mark",
          date,
          recordCount: results.length,
          before: before.filter((record) =>
            seenUserIds.has(record.userId),
          ),
          after: results,
        },
      });

      return NextResponse.json({
        success: true,
        records: results,
      });
    }

    // ========================================
    // REGULARISATION REQUEST
    // ========================================

    if (action === "regularise") {
      const reason = String(body.reason || "").trim();

      const requestedStatus = String(
        body.requestedStatus || "present",
      ) as StaffAttendanceStatus;

      if (!reason || reason.length > 1000) {
        return NextResponse.json(
          {
            error:
              "A reason of up to 1000 characters is required.",
          },
          { status: 400 },
        );
      }

      if (!VALID_STATUSES.includes(requestedStatus)) {
        return NextResponse.json(
          { error: "Invalid requested status." },
          { status: 400 },
        );
      }

      if (date > todayInIndia()) {
        return NextResponse.json(
          {
            error:
              "Cannot regularise attendance for a future date.",
          },
          { status: 400 },
        );
      }

      const requestedCheckIn = body.requestedCheckIn
        ? String(body.requestedCheckIn)
        : undefined;

      const requestedCheckOut = body.requestedCheckOut
        ? String(body.requestedCheckOut)
        : undefined;

      if (
        (requestedCheckIn && !isValidTime(requestedCheckIn)) ||
        (requestedCheckOut && !isValidTime(requestedCheckOut))
      ) {
        return NextResponse.json(
          { error: "Invalid requested time." },
          { status: 400 },
        );
      }

      const regularisationRequest =
        await createRegularisationRequest({
          userId: session.id,
          userName: session.name,
          userEmail: session.email,
          date,
          reason,
          requestedCheckIn,
          requestedCheckOut,
          requestedStatus,
        });

      await logAction({
        action: "create",
        category: "attendance",
        details:
          `Attendance regularisation requested by ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: {
          action: "regularise",
          date,
          requestId: regularisationRequest.id,
        },
      });

      return NextResponse.json({
        success: true,
        request: regularisationRequest,
      });
    }

    // ========================================
    // ADMIN REVIEW
    // ========================================

    if (action === "review") {
      if (session.role !== "admin") {
        return NextResponse.json(
          { error: "Only Admin can review requests." },
          { status: 403 },
        );
      }

      const requestId = String(body.requestId || "");

      const reviewStatus = String(
        body.reviewStatus || "",
      );

      if (
        !requestId ||
        (reviewStatus !== "approved" &&
          reviewStatus !== "rejected")
      ) {
        return NextResponse.json(
          { error: "Invalid request ID or review status." },
          { status: 400 },
        );
      }

      const reviewComment = body.reviewComment
        ? String(body.reviewComment)
        : undefined;

      const reviewResult = await reviewRegularisationRequest(
        requestId,
        session.id,
        reviewStatus,
        reviewComment,
      );

      if (!reviewResult) {
        return NextResponse.json(
          { error: "Request not found." },
          { status: 404 },
        );
      }

      await logAction({
        action: "update",
        category: "attendance",
        details:
          `Regularisation ${requestId} ${reviewStatus} by ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: {
          action: "review",
          requestId,
          reviewStatus,
          reviewComment,
        },
      });

      return NextResponse.json({
        success: true,
      });
    }

    // ========================================
    // LIST REGULARISATION REQUESTS
    // ========================================

    if (action === "list-regularisations") {
      const suppliedStatus = body.status
        ? String(body.status)
        : undefined;

      const filterStatus =
        suppliedStatus === "pending" ||
        suppliedStatus === "approved" ||
        suppliedStatus === "rejected"
          ? suppliedStatus
          : undefined;

      const filterUserId =
        session.role === "admin"
          ? body.userId
            ? String(body.userId)
            : undefined
          : session.id;

      const requests = await getRegularisationRequests({
        status: filterStatus,
        userId: filterUserId,
      });

      return NextResponse.json({
        requests,
      });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Staff attendance action error:", error);

    return NextResponse.json(
      { error: "Unable to process request." },
      { status: 500 },
    );
  }
}
