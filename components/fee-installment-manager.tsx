"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  FeeInstallment,
  FeeInstallmentPlan,
  ManagedUser,
  PaymentMode,
  Role,
} from "@/lib/types";

type FeeInstallmentManagerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
};

type InstallmentDraft = {
  installmentNumber: number;
  installmentTitle: string;
  amount: string;
  paidAmount: string;
  dueDate: string;
  paidDate: string;
  paymentMode: string;
  receiptNumber: string;
  notes: string;
};

type InstallmentPaymentDraft = {
  paidAmount: string;
  paidDate: string;
  paymentMode: PaymentMode;
  transactionId: string;
  chequeNumber: string;
  bankName: string;
  accountLast4: string;
  notes: string;
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const compactFieldClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPlanStatusClass(status: FeeInstallmentPlan["status"]) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-blue-100 text-blue-700";
}

function getInstallmentStatusClass(status: FeeInstallment["status"]) {
  if (status === "paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "partial") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "overdue") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function createEmptyInstallment(installmentNumber: number): InstallmentDraft {
  return {
    installmentNumber,
    installmentTitle: `Installment ${installmentNumber}`,
    amount: "",
    paidAmount: "0",
    dueDate: getToday(),
    paidDate: "",
    paymentMode: "",
    receiptNumber: "",
    notes: "",
  };
}

function toInstallmentDraft(installment: FeeInstallment): InstallmentDraft {
  return {
    installmentNumber: installment.installmentNumber,
    installmentTitle:
      installment.installmentTitle ||
      `Installment ${installment.installmentNumber}`,
    amount: String(installment.amount),
    paidAmount: String(installment.paidAmount ?? 0),
    dueDate: installment.dueDate,
    paidDate: installment.paidDate ?? "",
    paymentMode: installment.paymentMode ?? "",
    receiptNumber: installment.receiptNumber ?? "",
    notes: installment.notes ?? "",
  };
}

function getDraftTotals(installments: InstallmentDraft[]) {
  return installments.reduce(
    (totals, installment) => {
      const amount = Number(installment.amount) || 0;
      const paidAmount = Number(installment.paidAmount) || 0;

      return {
        totalFee: totals.totalFee + amount,
        paidAmount: totals.paidAmount + paidAmount,
      };
    },
    {
      totalFee: 0,
      paidAmount: 0,
    },
  );
}

export function FeeInstallmentManager({
  role,
  studentDirectory,
}: FeeInstallmentManagerProps) {
  const canManage = role === "admin";

  const [plans, setPlans] = useState<FeeInstallmentPlan[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [notes, setNotes] = useState("");

  const [installments, setInstallments] = useState<InstallmentDraft[]>([
    createEmptyInstallment(1),
  ]);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [paymentPlan, setPaymentPlan] = useState<FeeInstallmentPlan | null>(
    null,
  );
  const [paymentInstallment, setPaymentInstallment] =
    useState<FeeInstallment | null>(null);
  const [installmentPaymentDraft, setInstallmentPaymentDraft] =
    useState<InstallmentPaymentDraft>({
      paidAmount: "",
      paidDate: getToday(),
      paymentMode: "Cash",
      transactionId: "",
      chequeNumber: "",
      bankName: "",
      accountLast4: "",
      notes: "",
    });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const selectedStudent = useMemo(
    () =>
      studentDirectory.find(
        (student) =>
          student.id === selectedStudentId && student.role === "student",
      ),
    [selectedStudentId, studentDirectory],
  );

  const draftTotals = useMemo(
    () => getDraftTotals(installments),
    [installments],
  );

  const pendingDraftAmount = Math.max(
    0,
    draftTotals.totalFee - draftTotals.paidAmount,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/fee-installments", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          feeInstallmentPlans?: FeeInstallmentPlan[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Unable to load fee installment plans.",
          );
        }

        if (!cancelled) {
          setPlans(payload.feeInstallmentPlans ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load fee installment plans.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingPlanId(null);
    setSelectedStudentId("");
    setCourseName("");
    setAcademicYear("");
    setNotes("");
    setInstallments([createEmptyInstallment(1)]);
  }

  function updateInstallment(
    installmentNumber: number,
    updates: Partial<InstallmentDraft>,
  ) {
    setInstallments((current) =>
      current.map((installment) =>
        installment.installmentNumber === installmentNumber
          ? { ...installment, ...updates }
          : installment,
      ),
    );
  }

  function addInstallment() {
    const nextNumber =
      Math.max(
        0,
        ...installments.map((installment) => installment.installmentNumber),
      ) + 1;

    setInstallments((current) => [
      ...current,
      createEmptyInstallment(nextNumber),
    ]);
  }

  function removeInstallment(installmentNumber: number) {
    if (installments.length === 1) {
      setMessage("A fee plan needs at least one installment.");
      return;
    }

    setInstallments((current) =>
      current
        .filter(
          (installment) => installment.installmentNumber !== installmentNumber,
        )
        .map((installment, index) => ({
          ...installment,
          installmentNumber: index + 1,
        })),
    );
  }

  function openEditor(plan: FeeInstallmentPlan) {
    setEditingPlanId(plan.id);
    setSelectedStudentId(plan.studentId);
    setCourseName(plan.courseName ?? "");
    setAcademicYear(plan.academicYear ?? "");
    setNotes(plan.notes ?? "");
    setInstallments(plan.installments.map(toInstallmentDraft));
    setMessage("");
  }

  function cancelEditing() {
    resetForm();
    setMessage("");
  }

  function validateInstallments() {
    if (!installments.length) {
      return "Add at least one installment.";
    }

    for (const installment of installments) {
      if (!installment.installmentTitle.trim()) {
        return `Enter a title for installment ${installment.installmentNumber}.`;
      }
      const amount = Number(installment.amount);
      const paidAmount = Number(installment.paidAmount || 0);

      if (!Number.isFinite(amount) || amount <= 0) {
        return `Enter a valid amount for installment ${installment.installmentNumber}.`;
      }

      if (
        !Number.isFinite(paidAmount) ||
        paidAmount < 0 ||
        paidAmount > amount
      ) {
        return `Paid amount for installment ${installment.installmentNumber} must be between 0 and ${amount}.`;
      }

      if (!installment.dueDate) {
        return `Select a due date for installment ${installment.installmentNumber}.`;
      }
    }

    return null;
  }

  async function savePlan() {
    if (!canManage) {
      return;
    }

    if (!editingPlanId && !selectedStudent) {
      setMessage("Select a student.");
      return;
    }

    if (!courseName.trim()) {
      setMessage("Course name is required.");
      return;
    }

    const validationError = validateInstallments();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    setMessage("");

    const normalizedInstallments = installments.map((installment) => ({
      installmentNumber: installment.installmentNumber,
      installmentTitle: installment.installmentTitle.trim(),
      amount: Number(installment.amount),
      paidAmount: Number(installment.paidAmount || 0),
      dueDate: installment.dueDate,
      paidDate:
        Number(installment.paidAmount || 0) > 0
          ? installment.paidDate || getToday()
          : undefined,
      paymentMode: installment.paymentMode.trim() || undefined,
      receiptNumber: installment.receiptNumber.trim() || undefined,
      notes: installment.notes.trim() || undefined,
    }));

    try {
      const isEditing = Boolean(editingPlanId);

      const response = await fetch(
        isEditing
          ? `/api/fee-installments/${editingPlanId}`
          : "/api/fee-installments",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditing
              ? {
                  title: "Fee Installment Plan",
                  courseName: courseName.trim(),
                  academicYear: academicYear.trim(),
                  notes: notes.trim(),
                  installments: normalizedInstallments,
                }
              : {
                  studentId: selectedStudent!.id,
                  title: "Fee Installment Plan",
                  courseName: courseName.trim(),
                  academicYear: academicYear.trim(),
                  notes: notes.trim(),
                  installments: normalizedInstallments,
                },
          ),
        },
      );

      const payload = (await response.json()) as {
        feeInstallmentPlan?: FeeInstallmentPlan;
        error?: string;
      };

      if (!response.ok || !payload.feeInstallmentPlan) {
        setMessage(payload.error ?? "Unable to save fee installment plan.");
        return;
      }

      setPlans((current) =>
        isEditing
          ? current.map((plan) =>
              plan.id === payload.feeInstallmentPlan!.id
                ? payload.feeInstallmentPlan!
                : plan,
            )
          : [payload.feeInstallmentPlan!, ...current],
      );

      setMessage(
        isEditing
          ? "Fee installment plan updated."
          : "Fee installment plan created successfully.",
      );

      resetForm();
    } catch {
      setMessage("Unable to save fee installment plan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function cancelPlan(plan: FeeInstallmentPlan) {
    if (!canManage) {
      return;
    }

    if (plan.paidAmount > 0) {
      setMessage(
        "A plan with recorded payments cannot be cancelled. Update its installments instead.",
      );
      return;
    }
    const confirmed = window.confirm(
      `Cancel this fee plan for ${plan.studentName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/fee-installments/${plan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const payload = (await response.json()) as {
        feeInstallmentPlan?: FeeInstallmentPlan;
        error?: string;
      };

      if (!response.ok || !payload.feeInstallmentPlan) {
        setMessage(payload.error ?? "Unable to cancel fee plan.");
        return;
      }

      setPlans((current) =>
        current.map((item) =>
          item.id === payload.feeInstallmentPlan!.id
            ? payload.feeInstallmentPlan!
            : item,
        ),
      );

      setMessage("Fee installment plan cancelled.");
    } catch {
      setMessage("Unable to cancel fee plan.");
    }
  }

  async function deletePlan(plan: FeeInstallmentPlan) {
    if (!canManage) {
      return;
    }

    if (plan.paidAmount > 0) {
      setMessage(
        "A plan with recorded payments cannot be deleted. Update the plan instead.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete this fee plan for ${plan.studentName}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(plan.id);

    try {
      const response = await fetch(`/api/fee-installments/${plan.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error ?? "Unable to delete fee plan.");
        return;
      }

      setPlans((current) => current.filter((item) => item.id !== plan.id));

      if (editingPlanId === plan.id) {
        resetForm();
      }

      setMessage("Fee installment plan deleted.");
    } catch {
      setMessage("Unable to delete fee plan.");
    } finally {
      setDeletingId(null);
    }
  }

  function openInstallmentPaymentModal(
    plan: FeeInstallmentPlan,
    installment: FeeInstallment,
  ) {
    const remaining = Math.max(0, installment.amount - installment.paidAmount);
    setPaymentPlan(plan);
    setPaymentInstallment(installment);
    setInstallmentPaymentDraft({
      paidAmount: String(remaining),
      paidDate: getToday(),
      paymentMode: "Cash",
      transactionId: "",
      chequeNumber: "",
      bankName: "",
      accountLast4: "",
      notes: "",
    });
  }

  function updateInstallmentPaymentDraft<
    K extends keyof InstallmentPaymentDraft,
  >(key: K, value: InstallmentPaymentDraft[K]) {
    setInstallmentPaymentDraft((current) => ({ ...current, [key]: value }));
  }

  async function recordInstallmentPayment() {
    if (!paymentPlan || !paymentInstallment) return;

    const amount = Number(installmentPaymentDraft.paidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid paid amount.");
      return;
    }

    const remaining = Math.max(
      0,
      paymentInstallment.amount - paymentInstallment.paidAmount,
    );
    if (amount > remaining) {
      setMessage(
        `Paid amount cannot exceed the outstanding balance of ${formatCurrency(remaining)}.`,
      );
      return;
    }

    setIsRecordingPayment(true);
    setMessage("");

    try {
      const response = await fetch(`/api/fee-installments/${paymentPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentTransaction: {
            installmentNumber: paymentInstallment.installmentNumber,
            transaction: {
              paidAmount: amount,
              paidDate: installmentPaymentDraft.paidDate,
              paymentMode: installmentPaymentDraft.paymentMode,
              transactionId: installmentPaymentDraft.transactionId,
              chequeNumber: installmentPaymentDraft.chequeNumber,
              bankName: installmentPaymentDraft.bankName,
              accountLast4: installmentPaymentDraft.accountLast4,
              notes: installmentPaymentDraft.notes,
            },
          },
        }),
      });

      const payload = (await response.json()) as {
        feeInstallmentPlan?: FeeInstallmentPlan;
        error?: string;
      };

      if (!response.ok || !payload.feeInstallmentPlan) {
        setMessage(payload.error ?? "Unable to record payment.");
        return;
      }

      setPlans((current) =>
        current.map((p) =>
          p.id === payload.feeInstallmentPlan!.id
            ? payload.feeInstallmentPlan!
            : p,
        ),
      );

      setPaymentPlan(null);
      setPaymentInstallment(null);
      setMessage("Payment recorded successfully.");
    } catch {
      setMessage("Unable to record payment.");
    } finally {
      setIsRecordingPayment(false);
    }
  }

  return (
    <section className="min-w-0 space-y-6">
      <div className="surface rounded-[2rem] p-6">
        <p className="section-label">Fee Management</p>

        <h2 className="mt-2 text-2xl font-black text-[var(--color-heading)]">
          {canManage ? "Fee Installment Plans" : "My Fee Installment Plan"}
        </h2>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {canManage
            ? "Create student-wise payment plans, record partial payments, and monitor overdue installments."
            : "View your fee plan, installment due dates, paid amount, and remaining balance."}
        </p>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canManage ? (
          <div className="mt-6 space-y-5">
            {editingPlanId ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                You are editing an existing fee plan. The student cannot be
                changed after plan creation.
              </div>
            ) : null}

            <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Student
                </span>

                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  disabled={Boolean(editingPlanId)}
                  className={fieldClass}
                >
                  <option value="">Select student</option>

                  {studentDirectory
                    .filter((student) => student.role === "student")
                    .map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Course Name
                </span>

                <input
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  placeholder="Optional course name"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Academic Year
                </span>

                <input
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                  placeholder="e.g. 2026-27"
                  className={fieldClass}
                />
              </label>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Plan Summary
                </p>

                <p className="mt-2 text-sm font-black text-[var(--color-heading)]">
                  {formatCurrency(draftTotals.totalFee)} Total
                </p>

                <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                  {formatCurrency(pendingDraftAmount)} Pending
                </p>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                Notes
              </span>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional fee plan notes, discounts, agreements, or payment instructions."
                className="min-h-24 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-[1.5rem] border border-[var(--color-border)]">
              <table className="w-full min-w-[1230px] text-left text-sm">
                <thead className="bg-[var(--color-panel)]">
                  <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    <th className="px-4 py-4">No.</th>
                    <th className="px-4 py-4">Title</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Paid Amount</th>
                    <th className="px-4 py-4">Due Date</th>
                    <th className="px-4 py-4">Paid Date</th>
                    <th className="px-4 py-4">Payment Mode</th>
                    <th className="px-4 py-4">Receipt No.</th>
                    <th className="px-4 py-4">Remove</th>
                  </tr>
                </thead>

                <tbody>
                  {installments.map((installment) => (
                    <tr
                      key={installment.installmentNumber}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="px-4 py-3 font-black text-[var(--color-heading)]">
                        {installment.installmentNumber}
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={installment.installmentTitle}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              installmentTitle: event.target.value,
                            })
                          }
                          placeholder="e.g. Admission Fee"
                          className={`${compactFieldClass} min-w-40`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={installment.amount}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              amount: event.target.value,
                            })
                          }
                          placeholder="Amount"
                          className={`${compactFieldClass} min-w-28`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={installment.paidAmount}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              paidAmount: event.target.value,
                              paidDate:
                                Number(event.target.value) > 0
                                  ? installment.paidDate || getToday()
                                  : "",
                            })
                          }
                          placeholder="0"
                          className={`${compactFieldClass} min-w-28`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={installment.dueDate}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              dueDate: event.target.value,
                            })
                          }
                          className={compactFieldClass}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          disabled={Number(installment.paidAmount) <= 0}
                          value={installment.paidDate}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              paidDate: event.target.value,
                            })
                          }
                          className={`${compactFieldClass} disabled:cursor-not-allowed disabled:opacity-50`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={installment.paymentMode}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              paymentMode: event.target.value,
                            })
                          }
                          placeholder="Cash / UPI"
                          className={`${compactFieldClass} min-w-32`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={installment.receiptNumber}
                          onChange={(event) =>
                            updateInstallment(installment.installmentNumber, {
                              receiptNumber: event.target.value,
                            })
                          }
                          placeholder="Optional"
                          className={`${compactFieldClass} min-w-32`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            removeInstallment(installment.installmentNumber)
                          }
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addInstallment}
                className="rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
              >
                + Add Installment
              </button>

              <button
                type="button"
                onClick={() => void savePlan()}
                disabled={isSaving}
                className="action-button px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingPlanId
                    ? "Update Fee Plan"
                    : "Create Fee Plan"}
              </button>

              {editingPlanId ? (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Payment Records</p>

            <h3 className="text-xl font-black text-[var(--color-heading)]">
              {canManage ? "Student Fee Plans" : "Your Payment Plan"}
            </h3>
          </div>

          <span className="pill w-fit">
            {plans.length} Plan{plans.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Loading fee installment plans...
          </p>
        ) : null}

        {!isLoading && !plans.length ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-10 text-center">
            <h4 className="font-black text-[var(--color-heading)]">
              No fee plans available
            </h4>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canManage
                ? "Create the first student fee plan above."
                : "Your institute will add your fee installment plan here."}
            </p>
          </div>
        ) : null}

        <div className="mt-5 space-y-5">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getPlanStatusClass(
                        plan.status,
                      )}`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  {canManage || plan.courseName || plan.academicYear ? (
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {canManage ? plan.studentName : ""}
                      {canManage && plan.courseName ? " • " : ""}
                      {plan.courseName ?? ""}
                      {(canManage || plan.courseName) && plan.academicYear
                        ? " • "
                        : ""}
                      {plan.academicYear ?? ""}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-[var(--color-panel)] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Total
                    </p>
                    <p className="mt-1 text-sm font-black text-[var(--color-heading)]">
                      {formatCurrency(plan.totalFee)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      Paid
                    </p>
                    <p className="mt-1 text-sm font-black text-emerald-700">
                      {formatCurrency(plan.paidAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                      Pending
                    </p>
                    <p className="mt-1 text-sm font-black text-amber-700">
                      {formatCurrency(plan.pendingAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {plan.notes ? (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                    Plan Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-blue-900">
                    {plan.notes}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[var(--color-panel)]">
                    <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      <th className="px-4 py-3">Installment</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Pending</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {plan.installments.map((installment) => (
                      <tr
                        key={installment.installmentNumber}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-black text-[var(--color-heading)]">
                            {installment.installmentTitle ||
                              `Installment ${installment.installmentNumber}`}
                          </div>

                          <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
                            Installment #{installment.installmentNumber}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {formatDate(installment.dueDate)}
                        </td>

                        <td className="px-4 py-3 font-semibold text-[var(--color-heading)]">
                          {formatCurrency(installment.amount)}
                        </td>

                        <td className="px-4 py-3 font-semibold text-emerald-700">
                          {formatCurrency(installment.paidAmount)}
                        </td>

                        <td className="px-4 py-3 font-semibold text-amber-700">
                          {formatCurrency(installment.pendingAmount)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getInstallmentStatusClass(
                              installment.status,
                            )}`}
                          >
                            {installment.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {installment.paymentMode ?? "—"}
                          {installment.receiptNumber
                            ? ` • ${installment.receiptNumber}`
                            : ""}
                        </td>

                        <td className="px-4 py-3">
                          {canManage &&
                          installment.status !== "paid" &&
                          installment.pendingAmount > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                openInstallmentPaymentModal(plan, installment)
                              }
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 hover:bg-emerald-100"
                            >
                              Record Payment
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {canManage ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openEditor(plan)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
                  >
                    Edit / Record Payment
                  </button>

                  {plan.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => void cancelPlan(plan)}
                      className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 hover:bg-amber-100"
                    >
                      Cancel Plan
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={deletingId === plan.id}
                    onClick={() => void deletePlan(plan)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 hover:bg-rose-100 disabled:opacity-60"
                  >
                    {deletingId === plan.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {paymentPlan && paymentInstallment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
              Record Payment
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              {paymentInstallment.installmentTitle ||
                `Installment ${paymentInstallment.installmentNumber}`}{" "}
              — {paymentPlan.studentName}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Outstanding balance:{" "}
              <strong>
                {formatCurrency(
                  Math.max(
                    0,
                    paymentInstallment.amount - paymentInstallment.paidAmount,
                  ),
                )}
              </strong>
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Amount (₹) *
                </span>
                <input
                  type="number"
                  min="1"
                  value={installmentPaymentDraft.paidAmount}
                  onChange={(event) =>
                    updateInstallmentPaymentDraft(
                      "paidAmount",
                      event.target.value,
                    )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Payment Date *
                </span>
                <input
                  type="date"
                  value={installmentPaymentDraft.paidDate}
                  onChange={(event) =>
                    updateInstallmentPaymentDraft(
                      "paidDate",
                      event.target.value,
                    )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Payment Mode *
                </span>
                <select
                  value={installmentPaymentDraft.paymentMode}
                  onChange={(event) =>
                    updateInstallmentPaymentDraft(
                      "paymentMode",
                      event.target.value as PaymentMode,
                    )
                  }
                  className={fieldClass}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Online Payment">Online Payment</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Notes
                </span>
                <input
                  value={installmentPaymentDraft.notes}
                  onChange={(event) =>
                    updateInstallmentPaymentDraft("notes", event.target.value)
                  }
                  className={fieldClass}
                  placeholder="Optional"
                />
              </label>
            </div>

            {installmentPaymentDraft.paymentMode !== "Cash" ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">
                  Transaction Details
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {installmentPaymentDraft.paymentMode === "Cheque" ? (
                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                        Cheque Number
                      </span>
                      <input
                        value={installmentPaymentDraft.chequeNumber}
                        onChange={(event) =>
                          updateInstallmentPaymentDraft(
                            "chequeNumber",
                            event.target.value,
                          )
                        }
                        className={fieldClass}
                        placeholder="Cheque number"
                      />
                    </label>
                  ) : null}

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                      Transaction ID / Reference
                    </span>
                    <input
                      value={installmentPaymentDraft.transactionId}
                      onChange={(event) =>
                        updateInstallmentPaymentDraft(
                          "transactionId",
                          event.target.value,
                        )
                      }
                      className={fieldClass}
                      placeholder="UPI ref, NEFT/RTGS ref, etc."
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                      Bank Name
                    </span>
                    <input
                      value={installmentPaymentDraft.bankName}
                      onChange={(event) =>
                        updateInstallmentPaymentDraft(
                          "bankName",
                          event.target.value,
                        )
                      }
                      className={fieldClass}
                      placeholder="Bank name"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                      Account Last 4 Digits
                    </span>
                    <input
                      value={installmentPaymentDraft.accountLast4}
                      onChange={(event) =>
                        updateInstallmentPaymentDraft(
                          "accountLast4",
                          event.target.value,
                        )
                      }
                      className={fieldClass}
                      placeholder="XXXX"
                      maxLength={4}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentPlan(null);
                  setPaymentInstallment(null);
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={() => void recordInstallmentPayment()}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isRecordingPayment ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
