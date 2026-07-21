"use client";

import { type ReactNode, useMemo, useState } from "react";

import type { FeeInvoice, ManagedUser, PaymentMode, Role } from "@/lib/types";

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
  enrollmentDate: string;
  email: string;
  address: string;
  admissionType: string;
  batchTiming: string;
  courseDuration: string;
};

type ReceiptFeeInvoice = FeeInvoice & {
  batch?: string;
  enrollmentDate?: string;
  email?: string;
  address?: string;
  admissionType?: string;
  batchTiming?: string;
  courseDuration?: string;
};

type InvoiceDraft = {
  studentId: string;
  title: string;
  particulars: string;
  amount: string;
  dueDate: string;
  paymentMode: PaymentMode | "";
  transactionId: string;
  chequeNumber: string;
  bankName: string;
  accountLast4: string;
  notes: string;
};

type PaymentDraft = {
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
    transactionId: "",
    chequeNumber: "",
    bankName: "",
    accountLast4: "",
    notes: "",
  };
}

function createPaymentDraft(remainingBalance: number): PaymentDraft {
  return {
    paidAmount: String(remainingBalance),
    paidDate: today(),
    paymentMode: "Cash",
    transactionId: "",
    chequeNumber: "",
    bankName: "",
    accountLast4: "",
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
function formatReceiptClassBoard(value?: string) {
  const text = value?.trim() ?? "";

  if (!text) {
    return "—";
  }

  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const category = parts[0]?.toLowerCase();

  const isExamCategory =
    category === "competitive exams" ||
    category === "competitive exam" ||
    category === "govt exams" ||
    category === "govt exam" ||
    category === "government exams" ||
    category === "government exam";

  if (isExamCategory && parts.length > 1) {
    return parts
      .slice(1)
      .join(" | ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return text;
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
  const canManage = role === "admin";

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

  const [invoiceToPay, setInvoiceToPay] = useState<FeeInvoice | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(
    createPaymentDraft(0),
  );
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

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

      const bodyPayload: Record<string, unknown> = {
        studentId: draft.studentId,
        title: draft.title,
        particulars: draft.particulars,
        amount,
        dueDate: draft.dueDate,
        notes: draft.notes,
      };

      if (draft.paymentMode) {
        bodyPayload.paymentMode = draft.paymentMode;
        bodyPayload.transaction = {
          paidAmount: amount,
          paidDate: draft.dueDate,
          paymentMode: draft.paymentMode,
          transactionId: draft.transactionId || undefined,
          chequeNumber: draft.chequeNumber || undefined,
          bankName: draft.bankName || undefined,
          accountLast4: draft.accountLast4 || undefined,
        };
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
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

      showMessage("success", "Invoice created with student and batch details.");
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

  function openPaymentModal(invoice: FeeInvoice) {
    const remaining = Math.max(invoice.amount - (invoice.paidAmount ?? 0), 0);
    setInvoiceToPay(invoice);
    setPaymentDraft(createPaymentDraft(remaining));
  }

  function updatePaymentDraft<K extends keyof PaymentDraft>(
    key: K,
    value: PaymentDraft[K],
  ) {
    setPaymentDraft((current) => ({ ...current, [key]: value }));
  }

  async function recordPayment() {
    if (!invoiceToPay) return;

    const amount = Number(paymentDraft.paidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("error", "Enter a valid paid amount.");
      return;
    }

    const remaining = Math.max(
      invoiceToPay.amount - (invoiceToPay.paidAmount ?? 0),
      0,
    );
    if (amount > remaining) {
      showMessage(
        "error",
        `Paid amount cannot exceed the outstanding balance of ₹${remaining.toLocaleString("en-IN")}.`,
      );
      return;
    }

    try {
      setIsRecordingPayment(true);

      const response = await fetch(`/api/invoices/${invoiceToPay.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: {
            paidAmount: amount,
            paidDate: paymentDraft.paidDate,
            paymentMode: paymentDraft.paymentMode,
            transactionId: paymentDraft.transactionId,
            chequeNumber: paymentDraft.chequeNumber,
            bankName: paymentDraft.bankName,
            accountLast4: paymentDraft.accountLast4,
            notes: paymentDraft.notes,
          },
        }),
      });

      const payload = (await response.json()) as {
        feeInvoice?: FeeInvoice;
        error?: string;
      };

      if (!response.ok || !payload.feeInvoice) {
        throw new Error(payload.error || "Unable to record payment.");
      }

      setInvoices((current) =>
        current.map((inv) =>
          inv.id === payload.feeInvoice!.id ? payload.feeInvoice! : inv,
        ),
      );

      setInvoiceToPay(null);
      showMessage("success", "Payment recorded successfully.");
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error ? error.message : "Unable to record payment.",
      );
    } finally {
      setIsRecordingPayment(false);
    }
  }

  function downloadReceipt(invoice: FeeInvoice) {
    const popup = window.open("", "_blank", "width=1280,height=960");

    if (!popup) {
      showMessage("error", "Allow pop-ups to open the fee receipt.");
      return;
    }

    const receiptInvoice = invoice as ReceiptFeeInvoice;
    const paidAmount = invoice.paidAmount ?? 0;
    const balance = Math.max(invoice.amount - paidAmount, 0);
    const receiptNo = invoice.receiptNo || invoice.id;
    const logoUrl = `${window.location.origin}/stpl.jpeg`;
    const signatureUrl = `${window.location.origin}/founder-sign.png`;
    const transactions = invoice.transactions ?? [];
    const now = new Date();

    const printDateStr = `${now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}, ${now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;

    const academicYear = receiptInvoice.academicYear || "—";
    const academicStartYear = Number(academicYear.split("-")[0]);
    const generatedCourseDuration = Number.isFinite(academicStartYear)
      ? `April ${academicStartYear} – March ${academicStartYear + 1}`
      : "—";

    const enrollmentNo =
      receiptInvoice.rollNo?.trim() ||
      invoice.studentId
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 14)
        .toUpperCase() ||
      "—";

    const paymentMode =
      receiptInvoice.paymentMode || transactions.at(-1)?.paymentMode || "—";

    const monthLabel =
      invoice.month ||
      new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(new Date(`${invoice.dueDate}T12:00:00`));

    const classBoard = formatReceiptClassBoard(receiptInvoice.classCourse);
    const statusLabels: Record<string, string> = {
      paid: "PAID",
      partial: "PAID (Partially)",
      unpaid: "UNPAID",
      overdue: "OVERDUE",
    };
    const statusLabel = statusLabels[invoice.status] ?? "UNPAID";

    const historyRows = transactions.length
      ? transactions
          .map(
            (transaction, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(formatReceiptDate(transaction.paidDate))}</td>
                <td>${escapeHtml(formatCurrency(transaction.paidAmount))}</td>
                <td>${escapeHtml(transaction.paymentMode)}</td>
                <td>${escapeHtml(
                  transaction.transactionId || transaction.chequeNumber || "—",
                )}</td>
                <td>${escapeHtml(transaction.bankName || "—")}</td>
              </tr>`,
          )
          .join("")
      : `
          <tr>
            <td>1</td>
            <td>${paidAmount > 0 ? escapeHtml(formatReceiptDate(invoice.createdAt)) : "—"}</td>
            <td>${paidAmount > 0 ? escapeHtml(formatCurrency(paidAmount)) : "—"}</td>
            <td>${paidAmount > 0 ? escapeHtml(paymentMode) : "—"}</td>
            <td>${escapeHtml(receiptInvoice.transactionId || "—")}</td>
            <td>—</td>
          </tr>`;

    const NAVY = "#071a52";
    const LINE = "#9eabc2";

    const receiptHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fee Receipt - ${escapeHtml(receiptNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 7mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background: #d9dde5;
      color: ${NAVY};
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .toolbar {
      width: min(210mm, calc(100% - 24px));
      margin: 14px auto 10px;
      display: flex;
      justify-content: flex-end;
    }
    .print-button {
      border: 0;
      border-radius: 8px;
      background: ${NAVY};
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 800;
      padding: 10px 20px;
    }
    .receipt-page {
      width: min(210mm, calc(100% - 24px));
      min-height: 297mm;
      margin: 0 auto 20px;
      padding: 0 5mm 4mm;
      overflow: hidden;
      border: 1.6px solid ${NAVY};
      background: #fff;
      box-shadow: 0 8px 28px rgba(15, 23, 42, .18);
    }
    .top-strip {
      height: 7mm;
      margin: 0 -5mm;
      background: ${NAVY};
    }
    .brand {
      height: 54mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .brand img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .brand-divider { border-top: 1.5px solid ${NAVY}; }
    .receipt-title {
      margin: 4mm 0 2.5mm;
      text-align: center;
      color: ${NAVY};
      font-size: 25px;
      font-weight: 900;
      letter-spacing: .02em;
    }
    .receipt-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 0 2mm 3.5mm;
      font-size: 11px;
      font-weight: 800;
    }
    .receipt-meta > div:last-child { text-align: right; }
    .meta-value { margin-left: 8px; font-weight: 500; }
    .section-heading {
      margin-top: 3mm;
      padding: 2.4mm 3mm;
      background: ${NAVY};
      color: #fff;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .035em;
      text-transform: uppercase;
    }
    .details-table {
      border-right: 1px solid ${LINE};
      border-bottom: 1px solid ${LINE};
      border-left: 1px solid ${LINE};
    }
    .details-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 1px solid ${LINE};
    }
    .details-row:first-child { border-top: 0; }
    .detail-item {
      min-height: 10.3mm;
      display: grid;
      grid-template-columns: 35mm 5mm 1fr;
      align-items: center;
      padding: 1.5mm 2.5mm;
    }
    .detail-item:first-child { border-right: 1px solid ${LINE}; }
    .detail-label { font-weight: 900; }
    .detail-separator { text-align: center; }
    .detail-value {
      min-width: 0;
      overflow-wrap: anywhere;
      color: #172b60;
      font-weight: 500;
    }
    table { width: 100%; border-collapse: collapse; }
    .fee-table th {
      padding: 2.6mm 1.5mm;
      border: 1px solid #fff;
      background: ${NAVY};
      color: #fff;
      font-size: 10px;
      font-weight: 900;
      text-align: center;
    }
    .fee-table td {
      min-height: 13mm;
      padding: 2.5mm 1.5mm;
      border: 1px solid ${LINE};
      color: #142758;
      text-align: center;
      vertical-align: middle;
    }
    .fee-table td.particulars { text-align: left; font-weight: 700; }
    .fee-table td.money { text-align: right; font-weight: 800; white-space: nowrap; }
    .amount-words {
      display: grid;
      grid-template-columns: 34mm 1fr;
      align-items: center;
      min-height: 10mm;
      padding: 1.5mm 2.5mm;
      border-right: 1px solid ${LINE};
      border-bottom: 1px solid ${LINE};
      border-left: 1px solid ${LINE};
    }
    .amount-words strong { font-weight: 900; }
    .summary {
      margin-top: 4mm;
      padding: 3mm 2mm 2mm;
      border-top: 1.5px solid ${NAVY};
    }
    .summary-main {
      display: grid;
      grid-template-columns: 1.35fr 1fr 1fr;
      align-items: center;
      gap: 4mm;
      font-weight: 900;
    }
    .summary-item { display: flex; align-items: center; gap: 2mm; }
    .summary-item:nth-child(2) { justify-content: center; }
    .summary-item:nth-child(3) { justify-content: flex-end; }
    .paid-pill {
      display: inline-flex;
      align-items: center;
      gap: 1.5mm;
      padding: 1.2mm 3mm;
      border-radius: 999px;
      border: 1px solid #a7e3b1;
      background: #dff7e3;
      color: #16932f;
      font-weight: 900;
    }
    .paid-check {
      width: 5.5mm;
      height: 5.5mm;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #16a34a;
      color: #fff;
      font-size: 10px;
      line-height: 1;
    }
    .summary-green { color: #07983a; }
    .summary-red { color: #d11f2d; }
    .summary-dates {
      display: flex;
      gap: 6mm;
      align-items: center;
      margin-top: 3mm;
      font-weight: 800;
    }
    .summary-dates .divider { color: ${LINE}; }
    .history-table th {
      padding: 2.2mm 1.6mm;
      border: 1px solid ${LINE};
      background: #f7f8fb;
      color: ${NAVY};
      font-size: 10px;
      font-weight: 900;
      text-align: center;
    }
    .history-table td {
      padding: 2.2mm 1.6mm;
      border: 1px solid ${LINE};
      text-align: center;
      color: #142758;
    }
.footer {
  display: grid;
  grid-template-columns: 1fr 50mm;
  gap: 8mm;
  align-items: end;
  margin-top: 3.5mm;
  padding: 2.5mm 2mm 0;
  border-top: 1.5px solid ${NAVY};
}
    .terms { font-size: 8.6px; line-height: 1.75; }
    .terms ul { margin: 0; padding-left: 4mm; }
.signature {
  width: 54mm;
  justify-self: end;
  text-align: center;
  color: ${NAVY};
}

.signature img {
  display: block;
  width: 47mm;
  height: 19mm;
  margin: 0 auto;
  object-fit: contain;
}

.signature-rule {
  width: 48mm;
  margin: 0 auto 1.2mm;
  border-top: 1.2px solid ${NAVY};
}

.signature strong {
  display: block;
  margin-bottom: 0.7mm;
  font-size: 9.5px;
  line-height: 1.2;
}

.signature span {
  display: block;
  font-size: 7.8px;
  line-height: 1.35;
}
.bottom-note {
  padding: 2.5mm 2mm 0;
  color: #697794;
  font-size: 7px;
  text-align: center;
}
    @media (max-width: 760px) {
      body { background: #fff; }
      .toolbar { width: calc(100% - 16px); }
      .receipt-page { width: calc(100% - 8px); margin-bottom: 0; padding: 0 3mm 3mm; }
      .top-strip { margin: 0 -3mm; }
      .brand { height: 42mm; }
      .detail-item { grid-template-columns: 30mm 4mm 1fr; font-size: 9px; }
      .fee-table, .history-table { font-size: 8px; }
    }
    @media print {
      body { background: #fff !important; }
      .toolbar { display: none !important; }
      .receipt-page {
        width: 100%;
        min-height: 0;
        margin: 0;
        padding: 0 4mm 3mm;
        border: 1.4px solid ${NAVY};
        box-shadow: none;
      }
      .top-strip { margin: 0 -4mm; }
      .brand { height: 50mm; }
      .receipt-title { margin-top: 3mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print-button" onclick="window.print()">Print Receipt</button>
  </div>

  <main class="receipt-page">
    <div class="top-strip"></div>

    <div class="brand">
      <img src="${escapeHtml(logoUrl)}" alt="Smart Tutors Pvt. Ltd." />
    </div>

    <div class="brand-divider"></div>
    <h1 class="receipt-title">FEE RECEIPT</h1>

    <div class="receipt-meta">
      <div>Receipt No. <span class="meta-value">: &nbsp;${escapeHtml(receiptNo)}</span></div>
      <div>Receipt Date <span class="meta-value">: &nbsp;${escapeHtml(
        formatReceiptDate(invoice.createdAt || invoice.dueDate),
      )}</span></div>
    </div>

    <div class="section-heading">Student Details</div>
    <section class="details-table">
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Student Name</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(invoice.studentName || "—")}</span></div>
        <div class="detail-item"><span class="detail-label">Parent Name</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.parentName || "—")}</span></div>
      </div>
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Class / Board</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(classBoard)}</span></div>
        <div class="detail-item"><span class="detail-label">Enrollment Date</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(formatReceiptDate(receiptInvoice.enrollmentDate || invoice.createdAt))}</span></div>
      </div>
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Enrollment No.</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(enrollmentNo)}</span></div>
        <div class="detail-item"><span class="detail-label">Academic Year</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(academicYear)}</span></div>
      </div>
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Mobile No.</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.mobileNo || "—")}</span></div>
        <div class="detail-item"><span class="detail-label">Payment Mode</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(paymentMode)}</span></div>
      </div>
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Email ID</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.email || "—")}</span></div>
        <div class="detail-item"><span class="detail-label">Admission Type</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.admissionType || "Regular")}</span></div>
      </div>
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Address</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.address || "—")}</span></div>
        <div class="detail-item"><span class="detail-label">Batch Timing</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.batchTiming || receiptInvoice.batch || "—")}</span></div>
      </div>
      <div class="details-row">
        <div class="detail-item"><span class="detail-label">Course Duration</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.courseDuration || generatedCourseDuration)}</span></div>
        <div class="detail-item"><span class="detail-label">Batch</span><span class="detail-separator">:</span><span class="detail-value">${escapeHtml(receiptInvoice.batch || "—")}</span></div>
      </div>
    </section>

    <div class="section-heading">Fee Details</div>
    <table class="fee-table">
      <colgroup>
        <col style="width:8%" />
        <col style="width:21%" />
        <col style="width:13%" />
        <col style="width:14%" />
        <col style="width:12%" />
        <col style="width:11%" />
        <col style="width:10.5%" />
        <col style="width:10.5%" />
      </colgroup>
      <thead>
        <tr>
          <th>Sr. No.</th>
          <th>Particulars</th>
          <th>Course</th>
          <th>Installment</th>
          <th>Due Date</th>
          <th>Total Fee (₹)</th>
          <th>Paid (₹)</th>
          <th>Balance (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td class="particulars">${escapeHtml(invoice.particulars || invoice.title || "Fee")}</td>
          <td>${escapeHtml(classBoard)}</td>
          <td>${escapeHtml(monthLabel)}</td>
          <td>${escapeHtml(formatReceiptDate(invoice.dueDate))}</td>
          <td class="money">${escapeHtml(formatCurrency(invoice.amount))}</td>
          <td class="money">${escapeHtml(formatCurrency(paidAmount))}</td>
          <td class="money">${escapeHtml(formatCurrency(balance))}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-words">
      <strong>Amount in Words</strong>
      <span>: &nbsp;${escapeHtml(amountToWords(invoice.amount))}</span>
    </div>

    <section class="summary">
      <div class="summary-main">
        <div class="summary-item">
          <span>Payment Status&nbsp; :</span>
          <span class="paid-pill"><span class="paid-check">✓</span>${escapeHtml(statusLabel)}</span>
        </div>
        <div class="summary-item">Total Paid&nbsp; : <span class="summary-green">${escapeHtml(formatCurrency(paidAmount))}</span></div>
        <div class="summary-item">Balance Due&nbsp; : <span class="${balance > 0 ? "summary-red" : "summary-green"}">${escapeHtml(formatCurrency(balance))}</span></div>
      </div>
      <div class="summary-dates">
        <span>Due Date&nbsp; : &nbsp;${escapeHtml(formatReceiptDate(invoice.dueDate))}</span>
        <span class="divider">|</span>
        <span>Print Date&nbsp; : &nbsp;${escapeHtml(printDateStr)}</span>
      </div>
    </section>

    <div class="section-heading">Payment History</div>
    <table class="history-table">
      <thead>
        <tr>
          <th style="width:8%">#</th>
          <th style="width:18%">Date</th>
          <th style="width:18%">Amount (₹)</th>
          <th style="width:17%">Mode</th>
          <th style="width:25%">Transaction Ref</th>
          <th style="width:14%">Bank</th>
        </tr>
      </thead>
      <tbody>${historyRows}</tbody>
    </table>

    <footer class="footer">
      <div class="terms">
        <ul>
          <li>This is a computer-generated receipt and does not require a physical signature.</li>
          <li>Fees once paid are non-refundable under any circumstances.</li>
          <li>Thank you for choosing Smart Tutors Pvt. Ltd. We appreciate your trust.</li>
        </ul>
      </div>

<div class="signature">
  <img
    src="${escapeHtml(signatureUrl)}"
    alt="Ravi Rana signature"
  />

  <div class="signature-rule"></div>

  <strong>Authorized Signatory</strong>
  <span>Mr. Ravi Rana</span>
  <span>Director &amp; Founder</span>
  <span>Smart Tutors Pvt. Ltd.</span>
</div>

    </footer>

<div class="bottom-note">
  www.smarttutors.co.in
</div>
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
                onChange={(event) => updateDraft("dueDate", event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Payment Status *">
              <select
                value={draft.paymentMode}
                onChange={(event) =>
                  updateDraft(
                    "paymentMode",
                    event.target.value as PaymentMode | "",
                  )
                }
                className={fieldClass}
              >
                <option value="">Unpaid</option>
                <option value="Cash">Paid - Cash</option>
                <option value="UPI">Paid - UPI</option>
                <option value="Bank Transfer">Paid - Bank Transfer</option>
                <option value="Card">Paid - Card</option>
                <option value="Online Payment">Paid - Online Payment</option>
                <option value="Cheque">Paid - Cheque</option>
              </select>
            </FieldLabel>

            {draft.paymentMode && draft.paymentMode !== "Cash" ? (
              <>
                {draft.paymentMode === "Cheque" ? (
                  <FieldLabel label="Cheque Number">
                    <input
                      value={draft.chequeNumber}
                      onChange={(event) =>
                        updateDraft("chequeNumber", event.target.value)
                      }
                      className={fieldClass}
                      placeholder="Cheque number"
                    />
                  </FieldLabel>
                ) : null}

                <FieldLabel label="Transaction ID / Reference">
                  <input
                    value={draft.transactionId}
                    onChange={(event) =>
                      updateDraft("transactionId", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="UPI ref, NEFT/RTGS ref, etc."
                  />
                </FieldLabel>

                <FieldLabel label="Bank Name">
                  <input
                    value={draft.bankName}
                    onChange={(event) =>
                      updateDraft("bankName", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="Bank name"
                  />
                </FieldLabel>

                <FieldLabel label="Account Last 4 Digits">
                  <input
                    value={draft.accountLast4}
                    onChange={(event) =>
                      updateDraft("accountLast4", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="XXXX"
                    maxLength={4}
                  />
                </FieldLabel>
              </>
            ) : null}

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

                  <td className="px-5 py-4 text-slate-600">{invoice.title}</td>

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
                    <div className="flex min-w-[340px] justify-end gap-2">
                      {canManage && balance > 0 ? (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(invoice)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Record Payment
                        </button>
                      ) : null}

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
                {deletingId === invoiceToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {invoiceToPay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
              Record Payment
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              Payment for {invoiceToPay.studentName}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Outstanding balance:{" "}
              <strong>
                {formatCurrency(
                  Math.max(
                    invoiceToPay.amount - (invoiceToPay.paidAmount ?? 0),
                    0,
                  ),
                )}
              </strong>
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldLabel label="Amount (₹) *">
                <input
                  type="number"
                  min="1"
                  value={paymentDraft.paidAmount}
                  onChange={(event) =>
                    updatePaymentDraft("paidAmount", event.target.value)
                  }
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Payment Date *">
                <input
                  type="date"
                  value={paymentDraft.paidDate}
                  onChange={(event) =>
                    updatePaymentDraft("paidDate", event.target.value)
                  }
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Payment Mode *">
                <select
                  value={paymentDraft.paymentMode}
                  onChange={(event) =>
                    updatePaymentDraft(
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
              </FieldLabel>

              <FieldLabel label="Notes">
                <input
                  value={paymentDraft.notes}
                  onChange={(event) =>
                    updatePaymentDraft("notes", event.target.value)
                  }
                  className={fieldClass}
                  placeholder="Optional"
                />
              </FieldLabel>
            </div>

            {paymentDraft.paymentMode !== "Cash" ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">
                  Transaction Details
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {paymentDraft.paymentMode === "Cheque" ? (
                    <FieldLabel label="Cheque Number">
                      <input
                        value={paymentDraft.chequeNumber}
                        onChange={(event) =>
                          updatePaymentDraft("chequeNumber", event.target.value)
                        }
                        className={fieldClass}
                        placeholder="Cheque number"
                      />
                    </FieldLabel>
                  ) : null}

                  <FieldLabel label="Transaction ID / Reference">
                    <input
                      value={paymentDraft.transactionId}
                      onChange={(event) =>
                        updatePaymentDraft("transactionId", event.target.value)
                      }
                      className={fieldClass}
                      placeholder="UPI ref, NEFT/RTGS ref, etc."
                    />
                  </FieldLabel>

                  <FieldLabel label="Bank Name">
                    <input
                      value={paymentDraft.bankName}
                      onChange={(event) =>
                        updatePaymentDraft("bankName", event.target.value)
                      }
                      className={fieldClass}
                      placeholder="Bank name"
                    />
                  </FieldLabel>

                  <FieldLabel label="Account Last 4 Digits">
                    <input
                      value={paymentDraft.accountLast4}
                      onChange={(event) =>
                        updatePaymentDraft("accountLast4", event.target.value)
                      }
                      className={fieldClass}
                      placeholder="XXXX"
                      maxLength={4}
                    />
                  </FieldLabel>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInvoiceToPay(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={() => void recordPayment()}
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
