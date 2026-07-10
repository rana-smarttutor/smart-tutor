import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { updateLeaveRequestStatus } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = String(body.status || "");

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'." },
        { status: 400 },
      );
    }

    const updated = await updateLeaveRequestStatus(id, {
      status: status as "approved" | "rejected",
      rejectReason: status === "rejected" ? String(body.rejectReason || "") : undefined,
      approvedBy: status === "approved" ? session.name : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ leaveRequest: updated });
  } catch (error) {
    console.error("Update leave status error:", error);
    return NextResponse.json(
      { error: "Unable to update leave request." },
      { status: 500 },
    );
  }
}
