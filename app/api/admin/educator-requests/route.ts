import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { getPendingEducatorRequests } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admin can view faculty requests." },
      { status: 403 },
    );
  }

  try {
    const requests = await getPendingEducatorRequests();

    return NextResponse.json({
      ok: true,
      requests,
    });
  } catch (error) {
    console.error("Pending educator requests error:", error);

    return NextResponse.json(
      { error: "Unable to load faculty requests." },
      { status: 500 },
    );
  }
}