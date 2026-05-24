import { NextResponse } from "next/server";
import { getMongoDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const db = await getMongoDatabase();

    const report = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("performanceReports").insertOne(report);

    return NextResponse.json({
      success: true,
      message: "Performance report created successfully.",
      reportId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Create performance report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create performance report.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getMongoDatabase();

    const reports = await db
      .collection("performanceReports")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      reports: reports.map((report) => ({
        ...report,
        _id: report._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Fetch performance reports error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch performance reports.",
      },
      { status: 500 }
    );
  }
}