import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { deleteLeaveType, updateLeaveType } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    if (body.name) update.name = String(body.name).trim();
    if (body.category) update.category = String(body.category).trim();
    if (body.days_allowed || body.daysAllowed) {
      update.daysAllowed = Number(body.days_allowed ?? body.daysAllowed);
    }
    if (body.is_paid !== undefined) {
      update.isPaid = body.is_paid === true || body.is_paid === "1";
    }
    if (body.isPaid !== undefined) {
      update.isPaid = body.isPaid === true || body.isPaid === "1";
    }
    if (body.is_active !== undefined) {
      update.isActive = body.is_active === true || body.is_active === "1";
    }
    if (body.isActive !== undefined) {
      update.isActive = body.isActive === true || body.isActive === "1";
    }
    if (body.color) update.color = String(body.color);

    const updated = await updateLeaveType(id, update);
    if (!updated) {
      return NextResponse.json(
        { error: "Leave type not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ leaveType: updated });
  } catch (error) {
    console.error("Update leave type error:", error);
    return NextResponse.json(
      { error: "Unable to update leave type." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await deleteLeaveType(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Leave type not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete leave type error:", error);
    return NextResponse.json(
      { error: "Unable to delete leave type." },
      { status: 500 },
    );
  }
}
