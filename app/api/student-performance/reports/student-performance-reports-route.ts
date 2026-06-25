import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// import { getStudentDirectory } from "@/lib/data-store";
import { getMongoDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const periodLabel =
      typeof body.period === "string" ? body.period.trim() : "";

    if (!periodLabel) {
      return NextResponse.json(
        {
          success: false,
          message: "Report period is required.",
        },
        { status: 400 },
      );
    }

    const requestedStudentId =
      typeof body.linkedStudentId === "string" &&
      body.linkedStudentId.trim()
        ? body.linkedStudentId.trim()
        : null;

    let linkedStudentId: string | null = null;
    let studentSnapshot = body.student || {};

    if (requestedStudentId) {
      // const registeredStudents = await getStudentDirectory();
      //
      // const registeredStudent = registeredStudents.find(
      //   (student) =>
      //     student.id === requestedStudentId && student.status === "active",
      // );
      //
      // if (!registeredStudent) {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       message: "Selected student account was not found.",
      //     },
      //     { status: 400 },
      //   );
      // }
      //
      // linkedStudentId = registeredStudent.id;
      //
      // studentSnapshot = {
      //   ...studentSnapshot,
      //   name: registeredStudent.name,
      //   course: studentSnapshot.course || registeredStudent.program,
      // };
      linkedStudentId = requestedStudentId;
    }

    const db = await getMongoDatabase();

    const report = {
      ...body,
      title: periodLabel,
      period: periodLabel,
      periodLabel,
      linkedStudentId,
      student: studentSnapshot,
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
      { status: 500 },
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
        id: report._id.toString(),
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
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID is required.",
        },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(reportId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 },
      );
    }

    const db = await getMongoDatabase();

    const result = await db.collection("performanceReports").deleteOne({
      _id: new ObjectId(reportId),
    });

    if (!result.deletedCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Report was not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete performance report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete performance report.",
      },
      { status: 500 },
    );
  }
}