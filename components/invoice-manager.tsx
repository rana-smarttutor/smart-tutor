"use client";

import { type ReactNode, useMemo, useState } from "react";

import type { FeeInvoice, ManagedUser, Role } from "@/lib/types";

type InvoiceManagerProps = {
  role: Role;
  feeInvoices: FeeInvoice[];
  studentDirectory: ManagedUser[];
};

type StudentFeeDetails = {
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName: string;
  classCourse: string;
  batch: string;
  rollNo: string;
  academicYear: string;
  mobileNo: string;
};

type InvoiceDraft = {
  studentId: string;
  title: string;
  particulars: string;
  amount: string;
  dueDate: string;
  paymentMode: string;
  notes: string;
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function createDraft(studentId = ""): InvoiceDraft {
  return {
    studentId,
    title: "Monthly Fee Invoice",
    particulars: "Monthly Tuition Fee",
    amount: "",
    dueDate: today(),
    paymentMode: "",
    notes: "",
  };
}

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatReceiptDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const dateOnly = value.split("T")[0];
  const parts = dateOnly.split("-");

  if (parts.length === 3 && parts[0]?.length === 4) {
    return `${Number(parts[2])}/${Number(parts[1])}/${parts[0]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function amountToWords(value: number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function belowThousand(input: number) {
    let remaining = input;
    const words: string[] = [];

    if (remaining >= 100) {
      words.push(`${ones[Math.floor(remaining / 100)]} Hundred`);
      remaining %= 100;
    }

    if (remaining >= 20) {
      words.push(tens[Math.floor(remaining / 10)] ?? "");
      remaining %= 10;
    }

    if (remaining > 0) {
      words.push(ones[remaining] ?? "");
    }

    return words.filter(Boolean).join(" ");
  }

  const number = Math.round(Number(value) || 0);

  if (number === 0) {
    return "Zero Rupees Only";
  }

  let remaining = number;
  const parts: string[] = [];

  const crore = Math.floor(remaining / 10_000_000);
  remaining %= 10_000_000;

  const lakh = Math.floor(remaining / 100_000);
  remaining %= 100_000;

  const thousand = Math.floor(remaining / 1_000);
  remaining %= 1_000;

  if (crore) {
    parts.push(`${belowThousand(crore)} Crore`);
  }

  if (lakh) {
    parts.push(`${belowThousand(lakh)} Lakh`);
  }

  if (thousand) {
    parts.push(`${belowThousand(thousand)} Thousand`);
  }

  if (remaining) {
    parts.push(belowThousand(remaining));
  }

  return `${parts.join(" ")} Rupees Only`;
}

function StatusBadge({ status }: { status: FeeInvoice["status"] }) {
  const className: Record<FeeInvoice["status"], string> = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    unpaid: "border-amber-200 bg-amber-50 text-amber-700",
    partial: "border-blue-200 bg-blue-50 text-blue-700",
    overdue: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${className[status]}`}
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
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">
        {value || "Not recorded"}
      </p>
    </div>
  );
}

