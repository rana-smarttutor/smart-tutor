import { NextResponse } from "next/server";
import { getStudentDirectory } from "@/lib/data-store";

export async function GET() {
  try {
    const students = await getStudentDirectory();

    return NextResponse.json({
      success: true,
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        program: student.program,
      })),
    });
  } catch (error) {
    console.error("Fetch registered students error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load registered students.",
      },
      { status: 500 },
    );
  }
}