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

const STAFF_ROLES: Role[] = ["admin", "educator", "staff", "counsellor"];

const MANAGER_ROLES: Role[] = ["admin", "staff", "counsellor"];

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

function isStaffRole(role: Role) {
  return STAFF_ROLES.includes(role);
}

function canManageAttendance(role: Role) {
  return MANAGER_ROLES.includes(role);
}

function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function categoryForRole(role: Role): StaffCategory {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "educator") {
    return "Teacher";
  }

  if (role === "counsellor") {
    return "Counsellor";
  }

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

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

// ======================================================
// GET STAFF ATTENDANCE
// ======================================================

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    if (!isStaffRole(session.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");

    const endDate = searchParams.get("endDate");

    const requestedUserId = searchParams.get("userId");

    if (
      !canManageAttendance(session.role) &&
      requestedUserId &&
      requestedUserId !== session.id
    ) {
      return errorResponse("You can only view your own attendance.", 403);
    }

    // --------------------------------------------------
    // DATE RANGE ATTENDANCE
    // --------------------------------------------------

    if (startDate || endDate) {
      if (
        !startDate ||
        !endDate ||
        !isValidDate(startDate) ||
        !isValidDate(endDate) ||
        startDate > endDate
      ) {
        return errorResponse("Invalid attendance date range.", 400);
      }

      const targetUserId = canManageAttendance(session.role)
        ? requestedUserId || undefined
        : session.id;

      console.log("[Staff Attendance] Loading date range", {
        role: session.role,
        startDate,
        endDate,
      });

      const records = await getStaffAttendanceForDateRange(
        startDate,
        endDate,
        targetUserId,
      );

      console.log("[Staff Attendance] Date range loaded:", records.length);

      return NextResponse.json({
        records,
        startDate,
        endDate,
      });
    }

    // --------------------------------------------------
    // DAILY ATTENDANCE
    // --------------------------------------------------

    const date = searchParams.get("date") || todayInIndia();

    if (!isValidDate(date)) {
      return errorResponse("Invalid date.", 400);
    }

    // --------------------------------------------------
    // ADMIN / STAFF / COUNSELLOR
    // --------------------------------------------------

    if (canManageAttendance(session.role)) {
      console.log("[Staff Attendance GET] Starting", {
        role: session.role,
        date,
      });

      // Load records separately so we can identify
      // the failing database operation.

      let records: StaffAttendanceRecord[];

      try {
        records = await getStaffAttendanceForDate(date);

        console.log("[Staff Attendance] Records loaded:", records.length);
      } catch (error) {
        console.error(
          "[Staff Attendance] getStaffAttendanceForDate FAILED:",
          error,
        );

        throw error;
      }

      let stats: Awaited<ReturnType<typeof getStaffAttendanceStats>>;

      try {
        stats = await getStaffAttendanceStats(date);

        console.log("[Staff Attendance] Stats loaded successfully");
      } catch (error) {
        console.error(
          "[Staff Attendance] getStaffAttendanceStats FAILED:",
          error,
        );

        throw error;
      }

      return NextResponse.json({
        records,
        stats,
        date,
      });
    }

    // --------------------------------------------------
    // EDUCATOR PERSONAL ATTENDANCE
    // --------------------------------------------------

    console.log("[Staff Attendance] Loading personal attendance", {
      role: session.role,
      date,
    });

    const myRecord = await getStaffAttendanceForToday(session.id, date);

    const records = myRecord ? [myRecord] : [];

    return NextResponse.json({
      records,
      stats: calculateStats(records),
      date,
    });
  } catch (error) {
    console.error("Get staff attendance error:", error);

    return errorResponse("Unable to load staff attendance.", 500);
  }
}

