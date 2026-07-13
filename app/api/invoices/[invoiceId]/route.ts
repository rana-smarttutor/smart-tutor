import { NextResponse } from "next/server";

import { deleteFeeInvoice, updateFeeInvoice } from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";
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

export async function DELETE(_request: Request, context: RouteContext) {
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

  const deleted = await deleteFeeInvoice(invoiceId);

  if (!deleted) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}