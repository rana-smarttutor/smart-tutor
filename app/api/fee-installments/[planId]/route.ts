import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  deleteFeeInstallmentPlan,
  getFeeInstallmentPlanById,
  updateFeeInstallmentPlan,
} from "@/lib/data-store";
import type {
  FeeInstallment,
  FeeInstallmentPlan,
  PaymentTransaction,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function getRequiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
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

function parseInstallments(value: unknown): Array<
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
        paidAmount > 0
          ? getOptionalText(installment.paidDate)
          : undefined,
      receiptNumber: getOptionalText(installment.receiptNumber),
      paymentMode: getOptionalText(installment.paymentMode),
      notes: getOptionalText(installment.notes),
    };
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin can update fee installment plans." },
        { status: 403 },
      );
    }

    const { planId } = await context.params;

    const existingPlan = await getFeeInstallmentPlanById(planId);

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Fee installment plan not found." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const updates: Record<string, unknown> = {};

    if (hasField(body, "title")) {
      updates.title = getRequiredText(body.title, "Fee plan title");
    }

    if (hasField(body, "courseName")) {
      updates.courseName = getOptionalText(body.courseName) ?? "";
    }

    if (hasField(body, "academicYear")) {
      updates.academicYear = getOptionalText(body.academicYear) ?? "";
    }

    if (hasField(body, "notes")) {
      updates.notes = getOptionalText(body.notes) ?? "";
    }

    if (hasField(body, "installments")) {
      updates.installments = parseInstallments(body.installments);
    }

    if (body.installmentTransaction) {
      const it = body.installmentTransaction as Record<string, unknown>;
      const t = it.transaction as Record<string, unknown>;
      const transaction: PaymentTransaction = {
        paidAmount: Number(t.paidAmount) || 0,
        paidDate: (t.paidDate as string) || new Date().toISOString().slice(0, 10),
        paymentMode: (t.paymentMode as PaymentTransaction["paymentMode"]) || "Cash",
        transactionId: getOptionalText(t.transactionId),
        chequeNumber: getOptionalText(t.chequeNumber),
        bankName: getOptionalText(t.bankName),
        accountLast4: getOptionalText(t.accountLast4),
        notes: getOptionalText(t.notes),
        recordedBy: session.id,
        recordedAt: new Date().toISOString(),
      };

      (updates as Record<string, unknown>).installmentTransaction = {
        installmentNumber: Number(it.installmentNumber),
        transaction,
      };
    }

    if (hasField(body, "status")) {
      if (body.status !== "cancelled") {
        return NextResponse.json(
          {
            error:
              "Plan status is calculated automatically. Only cancellation can be selected manually.",
          },
          { status: 400 },
        );
      }

      if (existingPlan.paidAmount > 0) {
        return NextResponse.json(
          {
            error:
              "A fee plan with recorded payments cannot be cancelled. Update the installments instead.",
          },
          { status: 400 },
        );
      }

      updates.status = "cancelled";
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 },
      );
    }

    const feeInstallmentPlan = await updateFeeInstallmentPlan(
      planId,
      updates,
    );

    if (!feeInstallmentPlan) {
      return NextResponse.json(
        { error: "Fee installment plan not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ feeInstallmentPlan });
  } catch (error) {
    console.error("Update fee installment plan error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update fee installment plan.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin can delete fee installment plans." },
        { status: 403 },
      );
    }

    const { planId } = await context.params;

    const existingPlan = await getFeeInstallmentPlanById(planId);

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Fee installment plan not found." },
        { status: 404 },
      );
    }

    if (existingPlan.paidAmount > 0) {
      return NextResponse.json(
        {
          error:
            "A fee plan with recorded payments cannot be deleted. Cancel it only when no payment has been collected.",
        },
        { status: 400 },
      );
    }

    const deleted = await deleteFeeInstallmentPlan(planId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Fee installment plan not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete fee installment plan error:", error);

    return NextResponse.json(
      { error: "Unable to delete fee installment plan." },
      { status: 500 },
    );
  }
}