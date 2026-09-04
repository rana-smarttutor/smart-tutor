import { NextResponse } from "next/server";
import { Workbook, type Worksheet } from "exceljs";
import type { Document } from "mongodb";

import { getSessionUser } from "@/lib/auth";
import {
  COLLECTIONS,
  getCollection,
} from "@/lib/data-store";
import type {
  BusinessExpense,
  FeeInstallmentPlan,
  FeeInvoice,
  StaffPayout,
  TeacherPayout,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ValidationError extends Error {}

type StudentRecord = Document & {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  parentMobile?: string;
  program?: string;
  status?: string;
  createdAt?: string;
  admissionNo?: string;
  admissionNumber?: string;
  profile?: {
    parentName?: string;
    parentMobile?: string;
    courseWanted?: string;
    courseWantedTitle?: string;
  };
};

type IncomeEntry = {
  source: "Invoice" | "Installment";
  sourceId: string;
  studentId: string;
  studentName: string;
  title: string;
  amount: number;
  paidDate: string;
  paymentMode: string;
  transactionId?: string;
  receiptNumber?: string;
};

type SalaryEntry = {
  staffId: string;
  staffName: string;
  month: string;
  title: string;
  paidAmount: number;
  paidDate: string;
  paymentMode: string;
  transactionId?: string;
};

type MonthlyReportRow = {
  month: string;
  monthLabel: string;
  invoiceIncome: number;
  installmentIncome: number;
  totalIncome: number;
  salaryExpense: number;
  businessExpense: number;
  totalExpense: number;
  netProfit: number;
};

const HEADER_FILL = "0B40A1";
const HEADER_TEXT = "FFFFFF";
const TITLE_FILL = "0A1637";
const LIGHT_BLUE = "EAF2FF";
const LIGHT_GREEN = "E9F9EF";
const LIGHT_RED = "FDECEC";
const LIGHT_AMBER = "FFF6DD";
const BORDER_COLOR = "D7DFEA";

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

function isValidDate(value: string) {
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

  if (!isValidDate(value)) {
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

  const normalizedDate = value.slice(0, 10);

  return isValidDate(normalizedDate)
    ? normalizedDate
    : undefined;
}

function isWithinRange(
  date: string,
  fromDate: string,
  toDate: string,
) {
  return date >= fromDate && date <= toDate;
}

function getPositiveAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount;
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

function getFallbackDate(
  ...values: Array<string | null | undefined>
) {
  for (const value of values) {
    const date = toDateOnly(value);

    if (date) {
      return date;
    }
  }

  return undefined;
}

function formatWorksheetTitle(
  worksheet: Worksheet,
  title: string,
  subtitle?: string,
  endColumn = 8,
) {
  worksheet.mergeCells(1, 1, 1, endColumn);

  const titleCell = worksheet.getCell(1, 1);

  titleCell.value = title;
  titleCell.font = {
    bold: true,
    size: 18,
    color: {
      argb: HEADER_TEXT,
    },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: TITLE_FILL,
    },
  };
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getRow(1).height = 32;

  if (subtitle) {
    worksheet.mergeCells(2, 1, 2, endColumn);

    const subtitleCell = worksheet.getCell(2, 1);

    subtitleCell.value = subtitle;
    subtitleCell.font = {
      size: 10,
      color: {
        argb: "536278",
      },
    };
    subtitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "F4F7FB",
      },
    };
    subtitleCell.alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    worksheet.getRow(2).height = 22;
  }
}

function styleHeaderRow(
  worksheet: Worksheet,
  rowNumber: number,
) {
  const row = worksheet.getRow(rowNumber);

  row.font = {
    bold: true,
    color: {
      argb: HEADER_TEXT,
    },
  };

  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: HEADER_FILL,
    },
  };

  row.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };

  row.height = 28;

  row.eachCell((cell) => {
    cell.border = {
      top: {
        style: "thin",
        color: {
          argb: BORDER_COLOR,
        },
      },
      left: {
        style: "thin",
        color: {
          argb: BORDER_COLOR,
        },
      },
      bottom: {
        style: "thin",
        color: {
          argb: BORDER_COLOR,
        },
      },
      right: {
        style: "thin",
        color: {
          argb: BORDER_COLOR,
        },
      },
    };
  });
}

function styleDataRows(
  worksheet: Worksheet,
  fromRow: number,
  toRow: number,
) {
  if (toRow < fromRow) {
    return;
  }

  for (let rowNumber = fromRow; rowNumber <= toRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    row.alignment = {
      vertical: "middle",
      wrapText: true,
    };

    if (rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "F8FAFD",
        },
      };
    }

    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
        left: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
        bottom: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
        right: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
      };
    });
  }
}

function setCurrencyFormat(
  worksheet: Worksheet,
  columns: number[],
  fromRow: number,
  toRow: number,
) {
  if (toRow < fromRow) {
    return;
  }

  for (const columnNumber of columns) {
    worksheet.getColumn(columnNumber).numFmt =
      '₹#,##0.00;[Red]-₹#,##0.00';
  }
}

