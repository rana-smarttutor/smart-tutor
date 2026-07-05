import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createFeeInvoice,
  createNotifications,
  getFeeInvoiceStudentDetails,
  getFeeInvoicesForRole,
  getNotificationRecipientIdsForStudents,
} from "@/lib/data-store";

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

    const feeInvoice = await createFeeInvoice({
      studentId: studentDetails.studentId,
      studentName: studentDetails.studentName,
      parentId: studentDetails.parentId,

      title,
      particulars,
      amount,
      paidAmount: 0,
      dueDate,
      status: "unpaid",

      notes: getText(body.notes, 500) || undefined,
      paymentMode: getText(body.paymentMode, 60) || undefined,
      createdBy: session.id,

      parentName: studentDetails.parentName || undefined,
      classCourse: studentDetails.classCourse || undefined,
      batch: studentDetails.batch || undefined,
      rollNo: studentDetails.rollNo || undefined,
      academicYear: studentDetails.academicYear,
      mobileNo: studentDetails.mobileNo || undefined,
      month,
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