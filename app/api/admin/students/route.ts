import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  getStudentStats,
  getStudentDirectoryV2,
  computeStudentRiskScores,
  exportStudentsCsv,
  updateUserRecord,
} from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

async function requireAdmin() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "stats") {
      const stats = await getStudentStats();
      return NextResponse.json({ ok: true, stats });
    }

    if (mode === "export") {
      const csv = await exportStudentsCsv();
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="students-export.csv"`,
        },
      });
    }

    if (mode === "risk-scores") {
      const results = await computeStudentRiskScores();
      return NextResponse.json({ ok: true, results });
    }

    const filters = {
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    };
    const students = await getStudentDirectoryV2(filters);
    return NextResponse.json({ ok: true, students });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    if (body.action === "update-status") {
      const updated = await updateUserRecord({
        id: body.userId,
        name: body.name ?? "",
        email: body.email ?? "",
        role: "student",
        password: body.password ?? "",
        program: body.program ?? "",
        status: body.status,
      });

      await logAction({
        action: "update",
        category: "students",
        details: `Student updated: ${body.name ?? "Unknown"}`,
        path: "/api/admin/students",
        method: "PATCH",
        request,
        session,
        metadata: { userId: body.userId, status: body.status },
      });

      return NextResponse.json({ ok: true, user: updated });
    }

    if (body.action === "reactivate") {
      const updated = await updateUserRecord({
        id: body.userId,
        name: body.name ?? "",
        email: body.email ?? "",
        role: "student",
        password: body.password ?? "",
        program: body.program ?? "",
        status: "active",
      });

      await logAction({
        action: "update",
        category: "students",
        details: `Student reactivated: ${body.name ?? "Unknown"}`,
        path: "/api/admin/students",
        method: "PATCH",
        request,
        session,
        metadata: { userId: body.userId, status: "active" },
      });

      return NextResponse.json({ ok: true, user: updated });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
