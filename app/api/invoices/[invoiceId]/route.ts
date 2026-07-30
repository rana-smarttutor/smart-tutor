import { NextResponse } from "next/server";

import {
  deleteFeeInvoice,
  updateFeeInvoice,
  getFeeInvoiceById,
  appendFeeTransactionLog,
  getRequestMetadata,
} from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import type { PaymentTransaction } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

if (session.role !== "admin") {
  return NextResponse.json(
    { error: "Only admin can update fee invoices." },
    { status: 403 },
  );
}

  const { invoiceId } = await context.params;
  const body = await request.json();

  let transaction: PaymentTransaction | undefined;

  if (body.transaction) {
    const t = body.transaction;
    transaction = {
      paidAmount: Number(t.paidAmount) || 0,
      paidDate: t.paidDate || new Date().toISOString().slice(0, 10),
      paymentMode: t.paymentMode || "Cash",
      transactionId: t.transactionId?.trim() || undefined,
      chequeNumber: t.chequeNumber?.trim() || undefined,
      bankName: t.bankName?.trim() || undefined,
      accountLast4: t.accountLast4?.trim() || undefined,
      notes: t.notes?.trim() || undefined,
      recordedBy: session.id,
      recordedAt: new Date().toISOString(),
    };
  }

  const feeInvoice = await updateFeeInvoice(invoiceId, {
    title: body.title,
    amount: body.amount === undefined ? undefined : Number(body.amount),
    paidAmount:
      body.paidAmount === undefined ? undefined : Number(body.paidAmount),
    dueDate: body.dueDate,
    status: body.status,
    notes: body.notes,
    paymentMode: body.paymentMode,
    transaction,
  });

  if (!feeInvoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ feeInvoice });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

 if (session.role !== "admin") {
  return NextResponse.json(
    { error: "Only admin can delete fee invoices." },
    { status: 403 },
  );
}

  const { invoiceId } = await context.params;

  const invoice = await getFeeInvoiceById(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { ipAddress, userAgent } = getRequestMetadata(request);

  await deleteFeeInvoice(invoiceId);

  appendFeeTransactionLog({
    transactionType: "invoice_deleted",
    performedBy: session.id,
    performedByName: session.name,
    performedByEmail: session.email ?? "",
    ipAddress,
    userAgent,
    amount: invoice.amount,
    invoiceId: invoice.id,
    receiptNo: invoice.receiptNo,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    feeTitle: invoice.title,
    feeType: invoice.particulars,
      principalAmount: invoice.amount,
      paymentMode: invoice.paymentMode || undefined,
      paymentDate: invoice.dueDate,
  }).catch(() => {});

  await logAction({
    action: "delete",
    category: "fees",
    details: `Deleted invoice ${invoice.receiptNo || invoiceId} for ${invoice.studentName || "(unknown)"} (₹${invoice.amount})`,
    path: "/api/invoices/" + invoiceId,
    method: "DELETE",
    request,
    session,
    metadata: { invoiceId, receiptNo: invoice.receiptNo, studentId: invoice.studentId, studentName: invoice.studentName, amount: invoice.amount },
  });

  return NextResponse.json({ success: true });
}