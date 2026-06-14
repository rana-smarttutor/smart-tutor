"use client";

import { useEffect, useMemo, useState } from "react";

import type { FeeInvoice, ManagedUser, Role } from "@/lib/types";

type InvoiceManagerProps = {
  role: Role;
  feeInvoices: FeeInvoice[];
  studentDirectory: ManagedUser[];
};

type SelectOption = {
  label: string;
  value: string;
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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

const fallbackDropdownTheme = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  borderColor: "#cbd5e1",
};

type DropdownTheme = typeof fallbackDropdownTheme;

function parseColor(color: string) {
  const value = color.trim();

  if (value.startsWith("#")) {
    const hex = value.replace("#", "");

    if (hex.length === 3) {
      return hex.split("").map((char) => parseInt(char + char, 16));
    }

    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  const match = value.match(/rgba?\(([^)]+)\)/);

  if (!match) return null;

  const parts = match[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if (parts.some((part) => Number.isNaN(part))) return null;

  return parts;
}

function getLuminance(color: string) {
  const rgb = parseColor(color);

  if (!rgb) return 0;

  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readCssVariable(name: string) {
  if (typeof window === "undefined") return "";

  const rootValue = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (rootValue) return rootValue;

  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function getDropdownTheme(): DropdownTheme {
  if (typeof window === "undefined") {
    return fallbackDropdownTheme;
  }

  const headingColor =
    readCssVariable("--color-heading") ||
    getComputedStyle(document.body).color ||
    fallbackDropdownTheme.color;

  const borderColor =
    readCssVariable("--color-border") || fallbackDropdownTheme.borderColor;

  const isDarkTheme = getLuminance(headingColor) > 0.55;

  return {
    backgroundColor: isDarkTheme ? "#020617" : "#ffffff",
    color: headingColor,
    borderColor,
  };
}

function useDropdownTheme() {
  const [theme, setTheme] = useState<DropdownTheme>(fallbackDropdownTheme);

  useEffect(() => {
    function updateTheme() {
      setTheme(getDropdownTheme());
    }

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  small = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownTheme = useDropdownTheme();

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <div className={`relative ${open ? "z-[9999]" : "z-30"}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={dropdownTheme}
        className={`flex w-full items-center justify-between gap-3 border text-left font-semibold shadow-sm outline-none transition hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
          small
            ? "rounded-xl px-3 py-2 text-sm"
            : "rounded-2xl px-4 py-3 text-sm"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-xs opacity-70">▾</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          />

          <div
            style={dropdownTheme}
            className="absolute left-0 top-full z-[9999] mt-1 w-full overflow-hidden rounded-xl border shadow-2xl"
          >
            <div className="max-h-44 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={
                      isSelected
                        ? undefined
                        : { color: dropdownTheme.color }
                    }
                    className={`block w-full px-4 py-3 text-left text-sm font-semibold transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-500/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function InvoiceManager({
  role,
  feeInvoices,
  studentDirectory,
}: InvoiceManagerProps) {
  const canEdit = role === "admin" || role === "educator";

  const [invoices, setInvoices] = useState(feeInvoices);
  const [studentId, setStudentId] = useState(studentDirectory[0]?.id ?? "");
  const [title, setTitle] = useState("Monthly Fee Invoice");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<FeeInvoice["status"]>("unpaid");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const studentOptions = useMemo(
    () =>
      studentDirectory.length
        ? studentDirectory.map((student) => ({
            label: student.name,
            value: student.id,
          }))
        : [{ label: "No students found", value: "" }],
    [studentDirectory],
  );

  const statusOptions: SelectOption[] = [
    { label: "Unpaid", value: "unpaid" },
    { label: "Partial", value: "partial" },
    { label: "Paid", value: "paid" },
    { label: "Overdue", value: "overdue" },
  ];

  async function createInvoice() {
    if (!canEdit || !studentId) return;

    const student = studentDirectory.find((item) => item.id === studentId);

    if (!student) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          title,
          amount: Number(amount || 0),
          paidAmount: Number(paidAmount || 0),
          dueDate,
          status,
          notes,
        }),
      });

      const payload = await response.json();

      if (response.ok && payload.feeInvoice) {
        setInvoices((current) => [payload.feeInvoice, ...current]);
        setAmount("");
        setPaidAmount("0");
        setNotes("");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function updateInvoiceStatus(
    invoiceId: string,
    nextStatus: FeeInvoice["status"],
  ) {
    if (!canEdit) return;

    const invoice = invoices.find((item) => item.id === invoiceId);

    if (!invoice) return;

    const optimisticInvoice = {
      ...invoice,
      status: nextStatus,
    };

    setInvoices((current) =>
      current.map((item) => (item.id === invoiceId ? optimisticInvoice : item)),
    );

    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
      }),
    });
  }

  function getBalance(invoice: FeeInvoice) {
    return Math.max(invoice.amount - (invoice.paidAmount ?? 0), 0);
  }

  return (
    <section className="space-y-6">
      <div className="surface overflow-visible rounded-[2rem] p-6">
        <div className="flex flex-col gap-2">
          <p className="section-label">Fees</p>
          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Fee Invoices
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            {canEdit
              ? "Generate and update fee invoices for students."
              : "View your fee invoices and payment status."}
          </p>
        </div>

        {canEdit ? (
          <div className="mt-6 grid overflow-visible gap-4 md:grid-cols-3">
            <FieldLabel label="Student Name">
              <CustomSelect
                value={studentId}
                options={studentOptions}
                onChange={setStudentId}
              />
            </FieldLabel>

            <FieldLabel label="Invoice Title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: June Monthly Fee"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Total Amount">
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Example: 10000"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Paid Amount">
              <input
                type="number"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder="Example: 0"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Due Date">
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Payment Status">
              <CustomSelect
                value={status}
                options={statusOptions}
                onChange={(nextStatus) =>
                  setStatus(nextStatus as FeeInvoice["status"])
                }
              />
            </FieldLabel>

            <FieldLabel label="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Please pay before due date."
                className={`${fieldClass} min-h-24 md:col-span-2`}
              />
            </FieldLabel>

            <div className="flex items-end">
              <button
                type="button"
                onClick={createInvoice}
                disabled={isSaving || !studentDirectory.length}
                className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        ) : null}

        {canEdit && !studentDirectory.length ? (
          <p className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm font-semibold text-[var(--color-heading)]">
            No students found. Add students first, then generate invoices.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {invoices.length ? (
          invoices.map((invoice) => (
            <div key={invoice.id} className="surface overflow-visible rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[var(--color-heading)]">
                    {invoice.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    {invoice.studentName} • Due {invoice.dueDate}
                  </p>
                </div>

                {canEdit ? (
                  <div className="min-w-36">
                    <CustomSelect
                      value={invoice.status}
                      options={statusOptions}
                      small
                      onChange={(nextStatus) =>
                        updateInvoiceStatus(
                          invoice.id,
                          nextStatus as FeeInvoice["status"],
                        )
                      }
                    />
                  </div>
                ) : (
                  <span className="pill capitalize">{invoice.status}</span>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Total
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                    ₹{invoice.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Paid
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                    ₹{(invoice.paidAmount ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Balance
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                    ₹{getBalance(invoice).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {invoice.notes ? (
                <p className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)]">
                  {invoice.notes}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="surface-soft rounded-[2rem] border border-[var(--color-border)] p-10 text-center lg:col-span-2">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              No invoices yet
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canEdit
                ? "Generate the first fee invoice above."
                : "Invoices will appear here once generated by admin or faculty."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}