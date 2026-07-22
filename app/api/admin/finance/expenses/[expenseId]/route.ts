import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  deleteBusinessExpense,
  getBusinessExpenseById,
  updateBusinessExpense,
} from "@/lib/data-store";
import type {
  BusinessExpense,
  PaymentMode,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    expenseId: string;
  }>;
};

const EXPENSE_CATEGORIES: BusinessExpense["category"][] = [
  "Rent",
  "Electricity",
  "Internet",
  "Marketing",
  "Software",
  "Office Supplies",
  "Travel",
  "Maintenance",
  "Taxes",
  "Other",
];

const PAYMENT_MODES: PaymentMode[] = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Online Payment",
  "Cheque",
];

class ValidationError extends Error {}

function hasField(
  body: Record<string, unknown>,
  field: string,
) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function getRequiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${label} is required.`);
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim() || undefined;
}

function getPositiveNumber(value: unknown, label: string) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new ValidationError(
      `${label} must be greater than zero.`,
    );
  }

  return number;
}

function getValidDate(value: unknown, label: string) {
  const dateValue = getRequiredText(value, label);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    throw new ValidationError(
      `${label} must be in YYYY-MM-DD format.`,
    );
  }

  const parsedDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ValidationError(`${label} is invalid.`);
  }

  return dateValue;
}

function getExpenseCategory(value: unknown) {
  const category = getRequiredText(
    value,
    "Expense category",
  );

  if (
    !EXPENSE_CATEGORIES.includes(
      category as BusinessExpense["category"],
    )
  ) {
    throw new ValidationError(
      "Choose a valid expense category.",
    );
  }

  return category as BusinessExpense["category"];
}

function getPaymentMode(value: unknown) {
  const paymentMode = getRequiredText(
    value,
    "Payment mode",
  );

  if (!PAYMENT_MODES.includes(paymentMode as PaymentMode)) {
    throw new ValidationError(
      "Choose a valid payment mode.",
    );
  }

  return paymentMode as PaymentMode;
}

async function requireAdmin() {
  const session = await getSessionUser();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (session.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        {
          error:
            "Only admin can manage business expense records.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    session,
    error: null,
  };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const authorization = await requireAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { expenseId } = await context.params;

    const normalizedExpenseId = expenseId?.trim();

    if (!normalizedExpenseId) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 },
      );
    }

    const existingExpense =
      await getBusinessExpenseById(normalizedExpenseId);

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Business expense not found." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const updates: Partial<{
      title: string;
      category: BusinessExpense["category"];
      amount: number;
      expenseDate: string;
      paymentMode: BusinessExpense["paymentMode"];
      transactionId: string;
      vendor: string;
      notes: string;
      receiptUrl: string;
    }> = {};

    if (hasField(body, "title")) {
      updates.title = getRequiredText(
        body.title,
        "Expense title",
      );
    }

    if (hasField(body, "category")) {
      updates.category = getExpenseCategory(body.category);
    }

    if (hasField(body, "amount")) {
      updates.amount = getPositiveNumber(
        body.amount,
        "Expense amount",
      );
    }

    if (hasField(body, "expenseDate")) {
      updates.expenseDate = getValidDate(
        body.expenseDate,
        "Expense date",
      );
    }

    if (hasField(body, "paymentMode")) {
      updates.paymentMode = getPaymentMode(
        body.paymentMode,
      );
    }

    if (hasField(body, "transactionId")) {
      updates.transactionId =
        getOptionalText(body.transactionId) ?? "";
    }

    if (hasField(body, "vendor")) {
      updates.vendor = getOptionalText(body.vendor) ?? "";
    }

    if (hasField(body, "notes")) {
      updates.notes = getOptionalText(body.notes) ?? "";
    }

    if (hasField(body, "receiptUrl")) {
      updates.receiptUrl =
        getOptionalText(body.receiptUrl) ?? "";
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        {
          error:
            "Provide at least one expense field to update.",
        },
        { status: 400 },
      );
    }

    const finalPaymentMode =
      updates.paymentMode ?? existingExpense.paymentMode;

    const finalTransactionId = hasField(
      body,
      "transactionId",
    )
      ? getOptionalText(body.transactionId)
      : existingExpense.transactionId;

    if (
      finalPaymentMode !== "Cash" &&
      !finalTransactionId
    ) {
      throw new ValidationError(
        "Transaction ID or payment reference is required for non-cash expenses.",
      );
    }

    const expense = await updateBusinessExpense(
      normalizedExpenseId,
      updates,
    );

    if (!expense) {
      return NextResponse.json(
        { error: "Business expense not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      expense,
      message: "Business expense updated successfully.",
    });
  } catch (error) {
    console.error("Update business expense error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to update business expense." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const authorization = await requireAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { expenseId } = await context.params;

    const normalizedExpenseId = expenseId?.trim();

    if (!normalizedExpenseId) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 },
      );
    }

    const existingExpense =
      await getBusinessExpenseById(normalizedExpenseId);

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Business expense not found." },
        { status: 404 },
      );
    }

    const deleted = await deleteBusinessExpense(
      normalizedExpenseId,
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Business expense not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Business expense deleted successfully.",
    });
  } catch (error) {
    console.error("Delete business expense error:", error);

    return NextResponse.json(
      { error: "Unable to delete business expense." },
      { status: 500 },
    );
  }
}