import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createLeaveRequest,
  getLeaveRequestsForRole,
  getLeaveTypes,
  getHolidays,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await getLeaveRequestsForRole(session.role, session.id);
    const leaveTypes = await getLeaveTypes();
    const holidays = await getHolidays();

    return NextResponse.json({ requests, leaveTypes, holidays });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const leaveTypeId = String(body.leaveTypeId || "");
    const leaveTypeName = String(body.leaveTypeName || "");
    const fromDate = String(body.fromDate || "");
    const toDate = String(body.toDate || "");
    const reason = String(body.reason || "").trim();
    const days = Number(body.days) || 0;

    if (!leaveTypeId || !fromDate || !toDate || !reason || !days) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
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
      documentUrl: String(body.documentUrl || ""),
    });

    return NextResponse.json({ leaveRequest }, { status: 201 });
  } catch (error) {
    console.error("Apply leave error:", error);
    return NextResponse.json(
      { error: "Unable to submit leave request." },
      { status: 500 },
    );
  }
}
