import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { createLeaveBalance, getLeaveBalancesForRole } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balances = await getLeaveBalancesForRole(session.role, session.id);
    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Get leave balances error:", error);
    return NextResponse.json(
      { error: "Unable to load leave balances." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const userId = String(body.user_id ?? body.userId ?? "").trim();
    const leaveTypeId = String(body.leave_type_id ?? body.leaveTypeId ?? "").trim();
    const daysAllowed = Number(body.days_allowed ?? body.daysAllowed) || 0;
    const note = String(body.note || "").trim();

    if (!userId || !leaveTypeId || !daysAllowed) {
      return NextResponse.json(
        { error: "User, leave type, and days allowed are required." },
        { status: 400 },
      );
    }

    const balance = await createLeaveBalance({
      userId,
      userName: String(body.userName || ""),
      leaveTypeId,
      leaveTypeName: String(body.leaveTypeName || ""),
      daysAllowed,
      note: note || undefined,
    });

    await logAction({
      action: "create",
      category: "leave",
      details: `Leave balance created for user ${userId} (${body.leaveTypeName}, ${daysAllowed} days)`,
      path: "/api/leave/balances",
      method: "POST",
      request,
      session,
      metadata: { userId, leaveTypeId, daysAllowed },
    });

    return NextResponse.json({ balance }, { status: 201 });
  } catch (error) {
    console.error("Create leave balance error:", error);
    return NextResponse.json(
      { error: "Unable to create leave balance." },
      { status: 500 },
    );
  }
}
