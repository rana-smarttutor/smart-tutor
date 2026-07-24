import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getAvailableMentorshipFaculty } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "student" && session.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Only students and admins can view available mentorship faculty.",
        },
        { status: 403 },
      );
    }

    const faculty = await getAvailableMentorshipFaculty();

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error(
      "Get available mentorship faculty error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load available mentorship faculty.",
      },
      { status: 500 },
    );
  }
}