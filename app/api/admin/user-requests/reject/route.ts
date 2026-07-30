import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { rejectUserRequest } from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admin can reject accounts." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
    };

    if (!body.userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    const deleted = await rejectUserRequest(body.userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "User request not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "reject",
      category: "users",
      details: `User rejected: ${body.userId}`,
      path: "/api/admin/user-requests/reject",
      method: "POST",
      request,
      session,
      metadata: { userId: body.userId },
    });

    return NextResponse.json({
      ok: true,
      message: "Account rejected and deleted.",
    });
  } catch (error) {
    console.error("Reject user request error:", error);

    return NextResponse.json(
      { error: "Unable to reject account." },
      { status: 500 },
    );
  }
}
