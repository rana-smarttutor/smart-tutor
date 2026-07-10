import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getStaffAttendanceForUser } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.id;

    const records = await getStaffAttendanceForUser(userId, 30);

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get my staff attendance error:", error);
    return NextResponse.json(
      { error: "Unable to load attendance." },
      { status: 500 },
    );
  }
}
