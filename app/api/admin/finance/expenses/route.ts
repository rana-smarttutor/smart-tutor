import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createBusinessExpense,
  getBusinessExpenses,
} from "@/lib/data-store";
import type {
  BusinessExpense,
  PaymentMode,
} from "@/lib/types";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

function getPositiveNumber(value: unknown, label: string) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new ValidationError(`${label} must be greater than zero.`);
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
  const category = getRequiredText(value, "Expense category");

  if (
    !EXPENSE_CATEGORIES.includes(
      category as BusinessExpense["category"],
    )
  ) {
    throw new ValidationError("Choose a valid expense category.");
  }

  return category as BusinessExpense["category"];
}

function getPaymentMode(value: unknown) {
  const paymentMode = getRequiredText(value, "Payment mode");

  if (!PAYMENT_MODES.includes(paymentMode as PaymentMode)) {
    throw new ValidationError("Choose a valid payment mode.");
  }

  return paymentMode as PaymentMode;
}

async function requireAdmin() {
  const session = await getSessionUser();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
      session: null,
    };
  }

  if (session.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          error:
            "Only admin can access business expense records.",
        },
        { status: 403 },
      ),
      session: null,
    };
  }

  return {
    error: null,
    session,
  };
}

export async function GET(request: Request) {
  try {
    const authorization = await requireAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { searchParams } = new URL(request.url);

    const fromDateValue = searchParams.get("fromDate");
    const toDateValue = searchParams.get("toDate");
    const categoryValue = searchParams.get("category");
    const limitValue = searchParams.get("limit");

    const fromDate = fromDateValue
      ? getValidDate(fromDateValue, "From date")
      : undefined;

    const toDate = toDateValue
      ? getValidDate(toDateValue, "To date")
      : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      throw new ValidationError(
        "From date cannot be after the to date.",
      );
    }

    let category: BusinessExpense["category"] | undefined;

    if (categoryValue && categoryValue !== "all") {
      category = getExpenseCategory(categoryValue);
    }

    let limit = 500;

    if (limitValue) {
      const parsedLimit = Number(limitValue);

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 2000
      ) {
        throw new ValidationError(
          "Limit must be a whole number between 1 and 2000.",
        );
      }

      limit = parsedLimit;
    }

    const expenses = await getBusinessExpenses({
      fromDate,
      toDate,
      category,
      limit,
    });

    const totalAmount = expenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    );

    return NextResponse.json({
      expenses,
      summary: {
        count: expenses.length,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Get business expenses error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to load business expenses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireAdmin();

    if (authorization.error || !authorization.session) {
      return authorization.error;
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const title = getRequiredText(body.title, "Expense title");
    const category = getExpenseCategory(body.category);
    const amount = getPositiveNumber(body.amount, "Expense amount");
    const expenseDate = getValidDate(
      body.expenseDate,
      "Expense date",
    );
    const paymentMode = getPaymentMode(body.paymentMode);

    const transactionId = getOptionalText(body.transactionId);

    if (paymentMode !== "Cash" && !transactionId) {
      throw new ValidationError(
        "Transaction ID or payment reference is required for non-cash expenses.",
      );
    }

    const expense = await createBusinessExpense({
      title,
      category,
      amount,
      expenseDate,
      paymentMode,
      transactionId,
      vendor: getOptionalText(body.vendor),
      notes: getOptionalText(body.notes),
      receiptUrl: getOptionalText(body.receiptUrl),
      createdBy: authorization.session.id,
      createdByName: authorization.session.name,
    });

    await logAction({
      action: "create",
      category: "expenses",
      details: `Expense created: ${title} (₹${amount})`,
      path: "/api/admin/finance/expenses",
      method: "POST",
      request,
      session: authorization.session,
      metadata: { expenseId: expense.id, title, amount, category },
    });

    return NextResponse.json(
      {
        expense,
        message: "Business expense added successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create business expense error:", error);

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
      { error: "Unable to create business expense." },
      { status: 500 },
    );
  }
}