import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { getEducatorRewardDashboard } from "@/lib/reward-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Login required.",
      },
      {
        status: 401,
      },
    );
  }

  if (!hasAnyRole(session, ["educator"])) {
    return NextResponse.json(
      {
        success: false,
        error: "Only educators can access their rewards.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const dashboard = await getEducatorRewardDashboard(
      session.id,
      session.name,
      session.email,
    );

    return NextResponse.json(
      {
        success: true,
        dashboard,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Load educator rewards error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load educator rewards.",
      },
      {
        status: 500,
      },
    );
  }
}