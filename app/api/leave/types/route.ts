import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { createLeaveType, getLeaveTypes } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leaveTypes = await getLeaveTypes();
    return NextResponse.json({ leaveTypes });
  } catch (error) {
    console.error("Get leave types error:", error);
    return NextResponse.json(
      { error: "Unable to load leave types." },
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
    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const daysAllowed = Number(body.days_allowed ?? body.daysAllowed) || 0;
    const isPaid = body.is_paid === true || body.is_paid === "1" || body.isPaid === true;
    const color = String(body.color || "#4F46E5");

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required." },
        { status: 400 },
      );
    }

    const leaveType = await createLeaveType({
      name,
      category,
      daysAllowed,
      isPaid,
      color,
    });

    await logAction({
      action: "create",
      category: "leave",
      details: `Leave type "${name}" created (${category}, ${daysAllowed} days)`,
      path: "/api/leave/types",
      method: "POST",
      request,
      session,
      metadata: { name, category, daysAllowed, isPaid },
    });

    return NextResponse.json({ leaveType }, { status: 201 });
  } catch (error) {
    console.error("Create leave type error:", error);
    return NextResponse.json(
      { error: "Unable to create leave type." },
      { status: 500 },
    );
  }
}
