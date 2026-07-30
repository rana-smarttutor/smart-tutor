import { NextResponse } from "next/server";

import type { SessionUser, StaffPayout } from "@/lib/types";
import {
  updateStaffPayout,
  deleteStaffPayout,
  appendStaffPayoutAuditLog,
  createNotifications,
  getStaffPayoutAuditLogsByPayout,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { payoutId } = await params;
    const body = await request.json();

    // Fetch existing for audit diff
    const existingLogs = await getStaffPayoutAuditLogsByPayout(payoutId);
    const receiptNo = existingLogs.length > 0 ? existingLogs[0].receiptNo : "N/A";
    const staffId = existingLogs.length > 0 ? existingLogs[0].staffId : "";
    const staffName = existingLogs.length > 0 ? existingLogs[0].staffName : "";

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.particulars !== undefined) updateData.particulars = body.particulars;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.month !== undefined) updateData.month = body.month;
    if (body.paymentMode !== undefined) updateData.paymentMode = body.paymentMode;
    if (body.transactionId !== undefined) updateData.transactionId = body.transactionId;
    if (body.paidDate !== undefined) updateData.paidDate = body.paidDate;

    const updated = await updateStaffPayout(payoutId, updateData as any);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Payout record not found." }, { status: 404 });
    }

    // Determine if this was a payment recording
    const isPaymentRecorded = body.paymentMode && body.paidDate && updated.status === "paid";

    // Unified transaction log
    const { ipAddress, userAgent } = getRequestMetadata(request);
    const payoutTxType = isPaymentRecorded ? "payout_payment_recorded" : "payout_updated";
    appendFeeTransactionLog({
      transactionType: payoutTxType,
      performedBy: session.id,
      performedByName: session.name,
      performedByEmail: session.email ?? "",
      ipAddress,
      userAgent,
      amount: updated.amount,
      payoutId,
      receiptNo,
      staffId,
      staffName,
      month: updated.month,
      payoutTitle: updated.title,
      paymentMode: body.paymentMode || undefined,
      paymentDate: body.paidDate || undefined,
    }).catch(() => {});

    await logAction({
      action: "update",
      category: "payout",
      details: `Updated payout ${payoutId} - payment recorded`,
      path: "/api/staff-payouts/" + payoutId,
      method: "PATCH",
      request,
      session,
      metadata: { payoutId, amount: updated.amount },
    });

    // Audit log
    await appendStaffPayoutAuditLog({
      payoutId,
      receiptNo,
      staffId,
      staffName,
      action: isPaymentRecorded ? "payment_recorded" : "updated",
      title: updated.title,
      month: updated.month,
      amount: updated.amount,
      paidAmount: updated.paidAmount,
      paymentMode: body.paymentMode || undefined,
      transactionId: body.transactionId || undefined,
      paidDate: body.paidDate || undefined,
      changes: Object.keys(updateData).length > 0
        ? Object.fromEntries(
            Object.entries(updateData).map(([k, v]) => [k, { from: null, to: v }])
          )
        : undefined,
      performedBy: session.id,
      performedByName: session.name,
    });

    // Notification on payment recording
    if (isPaymentRecorded) {
      const monthDisplay = updated.month;
      await createNotifications({
        userIds: [staffId],
        title: "Payment Recorded",
        message: `A payment of ₹${(Number(body.amount) || updated.amount).toLocaleString("en-IN")} for ${updated.title.toLowerCase()} (${monthDisplay}) has been recorded. Receipt: ${receiptNo}`,
        type: "payment",
      }).catch(() => { /* non-blocking */ });
    }

    return NextResponse.json({ ok: true, payout: updated });
  } catch (error) {
    console.error("Staff payout PATCH error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update staff payout." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { payoutId } = await params;

    // Fetch existing for audit before deleting
    const existingLogs = await getStaffPayoutAuditLogsByPayout(payoutId);
    const receiptNo = existingLogs.length > 0 ? existingLogs[0].receiptNo : "N/A";
    const staffId = existingLogs.length > 0 ? existingLogs[0].staffId : "";
    const staffName = existingLogs.length > 0 ? existingLogs[0].staffName : "";
    const lastAmount = existingLogs.length > 0 ? existingLogs[0].amount : undefined;
    const lastMonth = existingLogs.length > 0 ? existingLogs[0].month : undefined;
    const lastTitle = existingLogs.length > 0 ? existingLogs[0].title : undefined;

    const { ipAddress, userAgent } = getRequestMetadata(request);
    await deleteStaffPayout(payoutId);

    // Unified transaction log
    appendFeeTransactionLog({
      transactionType: "payout_deleted",
      performedBy: session.id,
      performedByName: session.name,
      performedByEmail: session.email ?? "",
      ipAddress,
      userAgent,
      amount: lastAmount || 0,
      payoutId,
      receiptNo,
      staffId,
      staffName,
      month: lastMonth,
      payoutTitle: lastTitle,
    }).catch(() => {});

    await logAction({
      action: "delete",
      category: "payout",
      details: `Deleted payout ${payoutId}`,
      path: "/api/staff-payouts/" + payoutId,
      method: "DELETE",
      request,
      session,
      metadata: { payoutId },
    });

    // Audit log for deletion (append-only, this entry survives the payout deletion)
    await appendStaffPayoutAuditLog({
      payoutId,
      receiptNo,
      staffId,
      staffName,
      action: "deleted",
      title: lastTitle,
      month: lastMonth,
      amount: lastAmount,
      performedBy: session.id,
      performedByName: session.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Staff payout DELETE error:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete staff payout." }, { status: 500 });
  }
}
