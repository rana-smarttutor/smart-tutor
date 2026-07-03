import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getAccessibleStudentPerformanceReport } from "@/lib/student-performance-report-access";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const { reportId } = await context.params;

    const result = await getAccessibleStudentPerformanceReport(
      reportId,
      session,
    );

    if (result.status === "invalid") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 },
      );
    }

    if (result.status !== "ok") {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found or unavailable for this account.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      report: result.report,
    });
  } catch (error) {
    console.error("Report fetch API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report.",
      },
      { status: 500 },
    );
  }
}