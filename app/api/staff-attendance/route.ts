import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  bulkMarkStaffAttendance,
  createRegularisationRequest,
  getRegularisationRequests,
  getStaffAttendanceForDate,
  getStaffAttendanceForDateRange,
  getStaffAttendanceStats,
  reviewRegularisationRequest,
  selfCheckIn,
  selfCheckOut,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId") || undefined;

    if (startDate && endDate) {
      const records = await getStaffAttendanceForDateRange(startDate, endDate, userId);
      return NextResponse.json({ records, startDate, endDate });
    }

    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const records = await getStaffAttendanceForDate(date);
    const stats = await getStaffAttendanceStats(date);

    return NextResponse.json({ records, stats, date });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");
    const date = String(body.date || new Date().toISOString().slice(0, 10));

    if (action === "checkin") {
      await selfCheckIn(session.id, session.name, session.email, session.role, date);
      await logAction({
        action: "create",
        category: "attendance",
        details: `Staff check-in recorded for ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: { date, action: "checkin" },
      });
      return NextResponse.json({ success: true, message: "Check-in recorded." });
    }

    if (action === "checkout") {
      const result = await selfCheckOut(session.id, date);
      if (!result) {
        return NextResponse.json(
          { error: "No check-in found for today. Check in first." },
          { status: 400 },
        );
      }
      await logAction({
        action: "create",
        category: "attendance",
        details: `Staff check-out recorded for ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: { date, action: "checkout" },
      });
      return NextResponse.json({ success: true, message: "Check-out recorded." });
    }

    if (action === "bulk-mark" && session.role === "admin") {
      const records = (body.records || []) as any[];
      const markedBy = session.id;
      const results = await bulkMarkStaffAttendance(records, date, markedBy);
      await logAction({
        action: "create",
        category: "attendance",
        details: `Bulk staff attendance marked for ${records.length} records on ${date}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: { date, recordCount: records.length, action: "bulk-mark" },
      });
      return NextResponse.json({ success: true, records: results });
    }

    if (action === "regularise") {
      const reason = String(body.reason || "");
      const requestedCheckIn = body.requestedCheckIn ? String(body.requestedCheckIn) : undefined;
      const requestedCheckOut = body.requestedCheckOut ? String(body.requestedCheckOut) : undefined;
      const requestedStatus = String(body.requestedStatus || "present");

      if (!reason) {
        return NextResponse.json({ error: "Reason is required." }, { status: 400 });
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
        details: `Staff attendance regularisation requested by ${session.name} for ${date}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: { date, reason, requestedStatus, action: "regularise" },
      });
      return NextResponse.json({ success: true, request: regularisationRequest });
    }

    if (action === "review" && session.role === "admin") {
      const requestId = String(body.requestId || "");
      const reviewStatus = String(body.reviewStatus || "") as "approved" | "rejected";
      const reviewComment = body.reviewComment ? String(body.reviewComment) : undefined;

      if (!requestId || !reviewStatus) {
        return NextResponse.json({ error: "Request ID and status are required." }, { status: 400 });
      }

      const reviewResult = await reviewRegularisationRequest(requestId, session.id, reviewStatus, reviewComment);
      if (!reviewResult) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      }
      await logAction({
        action: "update",
        category: "attendance",
        details: `Staff attendance regularisation request ${requestId} ${reviewStatus} by ${session.name}`,
        path: "/api/staff-attendance",
        method: "POST",
        request,
        session,
        metadata: { requestId, reviewStatus, reviewComment, action: "review" },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "list-regularisations") {
      const filterStatus = body.status ? String(body.status) as "pending" | "approved" | "rejected" : undefined;
      const filterUserId = body.userId ? String(body.userId) : undefined;
      const requests = await getRegularisationRequests({ status: filterStatus, userId: filterUserId });
      return NextResponse.json({ requests });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Staff attendance action error:", error);
    return NextResponse.json(
      { error: "Unable to process request." },
      { status: 500 },
    );
  }
}