// ======================================================
// POST STAFF ATTENDANCE ACTIONS
// ======================================================

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    if (!isStaffRole(session.role)) {
      return errorResponse("Forbidden", 403);
    }

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return errorResponse("Invalid request body.", 400);
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return errorResponse("Invalid JSON request.", 400);
    }

    const action = String(body.action || "");

    // ==================================================
    // LIST REGULARISATION REQUESTS
    // ==================================================

    if (action === "list-regularisations") {
      const suppliedStatus = body.status ? String(body.status) : undefined;

      const filterStatus =
        suppliedStatus === "pending" ||
        suppliedStatus === "approved" ||
        suppliedStatus === "rejected"
          ? suppliedStatus
          : undefined;

      const filterUserId =
        session.role === "admin" && body.userId
          ? String(body.userId)
          : session.role === "admin"
            ? undefined
            : session.id;

      const requests = await getRegularisationRequests({
        status: filterStatus,
        userId: filterUserId,
      });

      return NextResponse.json({
        requests,
      });
    }

    const date = String(body.date || todayInIndia());

    if (!isValidDate(date)) {
      return errorResponse("Invalid attendance date.", 400);
    }

    // ==================================================
    // SELF CHECK-IN
    // ==================================================

    if (action === "checkin") {
      if (date !== todayInIndia()) {
        return errorResponse("Check-in is only allowed for today.", 400);
      }

      const before = await getStaffAttendanceForToday(session.id, date);

      if (before?.checkIn) {
        return errorResponse("You have already checked in today.", 409);
      }

      await selfCheckIn(
        session.id,
        session.name,
        session.email,
        session.role,
        date,
      );

      const after = await getStaffAttendanceForToday(session.id, date);

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
          before,
          after,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Check-in recorded.",
        record: after,
      });
    }

    // ==================================================
    // SELF CHECK-OUT
    // ==================================================

    if (action === "checkout") {
      if (date !== todayInIndia()) {
        return errorResponse("Check-out is only allowed for today.", 400);
      }

      const before = await getStaffAttendanceForToday(session.id, date);

      if (!before?.checkIn) {
        return errorResponse("Check in first.", 400);
      }

      if (before.checkOut) {
        return errorResponse("You have already checked out today.", 409);
      }

      await selfCheckOut(session.id, date);

      const after = await getStaffAttendanceForToday(session.id, date);

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
          before,
          after,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Check-out recorded.",
        record: after,
      });
    }

    // ==================================================
    // MANUAL ATTENDANCE
    // ADMIN / STAFF / COUNSELLOR
    // ==================================================

    if (action === "bulk-mark") {
      if (!canManageAttendance(session.role)) {
        return errorResponse(
          "Only Admin, Staff and Counsellor can manage employee attendance.",
          403,
        );
      }

      if (
        !Array.isArray(body.records) ||
        body.records.length < 1 ||
        body.records.length > 200
      ) {
        return errorResponse(
          "Provide between 1 and 200 attendance records.",
          400,
        );
      }

      const submittedRecords = body.records as Array<Record<string, unknown>>;

      const seenUserIds = new Set<string>();

      const validatedRecords: Array<{
        userId: string;
        userName: string;
        userEmail: string;
        category: StaffCategory;
        employmentType: EmploymentType;
        status: StaffAttendanceStatus;
        checkIn?: string;
        checkOut?: string;
      }> = [];

      for (const submitted of submittedRecords) {
        if (
          !submitted ||
          typeof submitted !== "object" ||
          Array.isArray(submitted)
        ) {
          return errorResponse("Invalid employee attendance record.", 400);
        }

        const targetUserId = String(submitted.userId || "").trim();

        if (!targetUserId || seenUserIds.has(targetUserId)) {
          return errorResponse("Missing or duplicate employee ID.", 400);
        }

        seenUserIds.add(targetUserId);

        const user = await findUserById(targetUserId);

        if (!user || !isStaffRole(user.role)) {
          return errorResponse(`Invalid staff account: ${targetUserId}`, 400);
        }

        const status = String(submitted.status || "") as StaffAttendanceStatus;

        if (!VALID_STATUSES.includes(status)) {
          return errorResponse(
            `Invalid attendance status for ${user.name}.`,
            400,
          );
        }

        const checkIn =
          submitted.checkIn === undefined ||
          submitted.checkIn === null ||
          submitted.checkIn === ""
            ? undefined
            : String(submitted.checkIn);

        const checkOut =
          submitted.checkOut === undefined ||
          submitted.checkOut === null ||
          submitted.checkOut === ""
            ? undefined
            : String(submitted.checkOut);

        if (
          (checkIn && !isValidTime(checkIn)) ||
          (checkOut && !isValidTime(checkOut))
        ) {
          return errorResponse(
            `Invalid check-in/out time for ${user.name}. Use HH:MM.`,
            400,
          );
        }

        if (checkOut && !checkIn) {
          return errorResponse(
            `${user.name} cannot check out without checking in.`,
            400,
          );
        }

        if (checkIn && checkOut && checkOut < checkIn) {
          return errorResponse(
            `Check-out time must be after check-in time for ${user.name}.`,
            400,
          );
        }

        if (
          (status === "absent" ||
            status === "on_leave" ||
            status === "holiday") &&
          (checkIn || checkOut)
        ) {
          return errorResponse(
            `Remove working times or change attendance status for ${user.name}.`,
            400,
          );
        }

        const providedEmploymentType = String(
          submitted.employmentType || "full_time",
        ) as EmploymentType;

        const employmentType = VALID_EMPLOYMENT_TYPES.includes(
          providedEmploymentType,
        )
          ? providedEmploymentType
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

      const beforeRecords = await getStaffAttendanceForDate(date);

      const results = await bulkMarkStaffAttendance(
        validatedRecords,
        date,
        session.id,
      );

      await logAction({
        action: "update",
        category: "attendance",

        details:
          `Manual attendance saved by ${session.name} ` +
          `for ${results.length} employees on ${date}`,

        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,

        metadata: {
          action: "bulk-mark",
          date,
          markedById: session.id,
          markedByRole: session.role,
          recordCount: results.length,

          before: beforeRecords.filter((record) =>
            seenUserIds.has(record.userId),
          ),

          after: results,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Attendance saved for ${results.length} employees.`,
        records: results,
      });
    }

    // ==================================================
    // REGULARISATION REQUEST
    // ==================================================

    if (action === "regularise") {
      const reason = String(body.reason || "").trim();

      const requestedStatus = String(
        body.requestedStatus || "present",
      ) as StaffAttendanceStatus;

      if (!reason || reason.length > 1000) {
        return errorResponse(
          "A reason of up to 1000 characters is required.",
          400,
        );
      }

      if (!VALID_STATUSES.includes(requestedStatus)) {
        return errorResponse("Invalid requested status.", 400);
      }

      if (date > todayInIndia()) {
        return errorResponse(
          "Cannot regularise attendance for a future date.",
          400,
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
        return errorResponse("Invalid requested check-in/out time.", 400);
      }

      const regularisationRequest = await createRegularisationRequest({
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

        details: `Attendance regularisation requested by ${session.name}`,

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

    // ==================================================
    // REGULARISATION REVIEW - ADMIN ONLY
    // ==================================================

    if (action === "review") {
      if (session.role !== "admin") {
        return errorResponse(
          "Only Admin can review regularisation requests.",
          403,
        );
      }

      const requestId = String(body.requestId || "");

      const reviewStatus = String(body.reviewStatus || "");

      if (
        !requestId ||
        (reviewStatus !== "approved" && reviewStatus !== "rejected")
      ) {
        return errorResponse("Invalid request ID or review status.", 400);
      }

      const reviewComment = body.reviewComment
        ? String(body.reviewComment)
        : undefined;

      const reviewed = await reviewRegularisationRequest(
        requestId,
        session.id,
        reviewStatus,
        reviewComment,
      );

      if (!reviewed) {
        return errorResponse("Request not found.", 404);
      }

      await logAction({
        action: "update",
        category: "attendance",

        details:
          `Regularisation ${requestId} ` + `${reviewStatus} by ${session.name}`,

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

    return errorResponse("Invalid action.", 400);
  } catch (error) {
    console.error("Staff attendance action error:", error);

    return errorResponse("Unable to process staff attendance request.", 500);
  }
}
