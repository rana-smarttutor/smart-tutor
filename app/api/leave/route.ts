
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";

import {
  createLeaveRequest,
  getLeaveRequestsForRole,
  getLeaveTypes,
  getHolidays,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAVE_TOO_LATE_MESSAGE =
  "You cannot apply for leave on the same day or for a past date. Leave applications must be submitted at least one calendar day in advance. If you need urgent leave, please contact the SmartIQ Institute Support Team.";

function getTodayIST(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function calculateLeaveDays(
  fromDate: string,
  toDate: string,
): number {
  const start = Date.parse(`${fromDate}T00:00:00.000Z`);
  const end = Date.parse(`${toDate}T00:00:00.000Z`);

  return Math.floor((end - start) / 86400000) + 1;
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const requests = await getLeaveRequestsForRole(
      session.role,
      session.id,
    );

    const leaveTypes = await getLeaveTypes();
    const holidays = await getHolidays();

    return NextResponse.json({
      requests,
      leaveTypes,
      holidays,
    });
  } catch (error) {
    console.error("Get leaves error:", error);

    return NextResponse.json(
      { error: "Unable to load leave data." },
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

    const rawBody: unknown = await request.json();

    if (
      !rawBody ||
      typeof rawBody !== "object" ||
      Array.isArray(rawBody)
    ) {
      return NextResponse.json(
        { error: "Invalid leave application." },
        { status: 400 },
      );
    }

    const body = rawBody as Record<string, unknown>;

    const leaveTypeId = String(
      body.leaveTypeId ?? "",
    ).trim();

    const leaveTypeName = String(
      body.leaveTypeName ?? "",
    ).trim();

    const fromDate = String(
      body.fromDate ?? "",
    ).trim();

    const toDate = String(
      body.toDate ?? "",
    ).trim();

    const reason = String(
      body.reason ?? "",
    ).trim();

    if (
      !leaveTypeId ||
      !leaveTypeName ||
      !fromDate ||
      !toDate ||
      !reason
    ) {
      return NextResponse.json(
        {
          error: "All required fields must be provided.",
        },
        { status: 400 },
      );
    }

    // Validate calendar dates before processing.
    if (
      !isValidDate(fromDate) ||
      !isValidDate(toDate)
    ) {
      return NextResponse.json(
        {
          error: "Please provide valid leave dates.",
        },
        { status: 400 },
      );
    }

    if (toDate < fromDate) {
      return NextResponse.json(
        {
          error:
            "Leave end date cannot be before the start date.",
        },
        { status: 400 },
      );
    }

    // SmartIQ leave policy:
    // Leave must start at least one calendar day
    // after the current date in India.
    const todayIST = getTodayIST();

    if (fromDate <= todayIST) {
      return NextResponse.json(
        {
          code: "LEAVE_TOO_LATE",
          error: LEAVE_TOO_LATE_MESSAGE,
          status: "rejected",
          reason: "Same-day or past-date application",
        },
        { status: 422 },
      );
    }

    // Calculate on the server rather than trusting
    // the number of days sent from the browser.
    const days = calculateLeaveDays(
      fromDate,
      toDate,
    );

    if (
      !Number.isFinite(days) ||
      days < 1
    ) {
      return NextResponse.json(
        {
          error: "Invalid leave duration.",
        },
        { status: 400 },
      );
    }

    const leaveRequest = await createLeaveRequest({
      userId: session.id,
      userName: session.name,
      userRole: session.role,
      leaveTypeId,
      leaveTypeName,
      fromDate,
      toDate,
      days,
      reason,
      documentUrl: String(
        body.documentUrl ?? "",
      ),
    });

    await logAction({
      action: "create",
      category: "leave",
      details:
        `Leave request created by ${session.name} ` +
        `(${leaveTypeName}, ${fromDate} - ${toDate})`,
      path: "/api/leave",
      method: "POST",
      request,
      session,
      metadata: {
        leaveTypeId,
        leaveTypeName,
        fromDate,
        toDate,
        days,
      },
    });

    return NextResponse.json(
      {
        leaveRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Apply leave error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to submit leave request." },
      { status: 500 },
    );
  }
}
