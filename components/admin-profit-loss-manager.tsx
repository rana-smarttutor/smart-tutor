"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import type {
  BusinessExpense,
  BusinessExpenseCategory,
  PaymentMode,
  ProfitLossSummary,
} from "@/lib/types";

type ExpenseForm = {
  title: string;
  category: BusinessExpenseCategory;
  amount: string;
  expenseDate: string;
  paymentMode: PaymentMode;
  transactionId: string;
  vendor: string;
  notes: string;
  receiptUrl: string;
};

type ExpenseListResponse = {
  expenses?: BusinessExpense[];
  summary?: {
    count: number;
    totalAmount: number;
  };
  error?: string;
};

type SummaryResponse = {
  summary?: ProfitLossSummary;
  error?: string;
};

const EXPENSE_CATEGORIES: BusinessExpenseCategory[] = [
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

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function getToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

function getCurrentYearStart() {
  return `${getToday().slice(0, 4)}-01-01`;
}

function createEmptyExpenseForm(): ExpenseForm {
  return {
    title: "",
    category: "Other",
    amount: "",
    expenseDate: getToday(),
    paymentMode: "Cash",
    transactionId: "",
    vendor: "",
    notes: "",
    receiptUrl: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getProfitClass(value: number) {
  return value >= 0
    ? "text-emerald-700"
    : "text-rose-700";
}

function getProfitBackground(value: number) {
  return value >= 0
    ? "border-emerald-200 bg-emerald-50"
    : "border-rose-200 bg-rose-50";
}

function getExpenseCategoryClass(
  category: BusinessExpenseCategory,
) {
  if (
    category === "Rent" ||
    category === "Electricity" ||
    category === "Internet"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (
    category === "Marketing" ||
    category === "Software"
  ) {
    return "bg-violet-100 text-violet-700";
  }

  if (
    category === "Taxes" ||
    category === "Maintenance"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getDownloadFileName(
  contentDisposition: string | null,
  fallbackName: string,
) {
  if (!contentDisposition) {
    return fallbackName;
  }

  const utfMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const normalMatch = contentDisposition.match(
    /filename="?([^"]+)"?/i,
  );

  return normalMatch?.[1] || fallbackName;
}

export function AdminProfitLossManager() {
  const [fromDate, setFromDate] = useState(
    getCurrentYearStart(),
  );
  const [toDate, setToDate] = useState(getToday());

  const [summary, setSummary] =
    useState<ProfitLossSummary | null>(null);

  const [expenses, setExpenses] = useState<
    BusinessExpense[]
  >([]);

  const [expenseListSummary, setExpenseListSummary] =
    useState({
      count: 0,
      totalAmount: 0,
    });

  const [form, setForm] = useState<ExpenseForm>(
    createEmptyExpenseForm,
  );

  const [editingExpenseId, setEditingExpenseId] =
    useState<string | null>(null);

  const [showExpenseForm, setShowExpenseForm] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] =
    useState(false);

  const [deletingExpenseId, setDeletingExpenseId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("fromDate", fromDate);
    params.set("toDate", toDate);

    return params.toString();
  }, [fromDate, toDate]);

  const loadFinanceData = useCallback(async () => {
    if (!fromDate || !toDate) {
      return;
    }

    if (fromDate > toDate) {
      setError(
        "From date cannot be after the to date.",
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [summaryResponse, expenseResponse] =
        await Promise.all([
          fetch(
            `/api/admin/finance/summary?${queryString}`,
            {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
            },
          ),

          fetch(
            `/api/admin/finance/expenses?${queryString}&limit=2000`,
            {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
            },
          ),
        ]);

      const summaryPayload =
        (await summaryResponse.json()) as SummaryResponse;

      const expensePayload =
        (await expenseResponse.json()) as ExpenseListResponse;

      if (!summaryResponse.ok) {
        throw new Error(
          summaryPayload.error ??
            "Unable to load profit and loss summary.",
        );
      }

      if (!expenseResponse.ok) {
        throw new Error(
          expensePayload.error ??
            "Unable to load business expenses.",
        );
      }

      setSummary(summaryPayload.summary ?? null);
      setExpenses(expensePayload.expenses ?? []);

      setExpenseListSummary(
        expensePayload.summary ?? {
          count: 0,
          totalAmount: 0,
        },
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load finance records.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, queryString, toDate]);

  useEffect(() => {
    void loadFinanceData();
  }, [loadFinanceData]);

  function updateForm<K extends keyof ExpenseForm>(
    field: K,
    value: ExpenseForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setEditingExpenseId(null);
    setForm(createEmptyExpenseForm());
    setShowExpenseForm(true);
    setMessage("");
    setError("");
  }

  function openEditForm(expense: BusinessExpense) {
    setEditingExpenseId(expense.id);

    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate,
      paymentMode: expense.paymentMode,
      transactionId: expense.transactionId ?? "",
      vendor: expense.vendor ?? "",
      notes: expense.notes ?? "",
      receiptUrl: expense.receiptUrl ?? "",
    });

    setShowExpenseForm(true);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeExpenseForm() {
    setEditingExpenseId(null);
    setForm(createEmptyExpenseForm());
    setShowExpenseForm(false);
    setError("");
  }

  async function saveExpense() {
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Expense title is required.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Expense amount must be greater than zero.",
      );
      return;
    }

    if (!form.expenseDate) {
      setError("Expense date is required.");
      return;
    }

    if (
      form.paymentMode !== "Cash" &&
      !form.transactionId.trim()
    ) {
      setError(
        "Transaction ID or payment reference is required for non-cash expenses.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = Boolean(editingExpenseId);

      const response = await fetch(
        isEditing
          ? `/api/admin/finance/expenses/${editingExpenseId}`
          : "/api/admin/finance/expenses",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            category: form.category,
            amount,
            expenseDate: form.expenseDate,
            paymentMode: form.paymentMode,
            transactionId:
              form.transactionId.trim(),
            vendor: form.vendor.trim(),
            notes: form.notes.trim(),
            receiptUrl: form.receiptUrl.trim(),
          }),
        },
      );

      const payload = (await response.json()) as {
        expense?: BusinessExpense;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.expense) {
        throw new Error(
          payload.error ??
            "Unable to save business expense.",
        );
      }

      setMessage(
        payload.message ??
          (isEditing
            ? "Business expense updated."
            : "Business expense added."),
      );

      setEditingExpenseId(null);
      setForm(createEmptyExpenseForm());
      setShowExpenseForm(false);

      await loadFinanceData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save business expense.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteExpense(
    expense: BusinessExpense,
  ) {
    const confirmed = window.confirm(
      `Delete the expense "${expense.title}" for ${formatCurrency(
        expense.amount,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingExpenseId(expense.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/finance/expenses/${expense.id}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error ??
            "Unable to delete business expense.",
        );
      }

      if (editingExpenseId === expense.id) {
        closeExpenseForm();
      }

      setMessage(
        payload.message ??
          "Business expense deleted.",
      );

      await loadFinanceData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete business expense.",
      );
    } finally {
      setDeletingExpenseId(null);
    }
  }

  async function downloadExcel() {
    if (fromDate > toDate) {
      setError(
        "From date cannot be after the to date.",
      );
      return;
    }

    setIsDownloading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/finance/export?${queryString}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };

        throw new Error(
          payload.error ??
            "Unable to download the Excel report.",
        );
      }

      const blob = await response.blob();

      const fallbackFileName =
        `Smart-Tutors-Profit-Loss-${fromDate}-to-${toDate}.xlsx`;

      const fileName = getDownloadFileName(
        response.headers.get("Content-Disposition"),
        fallbackFileName,
      );

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setMessage(
        "Excel finance report downloaded successfully.",
      );
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download the Excel report.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="min-w-0 space-y-6">
      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="section-label">
              Admin Finance
            </p>

            <h2 className="mt-2 text-2xl font-black text-[var(--color-heading)] sm:text-3xl">
              Profit & Loss
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Monitor actual fee collections, salary
              payments, business expenses, pending fees,
              and net profit.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadFinanceData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 text-sm font-black text-[var(--color-heading)] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>

            <button
              type="button"
              onClick={() => void downloadExcel()}
              disabled={isDownloading}
              className="action-button inline-flex items-center gap-2 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {isDownloading
                ? "Preparing Excel..."
                : "Download Excel"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
              From Date
            </span>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              className={fieldClass}
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
              To Date
            </span>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              className={fieldClass}
            />
          </label>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Report Period
            </p>

            <p className="mt-2 text-sm font-black text-[var(--color-heading)]">
              {formatDate(fromDate)}
            </p>

            <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
              to {formatDate(toDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Last Generated
            </p>

            <p className="mt-2 text-sm font-black text-[var(--color-heading)]">
              {summary?.generatedAt
                ? new Date(
                    summary.generatedAt,
                  ).toLocaleString("en-IN")
                : "Not generated"}
            </p>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      {showExpenseForm ? (
        <div className="surface rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">
                Business Expense
              </p>

              <h3 className="mt-2 text-xl font-black text-[var(--color-heading)]">
                {editingExpenseId
                  ? "Edit Expense"
                  : "Add New Expense"}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeExpenseForm}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)] transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Close expense form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Expense Title *
              </span>

              <input
                value={form.title}
                onChange={(event) =>
                  updateForm(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="e.g. Office rent"
                className={fieldClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Category *
              </span>

              <select
                value={form.category}
                onChange={(event) =>
                  updateForm(
                    "category",
                    event.target
                      .value as BusinessExpenseCategory,
                  )
                }
                className={fieldClass}
              >
                {EXPENSE_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Amount (₹) *
              </span>

              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  updateForm(
                    "amount",
                    event.target.value,
                  )
                }
                placeholder="0"
                className={fieldClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Expense Date *
              </span>

              <input
                type="date"
                value={form.expenseDate}
                onChange={(event) =>
                  updateForm(
                    "expenseDate",
                    event.target.value,
                  )
                }
                className={fieldClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Payment Mode *
              </span>

              <select
                value={form.paymentMode}
                onChange={(event) =>
                  updateForm(
                    "paymentMode",
                    event.target.value as PaymentMode,
                  )
                }
                className={fieldClass}
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Transaction ID
                {form.paymentMode !== "Cash"
                  ? " *"
                  : ""}
              </span>

              <input
                value={form.transactionId}
                onChange={(event) =>
                  updateForm(
                    "transactionId",
                    event.target.value,
                  )
                }
                placeholder={
                  form.paymentMode === "Cash"
                    ? "Not required for cash"
                    : "Payment reference"
                }
                className={fieldClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Vendor
              </span>

              <input
                value={form.vendor}
                onChange={(event) =>
                  updateForm(
                    "vendor",
                    event.target.value,
                  )
                }
                placeholder="Vendor or supplier"
                className={fieldClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Receipt URL
              </span>

              <input
                type="url"
                value={form.receiptUrl}
                onChange={(event) =>
                  updateForm(
                    "receiptUrl",
                    event.target.value,
                  )
                }
                placeholder="Optional receipt or invoice link"
                className={fieldClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                Notes
              </span>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateForm(
                    "notes",
                    event.target.value,
                  )
                }
                placeholder="Optional expense details"
                className={`${fieldClass} min-h-24 resize-y`}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveExpense()}
              className="action-button px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingExpenseId
                  ? "Update Expense"
                  : "Save Expense"}
            </button>

            <button
              type="button"
              onClick={closeExpenseForm}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-3 text-sm font-black text-[var(--color-heading)] transition hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {isLoading && !summary ? (
        <div className="surface flex min-h-56 items-center justify-center rounded-[2rem] p-6">
          <div className="text-center">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
              Loading profit and loss records...
            </p>
          </div>
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surface rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Total Income
                  </p>

                  <p className="mt-3 text-2xl font-black text-emerald-700">
                    {formatCurrency(
                      summary.income.total,
                    )}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">
                Invoice:{" "}
                {formatCurrency(
                  summary.income.invoicePayments,
                )}
              </p>

              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                Installments:{" "}
                {formatCurrency(
                  summary.income
                    .installmentPayments,
                )}
              </p>
            </div>

            <div className="surface rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Total Expenses
                  </p>

                  <p className="mt-3 text-2xl font-black text-rose-700">
                    {formatCurrency(
                      summary.expenses.total,
                    )}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">
                Staff:{" "}
                {formatCurrency(
                  summary.expenses.staffPayouts,
                )}
              </p>

              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                Business:{" "}
                {formatCurrency(
                  summary.expenses
                    .businessExpenses,
                )}
              </p>
            </div>

            <div
              className={`surface rounded-[1.5rem] border p-5 ${getProfitBackground(
                summary.netProfit,
              )}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {summary.netProfit >= 0
                      ? "Net Profit"
                      : "Net Loss"}
                  </p>

                  <p
                    className={`mt-3 text-2xl font-black ${getProfitClass(
                      summary.netProfit,
                    )}`}
                  >
                    {formatCurrency(
                      summary.netProfit,
                    )}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    summary.netProfit >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {summary.netProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">
                Profit margin:{" "}
                {summary.profitMargin.toFixed(2)}%
              </p>
            </div>

            <div className="surface rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Pending Fees
                  </p>

                  <p className="mt-3 text-2xl font-black text-amber-700">
                    {formatCurrency(
                      summary.pendingFees.total,
                    )}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <WalletCards className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">
                Invoices:{" "}
                {formatCurrency(
                  summary.pendingFees.invoices,
                )}
              </p>

              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                Installments:{" "}
                {formatCurrency(
                  summary.pendingFees.installments,
                )}
              </p>
            </div>
          </div>

          <div className="surface rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-label">
                  Monthly Report
                </p>

                <h3 className="mt-2 text-xl font-black text-[var(--color-heading)]">
                  Income, Expenses and Profit
                </h3>
              </div>

              <span className="pill w-fit">
                {summary.monthly.length} Month
                {summary.monthly.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <div className="mt-5 min-w-0 max-w-full overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[var(--color-panel)]">
                  <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    <th className="px-4 py-4">
                      Month
                    </th>
                    <th className="px-4 py-4">
                      Invoice Income
                    </th>
                    <th className="px-4 py-4">
                      Installment Income
                    </th>
                    <th className="px-4 py-4">
                      Total Income
                    </th>
                    <th className="px-4 py-4">
                      Staff Expense
                    </th>
                    <th className="px-4 py-4">
                      Business Expense
                    </th>
                    <th className="px-4 py-4">
                      Total Expense
                    </th>
                    <th className="px-4 py-4">
                      Profit / Loss
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.monthly.map((row) => (
                    <tr
                      key={row.month}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="px-4 py-4 font-black text-[var(--color-heading)]">
                        {row.monthLabel}
                      </td>

                      <td className="px-4 py-4 font-semibold text-emerald-700">
                        {formatCurrency(
                          row.invoiceIncome,
                        )}
                      </td>

                      <td className="px-4 py-4 font-semibold text-emerald-700">
                        {formatCurrency(
                          row.installmentIncome,
                        )}
                      </td>

                      <td className="px-4 py-4 font-black text-emerald-700">
                        {formatCurrency(
                          row.totalIncome,
                        )}
                      </td>

                      <td className="px-4 py-4 font-semibold text-rose-700">
                        {formatCurrency(
                          row.staffExpense,
                        )}
                      </td>

                      <td className="px-4 py-4 font-semibold text-rose-700">
                        {formatCurrency(
                          row.businessExpense,
                        )}
                      </td>

                      <td className="px-4 py-4 font-black text-rose-700">
                        {formatCurrency(
                          row.totalExpense,
                        )}
                      </td>

                      <td
                        className={`px-4 py-4 font-black ${getProfitClass(
                          row.netProfit,
                        )}`}
                      >
                        {formatCurrency(
                          row.netProfit,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">
              Expense Register
            </p>

            <h3 className="mt-2 text-xl font-black text-[var(--color-heading)]">
              Business Expenses
            </h3>

            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {expenseListSummary.count} records ·{" "}
              {formatCurrency(
                expenseListSummary.totalAmount,
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        {!isLoading && expenses.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
            <h4 className="font-black text-[var(--color-heading)]">
              No business expenses found
            </h4>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Add rent, electricity, marketing,
              software, travel, maintenance and other
              operating expenses.
            </p>
          </div>
        ) : null}

        {expenses.length > 0 ? (
          <div className="mt-5 min-w-0 max-w-full overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[var(--color-panel)]">
                <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  <th className="px-4 py-4">
                    Date
                  </th>
                  <th className="px-4 py-4">
                    Expense
                  </th>
                  <th className="px-4 py-4">
                    Category
                  </th>
                  <th className="px-4 py-4">
                    Vendor
                  </th>
                  <th className="px-4 py-4">
                    Amount
                  </th>
                  <th className="px-4 py-4">
                    Payment
                  </th>
                  <th className="px-4 py-4">
                    Reference
                  </th>
                  <th className="px-4 py-4">
                    Receipt
                  </th>
                  <th className="px-4 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-4 font-semibold text-[var(--color-muted)]">
                      {formatDate(
                        expense.expenseDate,
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black text-[var(--color-heading)]">
                        {expense.title}
                      </p>

                      {expense.notes ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-[var(--color-muted)]">
                          {expense.notes}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getExpenseCategoryClass(
                          expense.category,
                        )}`}
                      >
                        {expense.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[var(--color-muted)]">
                      {expense.vendor ?? "—"}
                    </td>

                    <td className="px-4 py-4 font-black text-rose-700">
                      {formatCurrency(
                        expense.amount,
                      )}
                    </td>

                    <td className="px-4 py-4 font-semibold text-[var(--color-heading)]">
                      {expense.paymentMode}
                    </td>

                    <td className="px-4 py-4 text-[var(--color-muted)]">
                      {expense.transactionId ?? "—"}
                    </td>

                    <td className="px-4 py-4">
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-black text-blue-600 hover:underline"
                        >
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-[var(--color-muted)]">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(expense)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                          aria-label={`Edit ${expense.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingExpenseId ===
                            expense.id
                          }
                          onClick={() =>
                            void deleteExpense(
                              expense,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete ${expense.title}`}
                        >
                          {deletingExpenseId ===
                          expense.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}