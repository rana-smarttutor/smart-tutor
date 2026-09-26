import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getStaffAttendanceForUser } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const allowedRoles = [
      "admin",
      "educator",
      "staff",
      "counsellor",
    ];

    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedUserId =
      searchParams.get("userId") || session.id;

    if (
      session.role !== "admin" &&
      requestedUserId !== session.id
    ) {
      return NextResponse.json(
        {
          error:
            "You can only view your own attendance history.",
        },
        { status: 403 },
      );
    }

    const records = await getStaffAttendanceForUser(
      requestedUserId,
      30,
    );

    return NextResponse.json({ records });

  } catch (error) {
    console.error(
      "Get my staff attendance error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load attendance." },
      { status: 500 },
    );
  }
}
