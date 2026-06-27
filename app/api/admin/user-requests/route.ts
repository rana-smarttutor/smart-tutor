import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { getPendingUserRequests } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admin can view pending requests." },
      { status: 403 },
    );
  }

  try {
    const requests = await getPendingUserRequests();

    return NextResponse.json({
      ok: true,
      requests,
    });
  } catch (error) {
    console.error("Pending user requests error:", error);

    return NextResponse.json(
      { error: "Unable to load pending requests." },
      { status: 500 },
    );
  }
}
