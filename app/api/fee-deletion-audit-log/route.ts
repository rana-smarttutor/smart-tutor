import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getFeeTransactionLogs, getFeeTransactionLogStats } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const transactionType = searchParams.get("transactionType") || undefined;
  const search = searchParams.get("search") || undefined;
  const performedBy = searchParams.get("performedBy") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const paymentMode = searchParams.get("paymentMode") || undefined;

  const [logs, stats] = await Promise.all([
    getFeeTransactionLogs({ transactionType, search, performedBy, dateFrom, dateTo, paymentMode }),
    getFeeTransactionLogStats(),
  ]);

  return NextResponse.json({ ok: true, logs, stats });
}
