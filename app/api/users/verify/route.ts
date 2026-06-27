import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { toggleUserVerification } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admin can change verification status." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
      verified?: boolean;
    };

    if (!body.userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    const updated = await toggleUserVerification(
      body.userId,
      body.verified === true,
    );

    if (!updated) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: body.verified
        ? "User verified successfully."
        : "User verification removed.",
    });
  } catch (error) {
    console.error("Toggle verification error:", error);

    return NextResponse.json(
      { error: "Unable to update verification status." },
      { status: 500 },
    );
  }
}
