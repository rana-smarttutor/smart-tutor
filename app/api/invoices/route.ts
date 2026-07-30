import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createFeeInvoice,
  createNotifications,
  getFeeInvoiceStudentDetails,
  getFeeInvoicesForRole,
  getNotificationRecipientIdsForStudents,
  appendFeeTransactionLog,
  getRequestMetadata,
} from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";
import type { PaymentTransaction } from "@/lib/types";

function canManageFees(role: string | undefined) {
  return role === "admin" || role === "educator";
}

function getText(value: unknown, maxLength = 300) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function getAmount(value: unknown) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount)
    : null;
}

function getDueDate(value: unknown) {
  const dueDate = getText(value, 20);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return null;
  }

  const parsedDate = new Date(`${dueDate}T12:00:00`);

  return Number.isNaN(parsedDate.getTime()) ? null : dueDate;
}

export async function GET(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId")?.trim();

  if (studentId) {
    if (!canManageFees(session.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const studentDetails = await getFeeInvoiceStudentDetails(studentId);

    if (!studentDetails) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ studentDetails });
  }

  const feeInvoices = await getFeeInvoicesForRole(
    session.role,
    session.id,
  );

  return NextResponse.json({ feeInvoices });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!canManageFees(session.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const studentId = getText(body.studentId, 120);
    const title = getText(body.title, 120);
    const particulars = getText(body.particulars, 200) || title;
    const amount = getAmount(body.amount);
    const dueDate = getDueDate(body.dueDate);

    if (!studentId || !title || amount === null || !dueDate) {
      return NextResponse.json(
        {
          error:
            "Student, title, amount, and a valid due date are required.",
        },
        { status: 400 },
      );
    }

    const studentDetails = await getFeeInvoiceStudentDetails(
      studentId,
      dueDate,
    );

    if (!studentDetails) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    const month = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${dueDate}T12:00:00`));

    const paymentMode = getText(body.paymentMode, 60);
    let transactions: PaymentTransaction[] = [];
    let paidAmount = 0;
    let status: "paid" | "unpaid" | "partial" = "unpaid";

    if (body.transaction && paymentMode) {
      const t = body.transaction as Record<string, unknown>;
      const tx: PaymentTransaction = {
        paidAmount: amount,
        paidDate: (t.paidDate as string) || dueDate,
        paymentMode: (paymentMode as PaymentTransaction["paymentMode"]) || "Cash",
        transactionId: getText(t.transactionId, 200) || undefined,
        chequeNumber: getText(t.chequeNumber, 50) || undefined,
        bankName: getText(t.bankName, 100) || undefined,
        accountLast4: getText(t.accountLast4, 10) || undefined,
        recordedBy: session.id,
        recordedAt: new Date().toISOString(),
      };
      transactions = [tx];
      paidAmount = amount;
      status = "paid";
    }

    const feeInvoice = await createFeeInvoice({
      studentId: studentDetails.studentId,
      studentName: studentDetails.studentName,
      parentId: studentDetails.parentId,

      title,
      particulars,
      amount,
      paidAmount,
      dueDate,
      status,

      notes: getText(body.notes, 500) || undefined,
      paymentMode: paymentMode || undefined,
      createdBy: session.id,

      parentName: studentDetails.parentName || undefined,
      classCourse: studentDetails.classCourse || undefined,
      rollNo: studentDetails.rollNo || undefined,
      academicYear: studentDetails.academicYear,
      mobileNo: studentDetails.mobileNo || undefined,
      month,
      transactions,
    });

    const recipientIds = await getNotificationRecipientIdsForStudents([
      feeInvoice.studentId,
    ]);

    if (recipientIds.length > 0) {
      const formattedDueDate = new Date(
        `${feeInvoice.dueDate}T00:00:00`,
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      await createNotifications({
        userIds: recipientIds,
        title: `New fee invoice: ${feeInvoice.title}`,
        message: `A fee invoice of ₹${feeInvoice.amount.toLocaleString(
          "en-IN",
        )} has been issued. Due date: ${formattedDueDate}.`,
        type: "fees",
        link: "/dashboard",
      });
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);
    appendFeeTransactionLog({
      transactionType: "invoice_created",
      performedBy: session.id,
      performedByName: session.name,
      performedByEmail: session.email ?? "",
      ipAddress,
      userAgent,
      amount: feeInvoice.amount,
      invoiceId: feeInvoice.id,
      receiptNo: feeInvoice.receiptNo,
      studentId: feeInvoice.studentId,
      studentName: feeInvoice.studentName,
      feeTitle: feeInvoice.title,
      feeType: feeInvoice.particulars,
      paymentMode: feeInvoice.paymentMode || undefined,
      paymentDate: feeInvoice.dueDate,
    }).catch(() => {});

    await logAction({
      action: "create",
      category: "fees",
      details: `Created invoice ${feeInvoice.receiptNo} for ${feeInvoice.studentName} (₹${feeInvoice.amount})`,
      path: "/api/invoices",
      method: "POST",
      request,
      session,
      metadata: { invoiceId: feeInvoice.id, receiptNo: feeInvoice.receiptNo, studentId: feeInvoice.studentId, studentName: feeInvoice.studentName, amount: feeInvoice.amount },
    });

    return NextResponse.json(
      {
        feeInvoice,
        notified: recipientIds.length > 0,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create invoice.",
      },
      { status: 500 },
    );
  }
}