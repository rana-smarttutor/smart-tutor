import { NextResponse } from "next/server";

import type { SessionUser } from "@/lib/types";
import {
  getStaffPayoutsForRole,
  createStaffPayout,
  appendStaffPayoutAuditLog,
  createNotifications,
  appendFeeTransactionLog,
  getRequestMetadata,
} from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";

type SessionPayload = {
  user?: SessionUser;
  session?: SessionUser;
  data?: { user?: SessionUser };
};

function readSession(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as SessionPayload;
  const candidate = data.user ?? data.session ?? data.data?.user ?? payload;
  if (!candidate || typeof candidate !== "object") return null;
  const user = candidate as Partial<SessionUser>;
  if (
    typeof user.id !== "string" || !user.id ||
    (user.role !== "admin" && user.role !== "educator" && user.role !== "student" && user.role !== "parent")
  ) return null;
  return user as SessionUser;
}

async function getRequestSession(request: Request) {
  const response = await fetch(new URL("/api/auth/session", request.url), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return readSession(payload);
}

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const payouts = await getStaffPayoutsForRole(session.role, session.id);
    return NextResponse.json({ ok: true, payouts });
  } catch (error) {
    console.error("Staff payouts GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load staff payouts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { staffId, staffName, month, title, particulars, amount, paymentMode, transactionId, paidDate } = body;

    if (!staffId || !staffName || !month || !title || !amount) {
      return NextResponse.json({ ok: false, error: "Staff, month, title, and amount are required." }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be a positive number." }, { status: 400 });
    }

    const payout = await createStaffPayout({
      staffId,
      staffName,
      month,
      title,
      particulars: particulars || "",
      amount: numAmount,
      paymentMode: paymentMode || undefined,
      transactionId: transactionId || undefined,
      paidDate: paidDate || undefined,
      createdBy: session.id,
    });

    // Unified transaction log
    const receiptNo = (payout as any).receiptNo || "N/A";
    const { ipAddress, userAgent } = getRequestMetadata(request);
    const payoutTxType = paymentMode && paidDate ? "payout_payment_recorded" : "payout_created";
    appendFeeTransactionLog({
      transactionType: payoutTxType,
      performedBy: session.id,
      performedByName: session.name,
      performedByEmail: session.email ?? "",
      ipAddress,
      userAgent,
      amount: numAmount,
      payoutId: payout.id,
      receiptNo,
      staffId,
      staffName,
      month,
      payoutTitle: title,
      particulars: particulars || "",
      paymentMode: paymentMode || undefined,
      paymentDate: paidDate || undefined,
    }).catch(() => {});

    logAction({
      action: "create",
      category: "payout",
      details: `Created payout ${title} for ${staffName} (₹${numAmount})`,
      path: "/api/staff-payouts",
      method: "POST",
      request,
      session,
      metadata: { payoutId: payout.id, staffId, staffName, amount: numAmount, month },
    });

    // Audit log
    await appendStaffPayoutAuditLog({
      payoutId: payout.id,
      receiptNo,
      staffId,
      staffName,
      action: paymentMode && paidDate ? "payment_recorded" : "created",
      title,
      month,
      amount: numAmount,
      paidAmount: paymentMode && paidDate ? numAmount : 0,
      paymentMode: paymentMode || undefined,
      transactionId: transactionId || undefined,
      paidDate: paidDate || undefined,
      performedBy: session.id,
      performedByName: session.name,
    });

    // Notification to faculty
    const monthDisplay = month;
    const statusLabel = paymentMode && paidDate ? "paid" : "recorded";
    await createNotifications({
      userIds: [staffId],
      title: `Payout ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`,
      message: `Your ${title.toLowerCase()} for ${monthDisplay} (₹${numAmount.toLocaleString("en-IN")}) has been ${statusLabel}. Receipt: ${receiptNo}`,
      type: "payment",
    }).catch(() => { /* notification failure is non-blocking */ });

    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    console.error("Staff payouts POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create staff payout." }, { status: 500 });
  }
}