function createMonthlyRows(
  fromDate: string,
  toDate: string,
  incomeEntries: IncomeEntry[],
  salaryEntries: SalaryEntry[],
  expenses: BusinessExpense[],
): MonthlyReportRow[] {
  const monthlyMap = new Map<
    string,
    Omit<MonthlyReportRow, "month" | "monthLabel" | "totalIncome" | "totalExpense" | "netProfit">
  >();

  const cursor = new Date(
    `${fromDate.slice(0, 7)}-01T12:00:00`,
  );

  const endMonth = new Date(
    `${toDate.slice(0, 7)}-01T12:00:00`,
  );

  while (cursor <= endMonth) {
    const month = `${cursor.getFullYear()}-${String(
      cursor.getMonth() + 1,
    ).padStart(2, "0")}`;

    monthlyMap.set(month, {
      invoiceIncome: 0,
      installmentIncome: 0,
      salaryExpense: 0,
      businessExpense: 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const entry of incomeEntries) {
    const month = getMonthKey(entry.paidDate);
    const row = monthlyMap.get(month);

    if (!row) {
      continue;
    }

    if (entry.source === "Invoice") {
      row.invoiceIncome += entry.amount;
    } else {
      row.installmentIncome += entry.amount;
    }
  }

  for (const entry of salaryEntries) {
    const month = getMonthKey(entry.paidDate);
    const row = monthlyMap.get(month);

    if (row) {
      row.salaryExpense += entry.paidAmount;
    }
  }

  for (const expense of expenses) {
    const month = getMonthKey(expense.expenseDate);
    const row = monthlyMap.get(month);

    if (row) {
      row.businessExpense += expense.amount;
    }
  }

  return [...monthlyMap.entries()].map(
    ([month, values]) => {
      const totalIncome =
        values.invoiceIncome +
        values.installmentIncome;

      const totalExpense =
        values.salaryExpense +
        values.businessExpense;

      return {
        month,
        monthLabel: getMonthLabel(month),
        ...values,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      };
    },
  );
}

async function requireAdmin() {
  const session = await getSessionUser();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (session.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        {
          error:
            "Only admin can download profit and loss reports.",
        },
        {
          status: 403,
        },
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
const [
  students,
  invoices,
  installmentPlans,
  staffPayouts,
  teacherPayouts,
  businessExpenses,
] = await Promise.all([
  (async () => {
    const collection =
      await getCollection<StudentRecord>(
        COLLECTIONS.users,
      );

    return collection
      .find({
        role: "student",
      })
      .sort({
        name: 1,
      })
      .toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<FeeInvoice>(
        COLLECTIONS.feeInvoices,
      );

    return collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<FeeInstallmentPlan>(
        COLLECTIONS.feeInstallmentPlans,
      );

    return collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<StaffPayout>(
        COLLECTIONS.staffPayouts,
      );

    return collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();
  })(),

  (async () => {
    const collection =
      await getCollection<TeacherPayout>(
        COLLECTIONS.teacherPayouts,
      );

    return collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();
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
    const incomeEntries: IncomeEntry[] = [];
    const salaryEntries: SalaryEntry[] = [];

    const seenIncomePayments = new Set<string>();
    const seenSalaryPayments = new Set<string>();

    const invoiceIdsWithInstallmentPayments = new Set(
      installmentPlans.flatMap((plan) => {
        if (!plan.invoiceId) {
          return [];
        }

        const hasPayment = plan.installments.some(
          (installment) =>
            installment.paidAmount > 0 ||
            (installment.transactions ?? []).some(
              (transaction) =>
                transaction.paidAmount > 0,
            ),
        );

        return hasPayment
          ? [plan.invoiceId]
          : [];
      }),
    );

    for (const plan of installmentPlans) {
      for (const installment of plan.installments ?? []) {
        const transactions =
          installment.transactions ?? [];

        if (transactions.length) {
          for (const transaction of transactions) {
            const amount = getPositiveAmount(
              transaction.paidAmount,
            );

            const paidDate = toDateOnly(
              transaction.paidDate,
            );

            if (
              !amount ||
              !paidDate ||
              !isWithinRange(
                paidDate,
                fromDate,
                toDate,
              )
            ) {
              continue;
            }

            const paymentKey = transaction.transactionId
              ? `transaction:${transaction.transactionId.toLowerCase()}:${paidDate}:${amount}`
              : `installment:${plan.id}:${installment.installmentNumber}:${transaction.recordedAt}:${amount}`;

            if (seenIncomePayments.has(paymentKey)) {
              continue;
            }

            seenIncomePayments.add(paymentKey);

            incomeEntries.push({
              source: "Installment",
              sourceId: plan.id,
              studentId: plan.studentId,
              studentName: plan.studentName,
              title:
                installment.installmentTitle ||
                `Installment ${installment.installmentNumber}`,
              amount,
              paidDate,
              paymentMode:
                transaction.paymentMode ||
                installment.paymentMode ||
                "—",
              transactionId:
                transaction.transactionId,
              receiptNumber:
                installment.receiptNumber,
            });
          }

          continue;
        }

        const amount = getPositiveAmount(
          installment.paidAmount,
        );

        const paidDate = getFallbackDate(
          installment.paidDate,
          plan.updatedAt,
          plan.createdAt,
        );

        if (
          !amount ||
          !paidDate ||
          !isWithinRange(
            paidDate,
            fromDate,
            toDate,
          )
        ) {
          continue;
        }

        const paymentKey =
          `installment:${plan.id}:${installment.installmentNumber}:${paidDate}:${amount}`;

        if (seenIncomePayments.has(paymentKey)) {
          continue;
        }

        seenIncomePayments.add(paymentKey);

        incomeEntries.push({
          source: "Installment",
          sourceId: plan.id,
          studentId: plan.studentId,
          studentName: plan.studentName,
          title:
            installment.installmentTitle ||
            `Installment ${installment.installmentNumber}`,
          amount,
          paidDate,
          paymentMode:
            installment.paymentMode || "—",
          receiptNumber:
            installment.receiptNumber,
        });
      }
    }

    for (const invoice of invoices) {
      if (
        invoiceIdsWithInstallmentPayments.has(
          invoice.id,
        )
      ) {
        continue;
      }

      const transactions =
        invoice.transactions ?? [];

      if (transactions.length) {
        for (const transaction of transactions) {
          const amount = getPositiveAmount(
            transaction.paidAmount,
          );

          const paidDate = toDateOnly(
            transaction.paidDate,
          );

          if (
            !amount ||
            !paidDate ||
            !isWithinRange(
              paidDate,
              fromDate,
              toDate,
            )
          ) {
            continue;
          }

          const paymentKey = transaction.transactionId
            ? `transaction:${transaction.transactionId.toLowerCase()}:${paidDate}:${amount}`
            : `invoice:${invoice.id}:${transaction.recordedAt}:${amount}`;

          if (seenIncomePayments.has(paymentKey)) {
            continue;
          }

          seenIncomePayments.add(paymentKey);

          incomeEntries.push({
            source: "Invoice",
            sourceId: invoice.id,
            studentId: invoice.studentId,
            studentName: invoice.studentName,
            title: invoice.title,
            amount,
            paidDate,
            paymentMode:
              transaction.paymentMode ||
              invoice.paymentMode ||
              "—",
            transactionId:
              transaction.transactionId,
            receiptNumber:
              invoice.receiptNo,
          });
        }

        continue;
      }

      const amount = getPositiveAmount(
        invoice.paidAmount,
      );

      const paidDate = getFallbackDate(
        invoice.updatedAt,
        invoice.createdAt,
      );

      if (
        !amount ||
        !paidDate ||
        !isWithinRange(
          paidDate,
          fromDate,
          toDate,
        )
      ) {
        continue;
      }

      const paymentKey =
        `invoice:${invoice.id}:${paidDate}:${amount}`;

      if (seenIncomePayments.has(paymentKey)) {
        continue;
      }

      seenIncomePayments.add(paymentKey);

      incomeEntries.push({
        source: "Invoice",
        sourceId: invoice.id,
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        title: invoice.title,
        amount,
        paidDate,
        paymentMode:
          invoice.paymentMode || "—",
        receiptNumber:
          invoice.receiptNo,
      });
    }

    const unifiedStaffMonthKeys = new Set<string>();

    for (const payout of staffPayouts) {
      unifiedStaffMonthKeys.add(
        `${payout.staffId}:${payout.month}`,
      );

      const transactions =
        payout.transactions ?? [];

      if (transactions.length) {
        for (const transaction of transactions) {
          const amount = getPositiveAmount(
            transaction.paidAmount,
          );

          const paidDate = toDateOnly(
            transaction.paidDate,
          );

          if (
            !amount ||
            !paidDate ||
            !isWithinRange(
              paidDate,
              fromDate,
              toDate,
            )
          ) {
            continue;
          }

          const paymentKey = transaction.transactionId
            ? `salary:${transaction.transactionId.toLowerCase()}:${paidDate}:${amount}`
            : `salary:${payout.id}:${transaction.recordedAt}:${amount}`;

          if (seenSalaryPayments.has(paymentKey)) {
            continue;
          }

          seenSalaryPayments.add(paymentKey);

          salaryEntries.push({
            staffId: payout.staffId,
            staffName: payout.staffName,
            month: payout.month,
            title: payout.title,
            paidAmount: amount,
            paidDate,
            paymentMode:
              transaction.paymentMode ||
              payout.paymentMode ||
              "—",
            transactionId:
              transaction.transactionId,
          });
        }

        continue;
      }

      const amount = getPositiveAmount(
        payout.paidAmount,
      );

      const paidDate = getFallbackDate(
        payout.paidDate,
        payout.updatedAt,
        payout.createdAt,
      );

      if (
        !amount ||
        !paidDate ||
        !isWithinRange(
          paidDate,
          fromDate,
          toDate,
        )
      ) {
        continue;
      }

      const paymentKey =
        `salary:${payout.id}:${paidDate}:${amount}`;

      if (seenSalaryPayments.has(paymentKey)) {
        continue;
      }

      seenSalaryPayments.add(paymentKey);

      salaryEntries.push({
        staffId: payout.staffId,
        staffName: payout.staffName,
        month: payout.month,
        title: payout.title,
        paidAmount: amount,
        paidDate,
        paymentMode:
          payout.paymentMode || "—",
        transactionId:
          payout.transactionId,
      });
    }

    for (const payout of teacherPayouts) {
      const staffMonthKey =
        `${payout.teacherId}:${payout.month}`;

      if (
        unifiedStaffMonthKeys.has(staffMonthKey)
      ) {
        continue;
      }

      const amount = getPositiveAmount(
        payout.paidAmount,
      );

      const paidDate = getFallbackDate(
        payout.payoutDate,
        payout.updatedAt,
        payout.createdAt,
        `${payout.month}-01`,
      );

      if (
        !amount ||
        !paidDate ||
        !isWithinRange(
          paidDate,
          fromDate,
          toDate,
        )
      ) {
        continue;
      }

      const paymentKey =
        `teacher-salary:${payout.id}:${paidDate}:${amount}`;

      if (seenSalaryPayments.has(paymentKey)) {
        continue;
      }

      seenSalaryPayments.add(paymentKey);

      salaryEntries.push({
        staffId: payout.teacherId,
        staffName: payout.teacherId,
        month: payout.month,
        title: "Teacher Payout",
        paidAmount: amount,
        paidDate,
        paymentMode: "—",
      });
    }

    const monthlyRows = createMonthlyRows(
      fromDate,
      toDate,
      incomeEntries,
      salaryEntries,
      businessExpenses,
    );

    const totalInvoiceIncome =
      incomeEntries
        .filter(
          (entry) =>
            entry.source === "Invoice",
        )
        .reduce(
          (total, entry) =>
            total + entry.amount,
          0,
        );

    const totalInstallmentIncome =
      incomeEntries
        .filter(
          (entry) =>
            entry.source === "Installment",
        )
        .reduce(
          (total, entry) =>
            total + entry.amount,
          0,
        );

    const totalIncome =
      totalInvoiceIncome +
      totalInstallmentIncome;

    const totalSalaryExpense =
      salaryEntries.reduce(
        (total, entry) =>
          total + entry.paidAmount,
        0,
      );

    const totalBusinessExpense =
      businessExpenses.reduce(
        (total, expense) =>
          total + expense.amount,
        0,
      );

    const totalExpense =
      totalSalaryExpense +
      totalBusinessExpense;

    const netProfit =
      totalIncome - totalExpense;

    const profitMargin =
      totalIncome > 0
        ? (netProfit / totalIncome) * 100
        : 0;

    const invoiceIdsManagedByPlans = new Set(
      installmentPlans
        .map(
          (plan) =>
            plan.invoiceId?.trim(),
        )
        .filter(
          (invoiceId): invoiceId is string =>
            Boolean(invoiceId),
        ),
    );

    const pendingInvoices = invoices
      .filter(
        (invoice) =>
          !invoiceIdsManagedByPlans.has(
            invoice.id,
          ),
      )
      .map((invoice) => {
        const amount =
          Number(invoice.amount) || 0;

        const paidAmount =
          Number(invoice.paidAmount) || 0;

        return {
          studentId: invoice.studentId,
          studentName: invoice.studentName,
          title: invoice.title,
          dueDate: invoice.dueDate,
          totalAmount: amount,
          paidAmount,
          pendingAmount: Math.max(
            0,
            amount - paidAmount,
          ),
          status: invoice.status,
          source: "Invoice",
        };
      })
      .filter(
        (record) =>
          record.pendingAmount > 0,
      );

    const pendingInstallments =
      installmentPlans.flatMap((plan) =>
        plan.status === "cancelled"
          ? []
          : plan.installments
              .map((installment) => ({
                studentId: plan.studentId,
                studentName:
                  plan.studentName,
                title:
                  installment.installmentTitle ||
                  `Installment ${installment.installmentNumber}`,
                dueDate:
                  installment.dueDate,
                totalAmount:
                  installment.amount,
                paidAmount:
                  installment.paidAmount,
                pendingAmount:
                  installment.pendingAmount,
                status:
                  installment.status,
                source: "Installment",
              }))
              .filter(
                (record) =>
                  record.pendingAmount > 0,
              ),
      );

    const workbook = new Workbook();

    workbook.creator = "SmartIQ Institute";
    workbook.lastModifiedBy =
      authorization.session?.name ||
      "SmartIQ Institute Admin";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = "SmartIQ Institute";
    workbook.subject =
      "Profit and Loss Report";

    /*
     * Dashboard
     */
    const dashboardSheet =
      workbook.addWorksheet("Dashboard", {
        views: [
          {
            state: "frozen",
            ySplit: 3,
          },
        ],
      });

    formatWorksheetTitle(
      dashboardSheet,
      "SmartIQ Institute Finance Dashboard",
      `Reporting period: ${fromDate} to ${toDate}`,
      8,
    );

    dashboardSheet.columns = [
      { width: 24 },
      { width: 18 },
      { width: 4 },
      { width: 24 },
      { width: 18 },
      { width: 4 },
      { width: 24 },
      { width: 18 },
    ];

    const dashboardCards = [
      {
        label: "Total Income",
        value: totalIncome,
        fill: LIGHT_GREEN,
      },
      {
        label: "Total Expenses",
        value: totalExpense,
        fill: LIGHT_RED,
      },
      {
        label:
          netProfit >= 0
            ? "Net Profit"
            : "Net Loss",
        value: netProfit,
        fill:
          netProfit >= 0
            ? LIGHT_GREEN
            : LIGHT_RED,
      },
      {
        label: "Profit Margin",
        value: profitMargin / 100,
        fill: LIGHT_BLUE,
        percentage: true,
      },
      {
        label: "Invoice Income",
        value: totalInvoiceIncome,
        fill: LIGHT_BLUE,
      },
      {
        label: "Installment Income",
        value: totalInstallmentIncome,
        fill: LIGHT_BLUE,
      },
      {
        label: "Salary Expenses",
        value: totalSalaryExpense,
        fill: LIGHT_AMBER,
      },
      {
        label: "Business Expenses",
        value: totalBusinessExpense,
        fill: LIGHT_AMBER,
      },
    ];

    dashboardCards.forEach(
      (card, index) => {
        const cardRow =
          index < 4 ? 4 : 8;

        const cardColumn =
          (index % 4) * 2 + 1;

        dashboardSheet.mergeCells(
          cardRow,
          cardColumn,
          cardRow,
          cardColumn + 1,
        );

        dashboardSheet.mergeCells(
          cardRow + 1,
          cardColumn,
          cardRow + 2,
          cardColumn + 1,
        );

        const labelCell =
          dashboardSheet.getCell(
            cardRow,
            cardColumn,
          );

        labelCell.value = card.label;
        labelCell.font = {
          bold: true,
          size: 10,
          color: {
            argb: "536278",
          },
        };
        labelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: card.fill,
          },
        };
        labelCell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        const valueCell =
          dashboardSheet.getCell(
            cardRow + 1,
            cardColumn,
          );

        valueCell.value = card.value;
        valueCell.font = {
          bold: true,
          size: 18,
          color: {
            argb:
              card.label === "Net Loss"
                ? "C62828"
                : "0A1637",
          },
        };
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: card.fill,
          },
        };
        valueCell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        valueCell.numFmt =
          card.percentage
            ? "0.00%"
            : '₹#,##0.00;[Red]-₹#,##0.00';

        for (
          let row = cardRow;
          row <= cardRow + 2;
          row += 1
        ) {
          for (
            let column = cardColumn;
            column <= cardColumn + 1;
            column += 1
          ) {
            dashboardSheet.getCell(
              row,
              column,
            ).border = {
              top: {
                style: "thin",
                color: {
                  argb: BORDER_COLOR,
                },
              },
              left: {
                style: "thin",
                color: {
                  argb: BORDER_COLOR,
                },
              },
              bottom: {
                style: "thin",
                color: {
                  argb: BORDER_COLOR,
                },
              },
              right: {
                style: "thin",
                color: {
                  argb: BORDER_COLOR,
                },
              },
            };
          }
        }
      },
    );

    dashboardSheet.getCell("A12").value =
      "Monthly Profit & Loss";

    dashboardSheet.getCell("A12").font = {
      bold: true,
      size: 14,
      color: {
        argb: "0A1637",
      },
    };

    dashboardSheet.addRow([]);

    dashboardSheet.addRow([
      "Month",
      "Income",
      "Expenses",
      "Net Profit / Loss",
    ]);

    styleHeaderRow(dashboardSheet, 14);

    for (const row of monthlyRows) {
      dashboardSheet.addRow([
        row.monthLabel,
        row.totalIncome,
        row.totalExpense,
        row.netProfit,
      ]);
    }

    styleDataRows(
      dashboardSheet,
      15,
      dashboardSheet.rowCount,
    );

    setCurrencyFormat(
      dashboardSheet,
      [2, 3, 4],
      15,
      dashboardSheet.rowCount,
    );

    /*
     * Profit Report
     */
    const profitSheet =
      workbook.addWorksheet("Profit Report", {
        views: [
          {
            state: "frozen",
            ySplit: 3,
          },
        ],
      });

    formatWorksheetTitle(
      profitSheet,
      "Profit & Loss Report",
      `Generated on ${new Date().toLocaleString("en-IN")}`,
      9,
    );

    profitSheet.columns = [
      { header: "Month", width: 16 },
      {
        header: "Invoice Income",
        width: 18,
      },
      {
        header: "Installment Income",
        width: 20,
      },
      {
        header: "Total Income",
        width: 18,
      },
      {
        header: "Salary Expense",
        width: 18,
      },
      {
        header: "Business Expense",
        width: 20,
      },
      {
        header: "Total Expenses",
        width: 18,
      },
      {
        header: "Net Profit / Loss",
        width: 20,
      },
      {
        header: "Status",
        width: 14,
      },
    ];

    profitSheet.addRow([
      "Month",
      "Invoice Income",
      "Installment Income",
      "Total Income",
      "Salary Expense",
      "Business Expense",
      "Total Expenses",
      "Net Profit / Loss",
      "Status",
    ]);

    styleHeaderRow(profitSheet, 3);

    for (const row of monthlyRows) {
      profitSheet.addRow([
        row.monthLabel,
        row.invoiceIncome,
        row.installmentIncome,
        row.totalIncome,
        row.salaryExpense,
        row.businessExpense,
        row.totalExpense,
        row.netProfit,
        row.netProfit >= 0
          ? "Profit"
          : "Loss",
      ]);
    }

    profitSheet.addRow([
      "Grand Total",
      totalInvoiceIncome,
      totalInstallmentIncome,
      totalIncome,
      totalSalaryExpense,
      totalBusinessExpense,
      totalExpense,
      netProfit,
      netProfit >= 0
        ? "Profit"
        : "Loss",
    ]);

    const profitTotalRow =
      profitSheet.rowCount;

    profitSheet.getRow(profitTotalRow).font = {
      bold: true,
    };

    profitSheet.getRow(profitTotalRow).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb:
          netProfit >= 0
            ? LIGHT_GREEN
            : LIGHT_RED,
      },
    };

    styleDataRows(
      profitSheet,
      4,
      profitSheet.rowCount,
    );

    setCurrencyFormat(
      profitSheet,
      [2, 3, 4, 5, 6, 7, 8],
      4,
      profitSheet.rowCount,
    );

    /*
     * Monthly Income
     */
    const monthlyIncomeSheet =
      workbook.addWorksheet("Monthly Income");

    formatWorksheetTitle(
      monthlyIncomeSheet,
      "Monthly Income",
      `Actual received payments from ${fromDate} to ${toDate}`,
      5,
    );

    monthlyIncomeSheet.columns = [
      { width: 16 },
      { width: 20 },
      { width: 22 },
      { width: 18 },
      { width: 16 },
    ];

    monthlyIncomeSheet.addRow([
      "Month",
      "Invoice Income",
      "Installment Income",
      "Total Income",
      "Payment Count",
    ]);

    styleHeaderRow(
      monthlyIncomeSheet,
      3,
    );

    for (const row of monthlyRows) {
      monthlyIncomeSheet.addRow([
        row.monthLabel,
        row.invoiceIncome,
        row.installmentIncome,
        row.totalIncome,
        incomeEntries.filter(
          (entry) =>
            getMonthKey(entry.paidDate) ===
            row.month,
        ).length,
      ]);
    }

    styleDataRows(
      monthlyIncomeSheet,
      4,
      monthlyIncomeSheet.rowCount,
    );

    setCurrencyFormat(
      monthlyIncomeSheet,
      [2, 3, 4],
      4,
      monthlyIncomeSheet.rowCount,
    );

    /*
     * Monthly Expenses
     */
    const monthlyExpenseSheet =
      workbook.addWorksheet(
        "Monthly Expenses",
      );

    formatWorksheetTitle(
      monthlyExpenseSheet,
      "Monthly Expenses",
      `Paid salary and business expenses from ${fromDate} to ${toDate}`,
      5,
    );

    monthlyExpenseSheet.columns = [
      { width: 16 },
      { width: 20 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
    ];

    monthlyExpenseSheet.addRow([
      "Month",
      "Salary Expenses",
      "Business Expenses",
      "Total Expenses",
      "Expense Count",
    ]);

    styleHeaderRow(
      monthlyExpenseSheet,
      3,
    );

    for (const row of monthlyRows) {
      monthlyExpenseSheet.addRow([
        row.monthLabel,
        row.salaryExpense,
        row.businessExpense,
        row.totalExpense,
        businessExpenses.filter(
          (expense) =>
            getMonthKey(
              expense.expenseDate,
            ) === row.month,
        ).length,
      ]);
    }

    styleDataRows(
      monthlyExpenseSheet,
      4,
      monthlyExpenseSheet.rowCount,
    );

    setCurrencyFormat(
      monthlyExpenseSheet,
      [2, 3, 4],
      4,
      monthlyExpenseSheet.rowCount,
    );

    /*
     * Daily Collection
     */
    const collectionSheet =
      workbook.addWorksheet(
        "Daily Collection",
      );

    formatWorksheetTitle(
      collectionSheet,
      "Daily Collection",
      "Actual invoice and installment payments received",
      10,
    );

    collectionSheet.columns = [
      { width: 14 },
      { width: 16 },
      { width: 18 },
      { width: 24 },
      { width: 28 },
      { width: 16 },
      { width: 18 },
      { width: 24 },
      { width: 18 },
      { width: 22 },
    ];

    collectionSheet.addRow([
      "Paid Date",
      "Source",
      "Student ID",
      "Student Name",
      "Title",
      "Amount",
      "Payment Mode",
      "Transaction ID",
      "Receipt Number",
      "Source Record ID",
    ]);

    styleHeaderRow(collectionSheet, 3);

    incomeEntries
      .sort(
        (left, right) =>
          right.paidDate.localeCompare(
            left.paidDate,
          ),
      )
      .forEach((entry) => {
        collectionSheet.addRow([
          entry.paidDate,
          entry.source,
          entry.studentId,
          entry.studentName,
          entry.title,
          entry.amount,
          entry.paymentMode,
          entry.transactionId ?? "",
          entry.receiptNumber ?? "",
          entry.sourceId,
        ]);
      });

    styleDataRows(
      collectionSheet,
      4,
      collectionSheet.rowCount,
    );

    setCurrencyFormat(
      collectionSheet,
      [6],
      4,
      collectionSheet.rowCount,
    );

    collectionSheet.autoFilter = {
      from: "A3",
      to: "J3",
    };

    /*
     * Business expense detail
     */
    const expenseSheet =
      workbook.addWorksheet(
        "Business Expenses",
      );

    formatWorksheetTitle(
      expenseSheet,
      "Business Expense Register",
      `Expense records from ${fromDate} to ${toDate}`,
      10,
    );

    expenseSheet.columns = [
      { width: 14 },
      { width: 26 },
      { width: 20 },
      { width: 16 },
      { width: 18 },
      { width: 24 },
      { width: 22 },
      { width: 30 },
      { width: 22 },
      { width: 20 },
    ];

    expenseSheet.addRow([
      "Expense Date",
      "Title",
      "Category",
      "Amount",
      "Payment Mode",
      "Transaction ID",
      "Vendor",
      "Notes",
      "Recorded By",
      "Expense ID",
    ]);

    styleHeaderRow(expenseSheet, 3);

    businessExpenses.forEach((expense) => {
      expenseSheet.addRow([
        expense.expenseDate,
        expense.title,
        expense.category,
        expense.amount,
        expense.paymentMode,
        expense.transactionId ?? "",
        expense.vendor ?? "",
        expense.notes ?? "",
        expense.createdByName ??
          expense.createdBy,
        expense.id,
      ]);
    });

    styleDataRows(
      expenseSheet,
      4,
      expenseSheet.rowCount,
    );

    setCurrencyFormat(
      expenseSheet,
      [4],
      4,
      expenseSheet.rowCount,
    );

    expenseSheet.autoFilter = {
      from: "A3",
      to: "J3",
    };

    /*
     * Pending Fee Report
     */
    const pendingSheet =
      workbook.addWorksheet(
        "Pending Fee Report",
      );

    formatWorksheetTitle(
      pendingSheet,
      "Pending Fee Report",
      "Current outstanding invoice and installment balances",
      10,
    );

    pendingSheet.columns = [
      { width: 16 },
      { width: 24 },
      { width: 18 },
      { width: 28 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 18 },
      { width: 14 },
      { width: 16 },
    ];

    pendingSheet.addRow([
      "Source",
      "Student Name",
      "Student ID",
      "Title",
      "Due Date",
      "Total Amount",
      "Paid Amount",
      "Pending Amount",
      "Status",
      "Overdue",
    ]);

    styleHeaderRow(pendingSheet, 3);

    [
      ...pendingInvoices,
      ...pendingInstallments,
    ]
      .sort(
        (left, right) =>
          left.dueDate.localeCompare(
            right.dueDate,
          ),
      )
      .forEach((record) => {
        pendingSheet.addRow([
          record.source,
          record.studentName,
          record.studentId,
          record.title,
          record.dueDate,
          record.totalAmount,
          record.paidAmount,
          record.pendingAmount,
          record.status,
          record.dueDate < getToday()
            ? "Yes"
            : "No",
        ]);
      });

    styleDataRows(
      pendingSheet,
      4,
      pendingSheet.rowCount,
    );

    setCurrencyFormat(
      pendingSheet,
      [6, 7, 8],
      4,
      pendingSheet.rowCount,
    );

    pendingSheet.autoFilter = {
      from: "A3",
      to: "J3",
    };

    /*
     * Faculty Salary
     */
    const salarySheet =
      workbook.addWorksheet(
        "Faculty Salary",
      );

    formatWorksheetTitle(
      salarySheet,
      "Faculty and Staff Salary",
      `Actual salary payments from ${fromDate} to ${toDate}`,
      8,
    );

    salarySheet.columns = [
      { width: 18 },
      { width: 24 },
      { width: 16 },
      { width: 24 },
      { width: 16 },
      { width: 14 },
      { width: 18 },
      { width: 24 },
    ];

    salarySheet.addRow([
      "Staff ID",
      "Staff Name",
      "Salary Month",
      "Title",
      "Paid Amount",
      "Paid Date",
      "Payment Mode",
      "Transaction ID",
    ]);

    styleHeaderRow(salarySheet, 3);

    salaryEntries.forEach((entry) => {
      salarySheet.addRow([
        entry.staffId,
        entry.staffName,
        entry.month,
        entry.title,
        entry.paidAmount,
        entry.paidDate,
        entry.paymentMode,
        entry.transactionId ?? "",
      ]);
    });

    styleDataRows(
      salarySheet,
      4,
      salarySheet.rowCount,
    );

    setCurrencyFormat(
      salarySheet,
      [5],
      4,
      salarySheet.rowCount,
    );

    /*
     * Installment Tracker
     */
    const installmentSheet =
      workbook.addWorksheet(
        "Installment Tracker",
      );

    formatWorksheetTitle(
      installmentSheet,
      "Student Installment Tracker",
      "All student installment-plan records",
      14,
    );

    installmentSheet.columns = [
      { width: 20 },
      { width: 18 },
      { width: 24 },
      { width: 28 },
      { width: 18 },
      { width: 18 },
      { width: 24 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 14 },
      { width: 16 },
      { width: 20 },
      { width: 22 },
    ];

    installmentSheet.addRow([
      "Plan ID",
      "Student ID",
      "Student Name",
      "Fee Plan",
      "Course",
      "Academic Year",
      "Installment Title",
      "Installment No.",
      "Amount",
      "Paid Amount",
      "Pending",
      "Due Date",
      "Status",
      "Receipt Number",
    ]);

    styleHeaderRow(
      installmentSheet,
      3,
    );

    installmentPlans.forEach((plan) => {
      plan.installments.forEach(
        (installment) => {
          installmentSheet.addRow([
            plan.id,
            plan.studentId,
            plan.studentName,
            plan.title,
            plan.courseName ?? "",
            plan.academicYear ?? "",
            installment.installmentTitle ||
              `Installment ${installment.installmentNumber}`,
            installment.installmentNumber,
            installment.amount,
            installment.paidAmount,
            installment.pendingAmount,
            installment.dueDate,
            installment.status,
            installment.receiptNumber ?? "",
          ]);
        },
      );
    });

    styleDataRows(
      installmentSheet,
      4,
      installmentSheet.rowCount,
    );

    setCurrencyFormat(
      installmentSheet,
      [9, 10, 11],
      4,
      installmentSheet.rowCount,
    );

    installmentSheet.autoFilter = {
      from: "A3",
      to: "N3",
    };

    /*
     * Fee Tracker
     */
    const feeSheet =
      workbook.addWorksheet("Fee Tracker");

    formatWorksheetTitle(
      feeSheet,
      "Invoice Fee Tracker",
      "All fee invoices and outstanding balances",
      13,
    );

    feeSheet.columns = [
      { width: 22 },
      { width: 18 },
      { width: 24 },
      { width: 28 },
      { width: 22 },
      { width: 18 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 14 },
      { width: 16 },
      { width: 20 },
      { width: 20 },
    ];

    feeSheet.addRow([
      "Invoice ID",
      "Student ID",
      "Student Name",
      "Title",
      "Course",
      "Academic Year",
      "Amount",
      "Paid Amount",
      "Pending Amount",
      "Status",
      "Due Date",
      "Receipt Number",
      "Payment Mode",
    ]);

    styleHeaderRow(feeSheet, 3);

    invoices.forEach((invoice) => {
      const amount =
        Number(invoice.amount) || 0;

      const paidAmount =
        Number(invoice.paidAmount) || 0;

      feeSheet.addRow([
        invoice.id,
        invoice.studentId,
        invoice.studentName,
        invoice.title,
        invoice.classCourse ?? "",
        invoice.academicYear ?? "",
        amount,
        paidAmount,
        Math.max(
          0,
          amount - paidAmount,
        ),
        invoice.status,
        invoice.dueDate,
        invoice.receiptNo ?? "",
        invoice.paymentMode ?? "",
      ]);
    });

    styleDataRows(
      feeSheet,
      4,
      feeSheet.rowCount,
    );

    setCurrencyFormat(
      feeSheet,
      [7, 8, 9],
      4,
      feeSheet.rowCount,
    );

    feeSheet.autoFilter = {
      from: "A3",
      to: "M3",
    };

    /*
     * Student Master
     */
    const studentSheet =
      workbook.addWorksheet(
        "Student Master",
      );

    formatWorksheetTitle(
      studentSheet,
      "Student Master",
      "Student account and course information",
      11,
    );

    studentSheet.columns = [
      { width: 18 },
      { width: 20 },
      { width: 26 },
      { width: 30 },
      { width: 18 },
      { width: 24 },
      { width: 24 },
      { width: 18 },
      { width: 14 },
      { width: 16 },
      { width: 18 },
    ];

    studentSheet.addRow([
      "Student ID",
      "Admission No.",
      "Student Name",
      "Email",
      "Mobile",
      "Parent Name",
      "Parent Mobile",
      "Course / Program",
      "Status",
      "Created Date",
      "Pending Fee",
    ]);

    styleHeaderRow(studentSheet, 3);

    const pendingByStudent = new Map<
      string,
      number
    >();

    for (const record of [
      ...pendingInvoices,
      ...pendingInstallments,
    ]) {
      pendingByStudent.set(
        record.studentId,
        (pendingByStudent.get(
          record.studentId,
        ) ?? 0) +
          record.pendingAmount,
      );
    }

    students.forEach((student) => {
      studentSheet.addRow([
        student.id,
        student.admissionNo ??
          student.admissionNumber ??
          "",
        student.name,
        student.email ?? "",
        student.mobile ?? "",
        student.profile?.parentName ?? "",
        student.parentMobile ??
          student.profile?.parentMobile ??
          "",
        student.program ??
          student.profile
            ?.courseWantedTitle ??
          student.profile?.courseWanted ??
          "",
        student.status ?? "active",
        toDateOnly(student.createdAt) ?? "",
        pendingByStudent.get(
          student.id,
        ) ?? 0,
      ]);
    });

    styleDataRows(
      studentSheet,
      4,
      studentSheet.rowCount,
    );

    setCurrencyFormat(
      studentSheet,
      [11],
      4,
      studentSheet.rowCount,
    );

    studentSheet.autoFilter = {
      from: "A3",
      to: "K3",
    };

    /*
     * Workbook-wide formatting
     */
    workbook.eachSheet((worksheet) => {
      worksheet.properties.defaultRowHeight =
        19;

      worksheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      };

      worksheet.headerFooter.oddFooter =
        `SmartIQ Institute Finance Report | Generated by ${authorization.session?.name ?? "Admin"} | Page &P of &N`;
    });

    const excelBuffer =
      await workbook.xlsx.writeBuffer();

    const fileName =
      `Smart-Tutors-Profit-Loss-${fromDate}-to-${toDate}.xlsx`;

    return new NextResponse(
      new Uint8Array(excelBuffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition":
            `attachment; filename="${fileName}"`,
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Export finance Excel error:",
      error,
    );

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to generate the Excel finance report.",
      },
      {
        status: 500,
      },
    );
  }
}