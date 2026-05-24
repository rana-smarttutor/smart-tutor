import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getMongoDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { reportId } = await context.params;

    if (!ObjectId.isValid(reportId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 }
      );
    }

    const db = await getMongoDatabase();

    const report = await db.collection("performanceReports").findOne({
      _id: new ObjectId(reportId),
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        _id: report._id.toString(),
      },
    });
  } catch (error) {
    console.error("Report fetch API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report.",
      },
      { status: 500 }
    );
  }
}