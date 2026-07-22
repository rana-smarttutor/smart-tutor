import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  COLLECTIONS,
  getCollection,
} from "@/lib/data-store";
import type {
  BusinessExpense,
  FeeInstallmentPlan,
  FeeInvoice,
  ProfitLossMonthlyRow,
  ProfitLossSummary,
  StaffPayout,
  TeacherPayout,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ValidationError extends Error {}

type PaymentEntry = {
  amount: number;
  date: string;
  transactionId?: string;
};

type MonthlyAccumulator = {
  invoiceIncome: number;
  installmentIncome: number;
  staffExpense: number;
  businessExpense: number;
};

function getToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

function getDefaultFromDate() {
  const today = getToday();
  return `${today.slice(0, 4)}-01-01`;
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function getDateParameter(
  value: string | null,
  fallback: string,
  label: string,
) {
  if (!value) {
    return fallback;
  }

  if (!isValidDateString(value)) {
    throw new ValidationError(
      `${label} must use the YYYY-MM-DD format.`,
    );
  }

  return value;
}

function toDateOnly(value?: string | null) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  const dateValue = value.slice(0, 10);

  return isValidDateString(dateValue)
    ? dateValue
    : undefined;
}

function isWithinDateRange(
  date: string,
  fromDate: string,
  toDate: string,
) {
  return date >= fromDate && date <= toDate;
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getMonthLabel(month: string) {
  const date = new Date(`${month}-01T12:00:00`);

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getMonthDifference(
  fromDate: string,
  toDate: string,
) {
  const from = new Date(`${fromDate}T12:00:00`);
  const to = new Date(`${toDate}T12:00:00`);

  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

function createMonthlyAccumulator(
  fromDate: string,
  toDate: string,
) {
  const monthly = new Map<string, MonthlyAccumulator>();

  const cursor = new Date(`${fromDate.slice(0, 7)}-01T12:00:00`);
  const finalMonth = new Date(
    `${toDate.slice(0, 7)}-01T12:00:00`,
  );

  while (cursor <= finalMonth) {
    const month = `${cursor.getFullYear()}-${String(
      cursor.getMonth() + 1,
    ).padStart(2, "0")}`;

    monthly.set(month, {
      invoiceIncome: 0,
      installmentIncome: 0,
      staffExpense: 0,
      businessExpense: 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return monthly;
}

function getPositiveAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount;
}

function getFallbackPaymentDate(
  ...values: Array<string | null | undefined>
) {
  for (const value of values) {
    const normalizedDate = toDateOnly(value);

    if (normalizedDate) {
      return normalizedDate;
    }
  }

  return undefined;
}

function getPaymentEntries(input: {
  transactions?: Array<{
    paidAmount?: number;
    paidDate?: string;
    transactionId?: string;
  }>;
  fallbackAmount?: number;
  fallbackDate?: string;
}) {
  const transactions = input.transactions ?? [];

  const validTransactions: PaymentEntry[] = transactions.flatMap(
    (transaction) => {
      const amount = getPositiveAmount(
        transaction.paidAmount,
      );

      const date = toDateOnly(transaction.paidDate);

      if (!amount || !date) {
        return [];
      }

      return [
        {
          amount,
          date,
          transactionId:
            transaction.transactionId?.trim() || undefined,
        },
      ];
    },
  );

  if (validTransactions.length) {
    return validTransactions;
  }

  const fallbackAmount = getPositiveAmount(
    input.fallbackAmount,
  );

  const fallbackDate = toDateOnly(input.fallbackDate);

  if (!fallbackAmount || !fallbackDate) {
    return [];
  }

  return [
    {
      amount: fallbackAmount,
      date: fallbackDate,
    },
  ];
}

function createPaymentKey(input: {
  sourceKey: string;
  amount: number;
  date: string;
  transactionId?: string;
}) {
  if (input.transactionId) {
    return [
      "transaction",
      input.transactionId.trim().toLowerCase(),
      input.date,
      input.amount.toFixed(2),
    ].join(":");
  }

  return [
    "record",
    input.sourceKey,
    input.date,
    input.amount.toFixed(2),
  ].join(":");
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
            "Only admin can access profit and loss reports.",
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

export async function GET(request: Request) {
  try {
    const authorization = await requireAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { searchParams } = new URL(request.url);

    const fromDate = getDateParameter(
      searchParams.get("fromDate"),
      getDefaultFromDate(),
      "From date",
    );

    const toDate = getDateParameter(
      searchParams.get("toDate"),
      getToday(),
      "To date",
    );

    if (fromDate > toDate) {
      throw new ValidationError(
        "From date cannot be after the to date.",
      );
    }

    if (getMonthDifference(fromDate, toDate) > 60) {
      throw new ValidationError(
        "The profit and loss date range cannot exceed 5 years.",
      );
    }

const [
  invoiceDocuments,
  installmentPlanDocuments,
  staffPayoutDocuments,
  teacherPayoutDocuments,
  businessExpenseDocuments,
] = await Promise.all([
  (async () => {
    const collection = await getCollection<FeeInvoice>(
      COLLECTIONS.feeInvoices,
    );

    return collection.find({}).toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<FeeInstallmentPlan>(
        COLLECTIONS.feeInstallmentPlans,
      );

    return collection.find({}).toArray();
  })(),

  (async () => {
    const collection = await getCollection<StaffPayout>(
      COLLECTIONS.staffPayouts,
    );

    return collection.find({}).toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<TeacherPayout>(
        COLLECTIONS.teacherPayouts,
      );

    return collection.find({}).toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<BusinessExpense>(
        COLLECTIONS.businessExpenses,
      );

    return collection
      .find({
        expenseDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .sort({
        expenseDate: -1,
        createdAt: -1,
      })
      .toArray();
  })(),
]);
    const monthly = createMonthlyAccumulator(
      fromDate,
      toDate,
    );

    const seenIncomePayments = new Set<string>();
    const seenStaffPayments = new Set<string>();

    let invoiceIncome = 0;
    let installmentIncome = 0;
    let staffExpense = 0;
    let businessExpense = 0;

    /*
     * An invoice connected to an installment plan must not
     * be counted twice.
     */
    const invoiceIdsManagedByPlans = new Set(
      installmentPlanDocuments
        .map((plan) => plan.invoiceId?.trim())
        .filter(
          (invoiceId): invoiceId is string =>
            Boolean(invoiceId),
        ),
    );

    const invoiceIdsWithPlanPayments = new Set(
      installmentPlanDocuments.flatMap((plan) => {
        if (!plan.invoiceId?.trim()) {
          return [];
        }

        const hasPayment =
          getPositiveAmount(plan.paidAmount) > 0 ||
          plan.installments?.some(
            (installment) =>
              getPositiveAmount(installment.paidAmount) > 0 ||
              (installment.transactions ?? []).some(
                (transaction) =>
                  getPositiveAmount(
                    transaction.paidAmount,
                  ) > 0,
              ),
          );

        return hasPayment ? [plan.invoiceId.trim()] : [];
      }),
    );

    /*
     * Installment income
     */
    for (const plan of installmentPlanDocuments) {
      for (const installment of plan.installments ?? []) {
        const fallbackDate = getFallbackPaymentDate(
          installment.paidDate,
          plan.updatedAt,
          plan.createdAt,
        );

        const payments = getPaymentEntries({
          transactions: installment.transactions,
          fallbackAmount: installment.paidAmount,
          fallbackDate,
        });

        payments.forEach((payment, index) => {
          if (
            !isWithinDateRange(
              payment.date,
              fromDate,
              toDate,
            )
          ) {
            return;
          }

          const paymentKey = createPaymentKey({
            sourceKey: [
              "installment",
              plan.id,
              installment.installmentNumber,
              index,
            ].join(":"),
            amount: payment.amount,
            date: payment.date,
            transactionId: payment.transactionId,
          });

          if (seenIncomePayments.has(paymentKey)) {
            return;
          }

          seenIncomePayments.add(paymentKey);
          installmentIncome += payment.amount;

          const monthData = monthly.get(
            getMonthKey(payment.date),
          );

          if (monthData) {
            monthData.installmentIncome += payment.amount;
          }
        });
      }
    }

    /*
     * Invoice income
     *
     * Skip an invoice when its linked installment plan already
     * contains payment records.
     */
    for (const invoice of invoiceDocuments) {
      if (
        invoiceIdsWithPlanPayments.has(invoice.id)
      ) {
        continue;
      }

      const fallbackDate = getFallbackPaymentDate(
        invoice.updatedAt,
        invoice.createdAt,
      );

      const payments = getPaymentEntries({
        transactions: invoice.transactions,
        fallbackAmount: invoice.paidAmount,
        fallbackDate,
      });

      payments.forEach((payment, index) => {
        if (
          !isWithinDateRange(
            payment.date,
            fromDate,
            toDate,
          )
        ) {
          return;
        }

        const paymentKey = createPaymentKey({
          sourceKey: [
            "invoice",
            invoice.id,
            index,
          ].join(":"),
          amount: payment.amount,
          date: payment.date,
          transactionId: payment.transactionId,
        });

        if (seenIncomePayments.has(paymentKey)) {
          return;
        }

        seenIncomePayments.add(paymentKey);
        invoiceIncome += payment.amount;

        const monthData = monthly.get(
          getMonthKey(payment.date),
        );

        if (monthData) {
          monthData.invoiceIncome += payment.amount;
        }
      });
    }

    /*
     * Unified staff payouts
     */
    const staffPayoutMonthKeys = new Set<string>();

    for (const payout of staffPayoutDocuments) {
      staffPayoutMonthKeys.add(
        `${payout.staffId}:${payout.month}`,
      );

      const fallbackDate = getFallbackPaymentDate(
        payout.paidDate,
        payout.updatedAt,
        payout.createdAt,
      );

      const payments = getPaymentEntries({
        transactions: payout.transactions,
        fallbackAmount: payout.paidAmount,
        fallbackDate,
      });

      payments.forEach((payment, index) => {
        if (
          !isWithinDateRange(
            payment.date,
            fromDate,
            toDate,
          )
        ) {
          return;
        }

        const paymentKey = createPaymentKey({
          sourceKey: [
            "staff-payout",
            payout.id,
            index,
          ].join(":"),
          amount: payment.amount,
          date: payment.date,
          transactionId: payment.transactionId,
        });

        if (seenStaffPayments.has(paymentKey)) {
          return;
        }

        seenStaffPayments.add(paymentKey);
        staffExpense += payment.amount;

        const monthData = monthly.get(
          getMonthKey(payment.date),
        );

        if (monthData) {
          monthData.staffExpense += payment.amount;
        }
      });
    }

    /*
     * Older teacher-payout records are included only when
     * no unified staff-payout record exists for that teacher
     * and month.
     */
    for (const payout of teacherPayoutDocuments) {
      const staffMonthKey = `${payout.teacherId}:${payout.month}`;

      if (staffPayoutMonthKeys.has(staffMonthKey)) {
        continue;
      }

      const amount = getPositiveAmount(
        payout.paidAmount,
      );

      if (!amount) {
        continue;
      }

      const paymentDate = getFallbackPaymentDate(
        payout.payoutDate,
        payout.updatedAt,
        payout.createdAt,
        `${payout.month}-01`,
      );

      if (
        !paymentDate ||
        !isWithinDateRange(
          paymentDate,
          fromDate,
          toDate,
        )
      ) {
        continue;
      }

      const paymentKey = createPaymentKey({
        sourceKey: `teacher-payout:${payout.id}`,
        amount,
        date: paymentDate,
      });

      if (seenStaffPayments.has(paymentKey)) {
        continue;
      }

      seenStaffPayments.add(paymentKey);
      staffExpense += amount;

      const monthData = monthly.get(
        getMonthKey(paymentDate),
      );

      if (monthData) {
        monthData.staffExpense += amount;
      }
    }

    /*
     * General business expenses
     */
    for (const expense of businessExpenseDocuments) {
      const amount = getPositiveAmount(expense.amount);

      if (!amount) {
        continue;
      }

      businessExpense += amount;

      const monthData = monthly.get(
        getMonthKey(expense.expenseDate),
      );

      if (monthData) {
        monthData.businessExpense += amount;
      }
    }

    /*
     * Pending invoice amount.
     *
     * Invoices connected to installment plans are excluded
     * because their pending amount is taken from the plan.
     */
    const pendingInvoiceAmount = invoiceDocuments.reduce(
      (total, invoice) => {
        if (
          invoiceIdsManagedByPlans.has(invoice.id)
        ) {
          return total;
        }

        const amount = getPositiveAmount(invoice.amount);
        const paidAmount = Math.max(
          0,
          Number(invoice.paidAmount) || 0,
        );

        return (
          total +
          Math.max(0, amount - paidAmount)
        );
      },
      0,
    );

    const pendingInstallmentAmount =
      installmentPlanDocuments.reduce(
        (total, plan) => {
          if (plan.status === "cancelled") {
            return total;
          }

          return (
            total +
            Math.max(
              0,
              Number(plan.pendingAmount) || 0,
            )
          );
        },
        0,
      );

    const totalIncome =
      invoiceIncome + installmentIncome;

    const totalExpenses =
      staffExpense + businessExpense;

    const netProfit =
      totalIncome - totalExpenses;

    const profitMargin =
      totalIncome > 0
        ? Number(
            (
              (netProfit / totalIncome) *
              100
            ).toFixed(2),
          )
        : 0;

    const monthlyRows: ProfitLossMonthlyRow[] = [
      ...monthly.entries(),
    ].map(([month, values]) => {
      const monthIncome =
        values.invoiceIncome +
        values.installmentIncome;

      const monthExpense =
        values.staffExpense +
        values.businessExpense;

      return {
        month,
        monthLabel: getMonthLabel(month),

        invoiceIncome: values.invoiceIncome,
        installmentIncome:
          values.installmentIncome,
        totalIncome: monthIncome,

        staffExpense: values.staffExpense,
        businessExpense:
          values.businessExpense,
        totalExpense: monthExpense,

        netProfit:
          monthIncome - monthExpense,
      };
    });

const recentExpenses: BusinessExpense[] =
  businessExpenseDocuments
    .slice(0, 20)
    .map((document) => {
      const { _id, ...expense } = document;

      void _id;

      return expense as BusinessExpense;
    });

    const summary: ProfitLossSummary = {
      fromDate,
      toDate,
      generatedAt: new Date().toISOString(),

      income: {
        invoicePayments: invoiceIncome,
        installmentPayments:
          installmentIncome,
        total: totalIncome,
      },

      expenses: {
        staffPayouts: staffExpense,
        businessExpenses:
          businessExpense,
        total: totalExpenses,
      },

      pendingFees: {
        invoices: pendingInvoiceAmount,
        installments:
          pendingInstallmentAmount,
        total:
          pendingInvoiceAmount +
          pendingInstallmentAmount,
      },

      netProfit,
      profitMargin,

      monthly: monthlyRows,
      recentExpenses,
    };

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    console.error(
      "Get profit and loss summary error:",
      error,
    );

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to generate the profit and loss summary.",
      },
      { status: 500 },
    );
  }
}