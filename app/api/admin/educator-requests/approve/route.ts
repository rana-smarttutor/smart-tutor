import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { approveEducatorRequest } from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admin can approve faculty accounts." },
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

    const user = await approveEducatorRequest(body.userId);

    if (!user) {
      return NextResponse.json(
        { error: "Faculty request not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "approve",
      category: "users",
      details: `Educator approved: ${user.email}`,
      path: "/api/admin/educator-requests/approve",
      method: "POST",
      request,
      session,
      metadata: { userId: user.id, email: user.email },
    });

    return NextResponse.json({
      ok: true,
      message: "Faculty account approved successfully.",
      user,
    });
  } catch (error) {
    console.error("Approve educator request error:", error);

    return NextResponse.json(
      { error: "Unable to approve faculty account." },
      { status: 500 },
    );
  }
}