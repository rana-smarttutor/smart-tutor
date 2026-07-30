import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { bulkUpdateStudentsFromCsv } from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json({ ok: false, error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/^"|"$/g, "").trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });
      rows.push(row);
    }

    const result = await bulkUpdateStudentsFromCsv(rows);

    await logAction({
      action: "bulk_operation",
      category: "students",
      details: `Bulk update completed: ${result?.updated ?? 0} updated, ${result?.skipped ?? 0} skipped`,
      path: "/api/admin/students/bulk-update",
      method: "POST",
      request,
      session,
      metadata: { rowCount: rows.length, result },
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
