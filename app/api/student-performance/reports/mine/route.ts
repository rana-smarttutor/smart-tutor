import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  if (session.role !== "student") {
    return NextResponse.json(
      { success: false, message: "Only students can access this route." },
      { status: 403 },
    );
  }

  try {
    const db = await getMongoDatabase();

    const reports = await db
      .collection("performanceReports")
      .find({
        linkedStudentId: session.id,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      reports: reports.map((report) => ({
        id: report._id.toString(),
        title: report.title || report.periodLabel || report.period || "",
        period: report.period || "",
        periodLabel: report.periodLabel || report.period || "",
        reportType: report.reportType || "weekly",
        createdAt:
          report.createdAt instanceof Date
            ? report.createdAt.toISOString()
            : report.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("Fetch student performance reports error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch performance reports.",
      },
      { status: 500 },
    );
  }
}