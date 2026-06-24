"use client";

import { type ReactNode, useMemo, useState } from "react";

import type { FeeInvoice, ManagedUser, Role } from "@/lib/types";

type InvoiceManagerProps = {
  role: Role;
  feeInvoices: FeeInvoice[];
  studentDirectory: ManagedUser[];
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function StatusBadge({ status }: { status: FeeInvoice["status"] }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/30",
    unpaid:
      "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400/30",
    partial:
      "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-400/30",
    overdue: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-400/30",
  };

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${styles[status] || styles.unpaid}`}
    >
      {status}
    </span>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative space-y-2">
      <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
        {label}
      </span>
      {children}
    </div>
  );
}

export function InvoiceManager({
  role,
  feeInvoices,
  studentDirectory,
}: InvoiceManagerProps) {
  const canEdit = role === "admin" || role === "educator";
  const canPay = role === "student" || role === "parent";

  const [invoices, setInvoices] = useState<FeeInvoice[]>(feeInvoices);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [invoiceToDelete, setInvoiceToDelete] = useState<FeeInvoice | null>(
    null,
  );

  const [showForm, setShowForm] = useState(false);
  const [formStudentId, setFormStudentId] = useState(
    studentDirectory[0]?.id ?? "",
  );
  const [formTitle, setFormTitle] = useState("Tuition Fee");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const studentOptions = useMemo(
    () =>
      studentDirectory.length
        ? studentDirectory.map((s) => ({ label: s.name, value: s.id }))
        : [{ label: "No students", value: "" }],
    [studentDirectory],
  );

  function showStatus(type: "success" | "error", text: string) {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  async function createInvoice() {
    if (!canEdit || !formStudentId) return;

    const student = studentDirectory.find((s) => s.id === formStudentId);
    if (!student) return;

    const totalAmount = Number(formAmount || 0);
    if (totalAmount <= 0) {
      showStatus("error", "Amount must be greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          title: formTitle.trim(),
          amount: totalAmount,
          paidAmount: 0,
          dueDate: formDueDate,
          status: "unpaid",
          createdBy: "",
        }),
      });

      const payload = await res.json();

      if (res.ok && payload.feeInvoice) {
        setInvoices((prev) => [payload.feeInvoice, ...prev]);
        setFormTitle("Tuition Fee");
        setFormAmount("");
        setShowForm(false);
        showStatus("success", "Invoice created.");
      } else {
        showStatus("error", payload.error || "Failed to create invoice.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInvoice(invoiceId: string) {
    if (!canEdit) return;
    setDeletingId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
        setInvoiceToDelete(null);
        showStatus("success", "Invoice deleted.");
      } else {
        showStatus("error", "Failed to delete invoice.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDummyPay(invoice: FeeInvoice) {
    if (!canPay) return;

    const balance = Math.max(invoice.amount - (invoice.paidAmount ?? 0), 0);
    if (balance <= 0) return;

    setPayingId(invoice.id);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paidAmount: invoice.amount,
        }),
      });

      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoice.id
              ? { ...inv, status: "paid" as const, paidAmount: inv.amount }
              : inv,
          ),
        );
        showStatus("success", "Payment recorded.");
      } else {
        showStatus("error", "Failed to record payment.");
      }
    } catch {
      showStatus("error", "Something went wrong.");
    } finally {
      setPayingId(null);
    }
  }

  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + Math.max(inv.amount - (inv.paidAmount ?? 0), 0),
    0,
  );

  return (
    <section className="space-y-6">
      {statusMessage ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-bold shadow-lg ${
            statusMessage.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-label">Fees</p>
            <h2 className="text-2xl font-black text-[var(--color-heading)]">
              Fee Management
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {canEdit
                ? "Create and manage fee invoices."
                : "View your invoices and pay online."}
            </p>
          </div>

          {canEdit ? (
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="action-button px-6 py-3"
            >
              {showForm ? "Cancel" : "New Invoice"}
            </button>
          ) : null}
        </div>

        {invoices.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="surface-soft rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                Total Invoices
              </p>
              <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                {invoices.length}
              </p>
            </div>
            <div className="surface-soft rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                Paid
              </p>
              <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
                {invoices.filter((inv) => inv.status === "paid").length}
              </p>
            </div>
            <div className="surface-soft rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                Outstanding
              </p>
              <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {showForm && canEdit ? (
        <div className="surface rounded-[2rem] p-6">
          <h3 className="text-lg font-black text-[var(--color-heading)]">
            New Invoice
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <FieldLabel label="Student">
              <select
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className={fieldClass}
              >
                {studentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Title">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Tuition Fee"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Amount (₹)">
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="5000"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Due Date">
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <div className="flex items-end">
              <button
                type="button"
                onClick={createInvoice}
                disabled={isSaving}
                className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        {invoices.length ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                <th className="p-4 pl-0">Student</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Balance</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-0 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const balance = Math.max(
                  invoice.amount - (invoice.paidAmount ?? 0),
                  0,
                );

                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-[var(--color-border)] text-sm text-[var(--color-heading)] last:border-0"
                  >
                    <td className="p-4 pl-0 font-bold">
                      {invoice.studentName}
                    </td>
                    <td className="p-4 text-[var(--color-muted)]">
                      {invoice.title}
                    </td>
                    <td className="p-4 font-semibold">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(invoice.paidAmount ?? 0)}
                    </td>
                    <td className="p-4 font-bold">
                      {balance > 0 ? formatCurrency(balance) : "—"}
                    </td>
                    <td className="p-4 text-[var(--color-muted)]">
                      {invoice.dueDate}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-4 pr-0 text-right">
                      {canPay && invoice.status !== "paid" && balance > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDummyPay(invoice)}
                          disabled={payingId === invoice.id}
                          className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {payingId === invoice.id
                            ? "Processing..."
                            : "Pay Now"}
                        </button>
                      ) : null}

                      {canEdit ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInvoiceToDelete(invoice)}
                            disabled={deletingId === invoice.id}
                            className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-500/20 disabled:opacity-60 dark:text-red-100"
                          >
                            {deletingId === invoice.id ? "..." : "Delete"}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="surface-soft rounded-[2rem] border border-[var(--color-border)] p-12 text-center">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              No invoices
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canEdit
                ? "Create your first invoice above."
                : "No fee invoices yet."}
            </p>
          </div>
        )}
      </div>

      {invoiceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-[var(--color-heading)]">
              Delete invoice?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              Are you sure you want to delete the invoice for{" "}
              <span className="font-black text-[var(--color-heading)]">
                {invoiceToDelete.studentName}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-bold text-[var(--color-heading)]">
                {invoiceToDelete.title}:{" "}
                {formatCurrency(invoiceToDelete.amount)}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Due: {invoiceToDelete.dueDate}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                disabled={deletingId === invoiceToDelete.id}
                className="flex-1 rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteInvoice(invoiceToDelete.id)}
                disabled={deletingId === invoiceToDelete.id}
                className="flex-1 rounded-full border border-red-400/30 bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === invoiceToDelete.id
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
