import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getFeeDeletionAuditLogs, getFeeDeletionAuditLogStats } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentSearch = searchParams.get("studentSearch") || undefined;
  const deletedBy = searchParams.get("deletedBy") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const paymentMode = searchParams.get("paymentMode") || undefined;

  const [logs, stats] = await Promise.all([
    getFeeDeletionAuditLogs({ studentSearch, deletedBy, dateFrom, dateTo, paymentMode }),
    getFeeDeletionAuditLogStats(),
  ]);

  return NextResponse.json({ ok: true, logs, stats });
}
