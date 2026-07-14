"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type { ManagedUser, Role, StaffPayrollProfile, TeacherPayout } from "@/lib/types";

type TeacherPayoutManagerProps = {
  role: Role;
  managedUsers: ManagedUser[];
};

type PayoutForm = {
  teacherId: string;
  month: string;
  basePay: string;
  perClassRate: string;
  completedClasses: string;
  bonus: string;
  deductions: string;
  paidAmount: string;
  payoutDate: string;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function createEmptyForm(): PayoutForm {
  return {
    teacherId: "",
    month: getCurrentMonth(),
    basePay: "0",
    perClassRate: "0",
    completedClasses: "0",
    bonus: "0",
    deductions: "0",
    paidAmount: "0",
    payoutDate: "",
  };
}

function toNumber(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatMonth(month: string) {
  const parsed = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatDate(date?: string) {
  if (!date) {
    return "";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getStatusClass(status: TeacherPayout["status"]) {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

async function getApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  return payload?.error ?? "Something went wrong. Please try again.";
}

export function TeacherPayoutManager({
  role,
  managedUsers,
}: TeacherPayoutManagerProps) {
  const isAdmin = role === "admin";
  const isEducator = role === "educator";

  const educators = useMemo(
    () =>
      managedUsers
        .filter(
          (user) =>
            user.role === "educator" &&
            user.status === "active" &&
            user.verified !== false,
        )
        .sort((left, right) => left.name.localeCompare(right.name)),
    [managedUsers],
  );

  const educatorNameById = useMemo(
    () =>
      new Map(
        educators.map((educator) => [educator.id, educator.name] as const),
      ),
    [educators],
  );

  const [payouts, setPayouts] = useState<TeacherPayout[]>([]);
  const [form, setForm] = useState<PayoutForm>(createEmptyForm);
  const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPayoutId, setDeletingPayoutId] = useState<string | null>(
    null,
  );

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePay = toNumber(form.basePay);
  const perClassRate = toNumber(form.perClassRate);
  const completedClasses = toNumber(form.completedClasses);
  const bonus = toNumber(form.bonus);
  const deductions = toNumber(form.deductions);
  const paidAmount = toNumber(form.paidAmount);

  const classEarnings = perClassRate * completedClasses;
  const totalPayable = Math.max(
    0,
    basePay + classEarnings + bonus - deductions,
  );
  const pendingAmount = Math.max(0, totalPayable - paidAmount);

  const totals = useMemo(
    () =>
      payouts.reduce(
        (summary, payout) => ({
          payable: summary.payable + payout.totalPayable,
          paid: summary.paid + payout.paidAmount,
          pending: summary.pending + payout.pendingAmount,
        }),
        {
          payable: 0,
          paid: 0,
          pending: 0,
        },
      ),
    [payouts],
  );

  const loadPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/teacher-payouts", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const payload = (await response.json()) as {
        payouts?: TeacherPayout[];
      };

      const nextPayouts = Array.isArray(payload.payouts)
        ? payload.payouts
        : [];

      setPayouts(
        nextPayouts.sort((left, right) =>
          right.month.localeCompare(left.month),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load teacher payout records.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin && !isEducator) {
      setIsLoading(false);
      return;
    }

    void loadPayouts();
  }, [isAdmin, isEducator, loadPayouts]);

  function updateForm<Key extends keyof PayoutForm>(
    key: Key,
    value: PayoutForm[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setEditingPayoutId(null);
    setForm(createEmptyForm());
    setError(null);
  }

  function startEditing(payout: TeacherPayout) {
    setEditingPayoutId(payout.id);
    setNotice(null);
    setError(null);

    setForm({
      teacherId: payout.teacherId,
      month: payout.month,
      basePay: String(payout.basePay),
      perClassRate: String(payout.perClassRate),
      completedClasses: String(payout.completedClasses),
      bonus: String(payout.bonus),
      deductions: String(payout.deductions),
      paidAmount: String(payout.paidAmount),
      payoutDate: payout.payoutDate ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function savePayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    setError(null);
    setNotice(null);

    if (!editingPayoutId && !form.teacherId) {
      setError("Choose an educator before creating a payout.");
      return;
    }

    if (!form.month) {
      setError("Choose the payout month.");
      return;
    }

    if (paidAmount > totalPayable) {
      setError("Paid amount cannot be greater than the total payable amount.");
      return;
    }

    const requestPayload = {
      ...(editingPayoutId ? {} : { teacherId: form.teacherId }),
      month: form.month,
      basePay,
      perClassRate,
      completedClasses,
      bonus,
      deductions,
      paidAmount,
      payoutDate: form.payoutDate || undefined,
    };

    setIsSaving(true);

    try {
      const response = await fetch(
        editingPayoutId
          ? `/api/teacher-payouts/${editingPayoutId}`
          : "/api/teacher-payouts",
        {
          method: editingPayoutId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const payload = (await response.json()) as {
        payout: TeacherPayout;
      };

      setPayouts((current) => {
        const alreadyExists = current.some(
          (payout) => payout.id === payload.payout.id,
        );

        const updatedPayouts = alreadyExists
          ? current.map((payout) =>
              payout.id === payload.payout.id ? payload.payout : payout,
            )
          : [payload.payout, ...current];

        return updatedPayouts.sort((left, right) =>
          right.month.localeCompare(left.month),
        );
      });

      setNotice(
        editingPayoutId
          ? "Teacher payout updated successfully."
          : "Teacher payout created successfully.",
      );

      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save teacher payout.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePayout(payout: TeacherPayout) {
    if (!isAdmin) {
      return;
    }

    const teacherName =
      educatorNameById.get(payout.teacherId) ?? "this educator";

    const shouldDelete = window.confirm(
      `Delete the payout record for ${teacherName} for ${formatMonth(
        payout.month,
      )}?`,
    );

    if (!shouldDelete) {
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingPayoutId(payout.id);

    try {
      const response = await fetch(`/api/teacher-payouts/${payout.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setPayouts((current) =>
        current.filter((currentPayout) => currentPayout.id !== payout.id),
      );

      setNotice("Teacher payout deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete teacher payout.",
      );
    } finally {
      setDeletingPayoutId(null);
    }
  }

  if (!isAdmin && !isEducator) {
    return null;
  }

  return (
    <section className="grid min-w-0 gap-6">
      <header className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">
              {isAdmin ? "Payroll Control" : "Educator Earnings"}
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {isAdmin ? "Teacher Payouts" : "My Earnings & Payouts"}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              {isAdmin
                ? "Create monthly teacher payouts, track payments, and maintain pending-balance records."
                : "Review your monthly earnings, payments received, and pending payout amounts."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPayouts()}
            disabled={isLoading}
            className="inline-flex w-fit items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="surface-soft rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Total Payable
          </p>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-heading)]">
            {formatCurrency(totals.payable)}
          </p>
        </article>

        <article className="surface-soft rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Amount Paid
          </p>
          <p className="mt-3 text-2xl font-semibold text-emerald-600">
            {formatCurrency(totals.paid)}
          </p>
        </article>

        <article className="surface-soft rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Pending Amount
          </p>
          <p className="mt-3 text-2xl font-semibold text-rose-600">
            {formatCurrency(totals.pending)}
          </p>
        </article>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      ) : null}

      {isAdmin ? (
        <form
          onSubmit={savePayout}
          className="surface rounded-[2rem] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-label">Payout Record</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                {editingPayoutId
                  ? "Update Teacher Payout"
                  : "Create Teacher Payout"}
              </h3>
            </div>

            {editingPayoutId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Cancel Editing
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Educator
              <select
                value={form.teacherId}
                onChange={(event) =>
                  updateForm("teacherId", event.target.value)
                }
                disabled={Boolean(editingPayoutId)}
                required
                className="w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select educator</option>

                {educators.map((educator) => (
                  <option key={educator.id} value={educator.id}>
                    {educator.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Payout Month
              <input
                type="month"
                value={form.month}
                onChange={(event) => updateForm("month", event.target.value)}
                required
                className="w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Base Pay
              <input
                type="number"
                min="0"
                step="1"
                value={form.basePay}
                onChange={(event) => updateForm("basePay", event.target.value)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Per Class Rate
              <input
                type="number"
                min="0"
                step="1"
                value={form.perClassRate}
                onChange={(event) =>
                  updateForm("perClassRate", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Completed Classes
              <input
                type="number"
                min="0"
                step="1"
                value={form.completedClasses}
                onChange={(event) =>
                  updateForm("completedClasses", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Bonus
              <input
                type="number"
                min="0"
                step="1"
                value={form.bonus}
                onChange={(event) => updateForm("bonus", event.target.value)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Deductions
              <input
                type="number"
                min="0"
                step="1"
                value={form.deductions}
                onChange={(event) =>
                  updateForm("deductions", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Paid Amount
              <input
                type="number"
                min="0"
                step="1"
                value={form.paidAmount}
                onChange={(event) =>
                  updateForm("paidAmount", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-[var(--color-heading)]">
              Payment Date
              <input
                type="date"
                value={form.payoutDate}
                onChange={(event) =>
                  updateForm("payoutDate", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Class Earnings
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
                {formatCurrency(classEarnings)}
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Total Payable
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
                {formatCurrency(totalPayable)}
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Pending Amount
              </p>
              <p className="mt-2 text-xl font-semibold text-rose-600">
                {formatCurrency(pendingAmount)}
              </p>
            </article>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving || educators.length === 0}
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingPayoutId
                  ? "Save Changes"
                  : "Create Payout"}
            </button>

            {!educators.length ? (
              <p className="self-center text-sm text-[var(--color-muted)]">
                Create an active educator account before creating payouts.
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      <section className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-label">Payout History</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {isAdmin ? "All Teacher Payout Records" : "My Payout Records"}
            </h3>
          </div>

          <span className="pill">{payouts.length} records</span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : payouts.length ? (
          <div className="mt-6 grid gap-4">
            {payouts.map((payout) => {
              const teacherName =
                educatorNameById.get(payout.teacherId) ??
                (isEducator ? "You" : "Educator");

              return (
                <article
                  key={payout.id}
                  className="surface-soft rounded-[1.75rem] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-[var(--color-heading)]">
                          {teacherName}
                        </h4>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${getStatusClass(
                            payout.status,
                          )}`}
                        >
                          {payout.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {formatMonth(payout.month)}
                        {payout.payoutDate
                          ? ` • Payment date: ${formatDate(
                              payout.payoutDate,
                            )}`
                          : ""}
                      </p>
                    </div>

                    {isAdmin ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(payout)}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void deletePayout(payout)}
                          disabled={deletingPayoutId === payout.id}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingPayoutId === payout.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-5">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        Base Pay
                      </p>
                      <p className="mt-2 font-semibold text-[var(--color-heading)]">
                        {formatCurrency(payout.basePay)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        Class Earnings
                      </p>
                      <p className="mt-2 font-semibold text-[var(--color-heading)]">
                        {formatCurrency(payout.classEarnings)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {payout.completedClasses} classes ×{" "}
                        {formatCurrency(payout.perClassRate)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        Total Payable
                      </p>
                      <p className="mt-2 font-semibold text-[var(--color-heading)]">
                        {formatCurrency(payout.totalPayable)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        Paid Amount
                      </p>
                      <p className="mt-2 font-semibold text-emerald-600">
                        {formatCurrency(payout.paidAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        Pending Amount
                      </p>
                      <p className="mt-2 font-semibold text-rose-600">
                        {formatCurrency(payout.pendingAmount)}
                      </p>
                    </div>
                  </div>

                  {payout.bonus > 0 || payout.deductions > 0 ? (
                    <p className="mt-4 text-sm text-[var(--color-muted)]">
                      Bonus: {formatCurrency(payout.bonus)} · Deductions:{" "}
                      {formatCurrency(payout.deductions)}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {isAdmin
                ? "No payout records yet. Create the first teacher payout above."
                : "No payout records are available for your account yet."}
            </p>
          </div>
        )}
      </section>
    </section>
  );
}