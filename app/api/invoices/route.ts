import { NextResponse } from "next/server";

import { createFeeInvoice, getFeeInvoicesForRole } from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeInvoices = await getFeeInvoicesForRole(session.role, session.id);

  return NextResponse.json({ feeInvoices });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "educator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const feeInvoice = await createFeeInvoice({
    studentId: String(body.studentId ?? ""),
    studentName: String(body.studentName ?? ""),
    parentId: body.parentId ? String(body.parentId) : undefined,
    title: String(body.title ?? ""),
    amount: Number(body.amount ?? 0),
    paidAmount: Number(body.paidAmount ?? 0),
    dueDate: String(body.dueDate ?? ""),
    status: body.status ?? "unpaid",
    notes: body.notes ? String(body.notes) : undefined,
    createdBy: session.id,
  });

  return NextResponse.json({ feeInvoice });
}