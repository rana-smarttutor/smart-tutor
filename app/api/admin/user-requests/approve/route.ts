import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { approveUserRequest } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admin can approve accounts." },
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

    const user = await approveUserRequest(body.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Account approved successfully.",
      user,
    });
  } catch (error) {
    console.error("Approve user request error:", error);

    return NextResponse.json(
      { error: "Unable to approve account." },
      { status: 500 },
    );
  }
}
