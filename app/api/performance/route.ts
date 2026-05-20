import { NextResponse } from "next/server";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { 
  createPerformanceReport, 
  getPerformanceReports, 
  getPerformanceHeuristics, 
  savePerformanceHeuristics,
  createMessage
} from "@/lib/data-store";
import type { PerformanceHeuristics, PerformanceReport } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || undefined;
  const batchName = searchParams.get("batchName") || undefined;
  const educatorId = searchParams.get("educatorId") || undefined;

  // If requesting heuristics
  if (educatorId) {
    const heuristics = await getPerformanceHeuristics(educatorId);
    return NextResponse.json({ heuristics });
  }

  // If requesting reports
  // Students can only see their own reports
  const filter: any = {};
  if (session.role === "student") {
    filter.studentId = session.id;
  } else {
    if (studentId) filter.studentId = studentId;
    if (batchName) filter.batchName = batchName;
  }

  const reports = await getPerformanceReports(filter);
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const report = await createPerformanceReport({
      ...body,
      createdBy: session.id,
    });

    // Notify the student
    await createMessage({
      title: "New Performance Report Published",
      body: `A new ${report.reportType} performance report for the period ${report.period} has been published by your mentor.`,
      channel: "Academic Analytics",
      author: session.name,
      audience: ["student"],
      userIds: [report.studentId],
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { heuristics } = body as { heuristics: PerformanceHeuristics };
    
    if (!heuristics) {
      return NextResponse.json({ error: "Heuristics data required" }, { status: 400 });
    }

    const saved = await savePerformanceHeuristics(session.id, heuristics);
    return NextResponse.json({ heuristics: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
