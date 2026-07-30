import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  createFeeInstallmentPlan,
  getFeeInstallmentPlansForRole,
  getStudentDirectory,
} from "@/lib/data-store";
import type { FeeInstallment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error("Paid amount must be zero or greater.");
  }

  return number;
}

function parseInstallments(
  value: unknown,
): Array<
  Pick<
    FeeInstallment,
    | "installmentNumber"
    | "installmentTitle"
    | "amount"
    | "paidAmount"
    | "dueDate"
    | "paidDate"
    | "receiptNumber"
    | "paymentMode"
    | "notes"
  >
> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Add at least one installment.");
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Installment ${index + 1} is invalid.`);
    }

    const installment = item as Record<string, unknown>;

    const installmentNumber = Number(
      installment.installmentNumber ?? index + 1,
    );
    const amount = Number(installment.amount);
    const paidAmount = getOptionalNumber(installment.paidAmount) ?? 0;
    const dueDate = getRequiredText(
      installment.dueDate,
      `Due date for installment ${index + 1}`,
    );

    if (!Number.isInteger(installmentNumber) || installmentNumber < 1) {
      throw new Error(
        `Installment ${index + 1} must have a valid installment number.`,
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        `Installment ${index + 1} amount must be greater than zero.`,
      );
    }

    if (paidAmount > amount) {
      throw new Error(
        `Paid amount cannot exceed installment ${index + 1} amount.`,
      );
    }

    return {
      installmentNumber,
      installmentTitle:
        getOptionalText(installment.installmentTitle) ??
        `Installment ${installmentNumber}`,
      amount,
      paidAmount,
      dueDate,
      paidDate:
        paidAmount > 0 ? getOptionalText(installment.paidDate) : undefined,
      receiptNumber: getOptionalText(installment.receiptNumber),
      paymentMode: getOptionalText(installment.paymentMode),
      notes: getOptionalText(installment.notes),
    };
  });
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feeInstallmentPlans = await getFeeInstallmentPlansForRole(
      session.role,
      session.id,
    );

    return NextResponse.json({ feeInstallmentPlans });
  } catch (error) {
    console.error("Get fee installment plans error:", error);

    return NextResponse.json(
      { error: "Unable to load fee installment plans." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin can create fee installment plans." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const studentId = getRequiredText(body.studentId, "Student");

    const students = await getStudentDirectory();
    const student = students.find(
      (item) => item.id === studentId && item.role === "student",
    );

    if (!student) {
      return NextResponse.json(
        { error: "Selected student was not found." },
        { status: 404 },
      );
    }

    const installments = parseInstallments(body.installments);

    const feeInstallmentPlan = await createFeeInstallmentPlan({
      studentId: student.id,
      studentName: student.name,

      parentId: getOptionalText(body.parentId),
      invoiceId: getOptionalText(body.invoiceId),

      title: getRequiredText(body.title, "Fee plan title"),

      courseName: getOptionalText(body.courseName),
      academicYear: getOptionalText(body.academicYear),
      notes: getOptionalText(body.notes),

      createdBy: session.id,
      installments,
    });

    await logAction({
      action: "create",
      category: "fees",
      details: `Fee installment plan created for ${student.name}`,
      path: "/api/fee-installments",
      method: "POST",
      request,
      session,
      metadata: { studentId: student.id, planTitle: body.title, installmentCount: installments.length },
    });

    return NextResponse.json({ feeInstallmentPlan }, { status: 201 });
  } catch (error) {
    console.error("Create fee installment plan error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create fee installment plan.",
      },
      { status: 500 },
    );
  }
}