export function InvoiceManager({
  role,
  feeInvoices,
  studentDirectory,
}: InvoiceManagerProps) {
  const canManage = role === "admin" || role === "educator";

  const [invoices, setInvoices] = useState<FeeInvoice[]>(feeInvoices);
  const [showForm, setShowForm] = useState(false);

  const [draft, setDraft] = useState<InvoiceDraft>(
    createDraft(studentDirectory[0]?.id ?? ""),
  );

  const [studentDetails, setStudentDetails] =
    useState<StudentFeeDetails | null>(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<FeeInvoice | null>(
    null,
  );

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const studentOptions = useMemo(
    () => [...studentDirectory].sort((a, b) => a.name.localeCompare(b.name)),
    [studentDirectory],
  );

  const totalOutstanding = useMemo(
    () =>
      invoices.reduce(
        (total, invoice) =>
          total + Math.max(invoice.amount - (invoice.paidAmount ?? 0), 0),
        0,
      ),
    [invoices],
  );

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  function updateDraft<K extends keyof InvoiceDraft>(
    key: K,
    value: InvoiceDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function loadStudentDetails(studentId: string) {
    updateDraft("studentId", studentId);
    setStudentDetails(null);

    if (!studentId) {
      return;
    }

    try {
      setIsLoadingDetails(true);

      const response = await fetch(
        `/api/invoices?studentId=${encodeURIComponent(studentId)}`,
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as {
        studentDetails?: StudentFeeDetails;
        error?: string;
      };

      if (!response.ok || !payload.studentDetails) {
        throw new Error(payload.error || "Unable to load student details.");
      }

      setStudentDetails(payload.studentDetails);
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to load student details.",
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function openInvoiceForm() {
    const studentId = studentOptions[0]?.id ?? "";

    setDraft(createDraft(studentId));
    setStudentDetails(null);
    setShowForm(true);

    if (studentId) {
      void loadStudentDetails(studentId);
    }
  }

  async function createInvoice() {
    const amount = Number(draft.amount);

    if (!draft.studentId) {
      showMessage("error", "Select a student first.");
      return;
    }

    if (!studentDetails) {
      showMessage("error", "Wait for the student details to load.");
      return;
    }

    if (!draft.title.trim()) {
      showMessage("error", "Enter an invoice title.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("error", "Enter a valid fee amount.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: draft.studentId,
          title: draft.title,
          particulars: draft.particulars,
          amount,
          dueDate: draft.dueDate,
          paymentMode: draft.paymentMode,
          notes: draft.notes,
        }),
      });

      const payload = (await response.json()) as {
        feeInvoice?: FeeInvoice;
        error?: string;
      };

      if (!response.ok || !payload.feeInvoice) {
        throw new Error(payload.error || "Unable to create invoice.");
      }

      setInvoices((current) => [payload.feeInvoice!, ...current]);
      setShowForm(false);
      setStudentDetails(null);
      setDraft(createDraft(studentOptions[0]?.id ?? ""));

      showMessage(
        "success",
        "Invoice created with student and batch details.",
      );
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error ? error.message : "Unable to create invoice.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInvoice(invoiceId: string) {
    try {
      setDeletingId(invoiceId);

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete invoice.");
      }

      setInvoices((current) =>
        current.filter((invoice) => invoice.id !== invoiceId),
      );

      setInvoiceToDelete(null);
      showMessage("success", "Invoice deleted.");
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error ? error.message : "Unable to delete invoice.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function downloadReceipt(invoice: FeeInvoice) {
    const popup = window.open("", "_blank", "width=1280,height=860");

    if (!popup) {
      showMessage("error", "Allow pop-ups to open the fee receipt.");
      return;
    }

    const paidAmount = invoice.paidAmount ?? 0;
    const balance = Math.max(invoice.amount - paidAmount, 0);
    const receiptNo = invoice.receiptNo || invoice.id;
    const signatureUrl = `${window.location.origin}/founder-sign.png`;

    const receiptHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt - ${escapeHtml(receiptNo)}</title>

  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 24px;
      background: #f3f4f6;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
    }

    .receipt {
      max-width: 1280px;
      margin: 0 auto;
      border: 2px solid #18181b;
      background: #fff;
    }

    .header {
      display: grid;
      grid-template-columns: 220px 1fr 160px;
      min-height: 120px;
      align-items: center;
      border-bottom: 2px solid #18181b;
    }

    .brand {
      padding: 20px;
      text-align: center;
      font-size: 18px;
      font-weight: 900;
    }

    .brand small {
      display: block;
      margin-top: 4px;
      color: #6b7280;
      font-size: 8px;
      letter-spacing: .12em;
    }

    .company {
      padding: 14px;
      text-align: center;
    }

    .company h1 {
      margin: 0;
      font-size: 27px;
    }

    .company p {
      margin: 5px 0 0;
      font-size: 14px;
    }

    .parent-copy {
      align-self: end;
      padding: 14px;
      text-align: right;
      font-size: 13px;
    }

    .title {
      border-bottom: 2px solid #18181b;
      padding: 8px;
      text-align: center;
      font-size: 18px;
      font-weight: 900;
      text-decoration: underline;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    .details td {
      padding: 7px 10px;
      border-bottom: 1px solid #9ca3af;
      font-size: 14px;
    }

    .details .label {
      width: 13%;
      font-weight: 900;
      white-space: nowrap;
    }

    .items th,
    .items td {
      padding: 9px 10px;
      border: 1px solid #9ca3af;
      font-size: 14px;
    }

    .items th {
      background: #f1f5f9;
      text-align: center;
    }

    .center { text-align: center; }
    .right { text-align: right; }

    .summary {
      border-top: 1px solid #18181b;
      padding: 10px 14px;
      font-size: 14px;
      line-height: 1.8;
    }

    .footer {
      display: flex;
      min-height: 140px;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
      border-top: 2px solid #18181b;
      padding: 14px;
    }

    .note {
      padding-bottom: 3px;
      font-size: 13px;
      font-weight: 700;
    }

    .signature {
      width: 240px;
      text-align: center;
    }

    .signature img {
      display: block;
      width: 180px;
      height: 72px;
      margin: 0 auto 4px;
      object-fit: contain;
      mix-blend-mode: multiply;
    }

    .signature-line {
      border-top: 1px solid #18181b;
      padding-top: 6px;
      font-size: 13px;
      font-weight: 900;
    }

    .signature-subtitle {
      margin-top: 3px;
      color: #475569;
      font-size: 11px;
    }

    .print-button {
      position: fixed;
      right: 24px;
      top: 24px;
      border: 0;
      border-radius: 10px;
      padding: 12px 17px;
      background: #2563eb;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
    }

    @media print {
      body {
        padding: 0;
        background: #fff;
      }

      .print-button {
        display: none;
      }
    }
  </style>
</head>

<body>
  <button class="print-button" onclick="window.print()">
    Print / Save as PDF
  </button>

  <main class="receipt">
    <header class="header">
      <div class="brand">
        SMART TUTORS
        <small>Learning for Future</small>
      </div>

      <div class="company">
        <h1>Smart Tutors</h1>
        <p><strong>Panvel Branch Office</strong></p>
        <p>Sector 5, New Panvel East, Panvel</p>
        <p>Phone: +91 8850447887 | Email: info@smarttutors.co.in</p>
      </div>

      <div class="parent-copy">Parent's Copy</div>
    </header>

    <div class="title">*Fee Receipt*</div>

    <table class="details">
      <tbody>
        <tr>
          <td class="label">Receipt No</td>
          <td>${escapeHtml(receiptNo)}</td>
          <td class="label">Receipt Date</td>
          <td>${escapeHtml(formatReceiptDate(invoice.createdAt))}</td>
        </tr>

        <tr>
          <td class="label">Student Name</td>
          <td>${escapeHtml(invoice.studentName)}</td>
          <td class="label">Parent Name</td>
          <td>${escapeHtml(invoice.parentName || "-")}</td>
        </tr>

        <tr>
          <td class="label">Class / Course</td>
          <td>${escapeHtml(invoice.classCourse || "-")}</td>
          <td class="label">Batch</td>
          <td>${escapeHtml(invoice.batch || "-")}</td>
        </tr>

        <tr>
          <td class="label">Roll No</td>
          <td>${escapeHtml(invoice.rollNo || "-")}</td>
          <td class="label">Academic Year</td>
          <td>${escapeHtml(invoice.academicYear || "-")}</td>
        </tr>

        <tr>
          <td class="label">Mobile No</td>
          <td>${escapeHtml(invoice.mobileNo || "-")}</td>
          <td class="label">Payment Mode</td>
          <td>${escapeHtml(invoice.paymentMode || "-")}</td>
        </tr>
      </tbody>
    </table>

    <table class="items">
      <thead>
        <tr>
          <th style="width:70px">Sr No</th>
          <th>Particulars</th>
          <th style="width:140px">Month</th>
          <th style="width:140px">Due Date</th>
          <th style="width:130px">Amount</th>
          <th style="width:130px">Paid</th>
          <th style="width:130px">Balance</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td class="center">1</td>
          <td>${escapeHtml(invoice.particulars || invoice.title)}</td>
          <td>${escapeHtml(invoice.month || "-")}</td>
          <td>${escapeHtml(formatReceiptDate(invoice.dueDate))}</td>
          <td class="right">${escapeHtml(formatCurrency(invoice.amount))}</td>
          <td class="right">${escapeHtml(formatCurrency(paidAmount))}</td>
          <td class="right">${escapeHtml(formatCurrency(balance))}</td>
        </tr>
      </tbody>
    </table>

    <section class="summary">
      <div>
        <strong>Amount in Words:</strong>
        ${escapeHtml(amountToWords(invoice.amount))}
      </div>

      <div>
        <strong>Payment Mode:</strong>
        ${escapeHtml(invoice.paymentMode || "-")}
        &nbsp; | &nbsp;
        <strong>Due Date:</strong>
        ${escapeHtml(formatReceiptDate(invoice.dueDate))}
      </div>

      <div>
        <strong>Print Date:</strong>
        ${escapeHtml(
          new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(new Date()),
        )}
      </div>
    </section>

    <footer class="footer">
      <div class="note">
        This is a computer generated receipt and does not require signature.
      </div>

      <div class="signature">
        <img src="${signatureUrl}" alt="Founder signature" />
        <div class="signature-line">Founder, Smart Tutors</div>
        <div class="signature-subtitle">Authorized Signatory</div>
      </div>
    </footer>
  </main>
</body>
</html>`;

const receiptBlob = new Blob([receiptHtml], {
  type: "text/html;charset=utf-8",
});

const receiptUrl = URL.createObjectURL(receiptBlob);

popup.location.replace(receiptUrl);
popup.focus();

window.setTimeout(() => {
  URL.revokeObjectURL(receiptUrl);
}, 120_000);
  }

  return (
    <section className="min-w-0 max-w-full space-y-6">
      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Fees
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Fee Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create invoices with student, course, batch, and parent details
              filled automatically.
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={showForm ? () => setShowForm(false) : openInvoiceForm}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {showForm ? "Cancel" : "New Invoice"}
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <DetailsCard label="Total invoices" value={`${invoices.length}`} />

          <DetailsCard
            label="Paid"
            value={`${
              invoices.filter((invoice) => invoice.status === "paid").length
            }`}
          />

          <DetailsCard
            label="Outstanding"
            value={formatCurrency(totalOutstanding)}
          />
        </div>
      </section>

      {showForm && canManage ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              New Invoice
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              Student details are locked to the database
            </h3>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldLabel label="Student *">
              <select
                value={draft.studentId}
                onChange={(event) =>
                  void loadStudentDetails(event.target.value)
                }
                className={fieldClass}
              >
                <option value="">Select student</option>

                {studentOptions.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.program}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Invoice Title *">
              <input
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Particulars">
              <input
                value={draft.particulars}
                onChange={(event) =>
                  updateDraft("particulars", event.target.value)
                }
                className={fieldClass}
                placeholder="Monthly Tuition Fee"
              />
            </FieldLabel>

            <FieldLabel label="Amount (₹) *">
              <input
                type="number"
                min="1"
                value={draft.amount}
                onChange={(event) => updateDraft("amount", event.target.value)}
                className={fieldClass}
                placeholder="2000"
              />
            </FieldLabel>

            <FieldLabel label="Due Date *">
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) =>
                  updateDraft("dueDate", event.target.value)
                }
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Payment Mode">
              <select
                value={draft.paymentMode}
                onChange={(event) =>
                  updateDraft("paymentMode", event.target.value)
                }
                className={fieldClass}
              >
                <option value="">Not paid yet</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Online Payment">Online Payment</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Notes">
              <input
                value={draft.notes}
                onChange={(event) => updateDraft("notes", event.target.value)}
                className={fieldClass}
                placeholder="Optional internal note"
              />
            </FieldLabel>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">
                  Auto-filled receipt details
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  These values come from the student, parent, and active batch
                  records.
                </p>
              </div>

              {isLoadingDetails ? (
                <span className="text-sm font-bold text-blue-700">
                  Loading student details...
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailsCard
                label="Parent Name"
                value={studentDetails?.parentName ?? ""}
              />

              <DetailsCard
                label="Class / Course"
                value={studentDetails?.classCourse ?? ""}
              />

              <DetailsCard label="Batch" value={studentDetails?.batch ?? ""} />

              <DetailsCard
                label="Mobile Number"
                value={studentDetails?.mobileNo ?? ""}
              />

              <DetailsCard
                label="Roll Number"
                value={studentDetails?.rollNo ?? ""}
              />

              <DetailsCard
                label="Academic Year"
                value={studentDetails?.academicYear ?? ""}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => void createInvoice()}
              disabled={isSaving || isLoadingDetails || !studentDetails}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </section>
      ) : null}

      <div className="min-w-0 w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-black">Student</th>
              <th className="px-5 py-4 font-black">Description</th>
              <th className="px-5 py-4 font-black">Amount</th>
              <th className="px-5 py-4 font-black">Paid</th>
              <th className="px-5 py-4 font-black">Balance</th>
              <th className="px-5 py-4 font-black">Due Date</th>
              <th className="px-5 py-4 font-black">Status</th>
              <th className="px-5 py-4 text-right font-black">Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => {
              const balance = Math.max(
                invoice.amount - (invoice.paidAmount ?? 0),
                0,
              );

              return (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-black text-slate-950">
                    {invoice.studentName}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {invoice.title}
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-950">
                    {formatCurrency(invoice.amount)}
                  </td>

                  <td className="px-5 py-4 font-bold text-emerald-600">
                    {formatCurrency(invoice.paidAmount ?? 0)}
                  </td>

                  <td className="px-5 py-4 font-black text-slate-950">
                    {formatCurrency(balance)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {invoice.dueDate}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={invoice.status} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex min-w-[260px] justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => downloadReceipt(invoice)}
                        className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                      >
                        Download Receipt
                      </button>

                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => setInvoiceToDelete(invoice)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!invoices.length ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">
            No invoices have been created yet.
          </div>
        ) : null}
      </div>

      {invoiceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-950">
              Delete invoice?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Delete the invoice for{" "}
              <strong>{invoiceToDelete.studentName}</strong>? This cannot be
              undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingId === invoiceToDelete.id}
                onClick={() => void deleteInvoice(invoiceToDelete.id)}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
              >
                {deletingId === invoiceToDelete.id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}