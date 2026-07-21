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
    const popup = window.open("", "_blank", "width=1280,height=900");

    if (!popup) {
      showMessage("error", "Allow pop-ups to open the fee receipt.");
      return;
    }

    const paidAmount = invoice.paidAmount ?? 0;
    const balance = Math.max(invoice.amount - paidAmount, 0);
    const receiptNo = invoice.receiptNo || invoice.id;
    const logoUrl = `${window.location.origin}/stpl.jpeg`;
    const signatureUrl = `${window.location.origin}/founder-sign.png`;
    const transactions = invoice.transactions ?? [];
    const now = new Date();
    const printDateStr =
      now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    const statusLabels: Record<string, string> = {
      paid: "PAID",
      partial: "PAID (Partially)",
      unpaid: "UNPAID",
      overdue: "OVERDUE",
    };
    const statusBadgeColors: Record<string, string> = {
      paid: "background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;",
      partial: "background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;",
      unpaid: "background:#fef3c7;color:#92400e;border:1px solid #fcd34d;",
      overdue: "background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;",
    };
    const badgeStyle =
      statusBadgeColors[invoice.status] ?? statusBadgeColors.unpaid;
    const statusLabel = statusLabels[invoice.status] ?? "UNPAID";

    function renderTransactionRows(): string {
      if (!transactions.length) return "";
      const rows = transactions
        .map(
          (t, i) => `
        <tr>
          <td class="hist-td">${i + 1}</td>
          <td class="hist-td">${escapeHtml(formatReceiptDate(t.paidDate))}</td>
          <td class="hist-td" style="text-align:right;font-weight:700;">${escapeHtml(formatCurrency(t.paidAmount))}</td>
          <td class="hist-td">${escapeHtml(t.paymentMode)}</td>
          <td class="hist-td">${escapeHtml(t.transactionId || t.chequeNumber || "-")}</td>
          <td class="hist-td">${escapeHtml(t.bankName || "-")}</td>
        </tr>`,
        )
        .join("");

      return `
      <div style="margin-top:20px;">
        <div class="sec-head">Payment History</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #d1d5db;">
          <thead><tr>
            <th class="hist-th" style="width:40px;">#</th>
            <th class="hist-th">Date</th>
            <th class="hist-th" style="text-align:right;">Amount</th>
            <th class="hist-th">Mode</th>
            <th class="hist-th">Transaction Ref</th>
            <th class="hist-th">Bank</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }

    const NAVY = "#0f1f45";
    const receiptHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt - ${escapeHtml(receiptNo)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 24px; background: #e5e7eb; color: #111827; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    .receipt-wrap { max-width: 850px; margin: 0 auto; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.receipt-logo-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  background: #fff;
}

.receipt-logo {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  margin: 0;
  transform: none;
}
    .receipt-box { border: 1.5px solid ${NAVY}; margin: 8px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .sec-head { background: ${NAVY} !important; color: #fff !important; padding: 6px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .detail-cell { flex: 1; display: flex; padding: 7px 12px; align-items: center; }
    .detail-cell:first-child { border-right: 1px solid #d1d5db; }
    .detail-lbl { width: 120px; font-weight: 700; color: #374151; white-space: nowrap; }
    .detail-sep { margin: 0 6px; color: #9ca3af; }
    .detail-val { color: #475569; }
    .fee-th { border: 1px solid #d1d5db; padding: 8px 10px; background: ${NAVY} !important; color: #fff !important; font-weight: 600; text-align: center; font-size: 12px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .fee-td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: center; font-size: 13px; }
    .hist-th { padding: 8px 10px; border: 1px solid #d1d5db; background: #f1f5f9 !important; font-size: 12px; text-align: center; font-weight: 700; color: #334155; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .hist-td { padding: 8px 10px; border: 1px solid #d1d5db; text-align: center; font-size: 13px; }
    .badge { display: inline-block; padding: 3px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; background: ${NAVY} !important; color: #fff !important; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 20px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @media print {
      body { padding: 0; background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-btn { display: none !important; }
      .receipt-wrap { margin: 0; border: none; }
      .receipt-box { margin: 0; border: none; }
.receipt-logo {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  margin: 0 !important;
  transform: none !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
    }
  </style>
</head>
<body>
  <div style="max-width:850px;margin:0 auto;">
    <button class="print-btn" onclick="window.print();">Print Receipt</button>
  </div>

  <div class="receipt-wrap">
    <div class="receipt-box">

      <!-- Full-width Header Banner -->
<div class="receipt-logo-wrap">
  <img
    src="${escapeHtml(logoUrl)}"
    alt="Smart Tutors Pvt. Ltd."
    class="receipt-logo"
  />
</div>

      <!-- Content Area -->
      <div style="padding:20px 24px;">

        <!-- Title -->
        <div style="text-align:center;font-size:22px;font-weight:900;color:${NAVY};margin:12px 0 14px;letter-spacing:0.08em;">FEE RECEIPT</div>

        <!-- Receipt Meta -->
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px;">
          <div><span>Receipt No.</span><span style="margin:0 8px;">:</span><span style="font-weight:500;color:#475569;">${escapeHtml(receiptNo)}</span></div>
          <div><span>Receipt Date</span><span style="margin:0 8px;">:</span><span style="font-weight:500;color:#475569;">${escapeHtml(formatReceiptDate(invoice.createdAt || invoice.dueDate))}</span></div>
        </div>

        <!-- Student Details -->
        <div class="sec-head">Student Details</div>
        <div style="border:1px solid #d1d5db;font-size:13px;margin-bottom:16px;">
          <div style="display:flex;border-bottom:1px solid #d1d5db;">
            <div class="detail-cell" style="border-right:1px solid #d1d5db;"><span class="detail-lbl">Student Name</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(invoice.studentName || "\u2014")}</span></div>
            <div class="detail-cell"><span class="detail-lbl">Parent Name</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(invoice.parentName || "\u2014")}</span></div>
          </div>
          <div style="display:flex;border-bottom:1px solid #d1d5db;">
            <div class="detail-cell" style="border-right:1px solid #d1d5db;"><span class="detail-lbl">Class / Board</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(
              formatReceiptClassBoard(invoice.classCourse),
            )}</span></div>
            <div class="detail-cell"><span class="detail-lbl">Enrollment No.</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml((invoice.studentId || "\u2014").replace("-", "").substring(0, 8).toUpperCase())}</span></div>
          </div>
          <div style="display:flex;border-bottom:1px solid #d1d5db;">
            <div class="detail-cell" style="border-right:1px solid #d1d5db;"><span class="detail-lbl">Academic Year</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(invoice.academicYear || "\u2014")}</span></div>
            <div class="detail-cell"><span class="detail-lbl">Payment Mode</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(invoice.paymentMode || "\u2014")}</span></div>
          </div>
          <div style="display:flex;">
            <div class="detail-cell" style="border-right:1px solid #d1d5db;"><span class="detail-lbl">Mobile No.</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(invoice.mobileNo || "\u2014")}</span></div>
            <div class="detail-cell"><span class="detail-lbl">Invoice ID</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(invoice.id || "\u2014")}</span></div>
          </div>
        </div>

        <!-- Fee Details -->
        <div class="sec-head">Fee Details</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #d1d5db;">
          <thead>
            <tr>
              <th class="fee-th" style="width:50px;">Sr No.</th>
              <th class="fee-th" style="text-align:left;">Particulars</th>
              <th class="fee-th">Month</th>
              <th class="fee-th">Due Date</th>
              <th class="fee-th" style="text-align:right;">Amount</th>
              <th class="fee-th" style="text-align:right;">Paid</th>
              <th class="fee-th" style="text-align:right;">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="fee-td">1</td>
              <td class="fee-td" style="text-align:left;font-weight:600;">${escapeHtml(invoice.title || "Fee")}${invoice.particulars ? " \u2014 " + escapeHtml(invoice.particulars) : ""}</td>
              <td class="fee-td">${escapeHtml(invoice.month || "\u2014")}</td>
              <td class="fee-td">${escapeHtml(formatReceiptDate(invoice.dueDate))}</td>
              <td class="fee-td" style="text-align:right;font-weight:700;">${escapeHtml(formatCurrency(invoice.amount))}</td>
              <td class="fee-td" style="text-align:right;font-weight:700;">${escapeHtml(formatCurrency(paidAmount))}</td>
              <td class="fee-td" style="text-align:right;font-weight:700;color:${balance > 0 ? "#dc2626" : "#16a34a"};">${escapeHtml(formatCurrency(balance))}</td>
            </tr>
          </tbody>
        </table>
        <!-- Amount in Words -->
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:8px 12px;background:#f8fafc !important;border:1px solid #d1d5db;border-top:none;margin-bottom:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <span style="color:#374151;white-space:nowrap;">Amount in Words :</span>
          <span style="color:#475569;font-weight:500;">${escapeHtml(amountToWords(invoice.amount))}</span>
        </div>

        <!-- Payment Summary -->
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:#1e293b;padding:10px 2px;border-top:2px solid ${NAVY};margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#64748b;">Payment Status</span><span style="color:#9ca3af;margin:0 2px;">:</span>
            <span class="badge" style="${badgeStyle}">${escapeHtml(statusLabel)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#64748b;">Total Paid</span><span style="color:#9ca3af;margin:0 2px;">:</span>
            <span style="font-weight:800;color:#16a34a;">${escapeHtml(formatCurrency(paidAmount))}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#64748b;">Balance Due</span><span style="color:#9ca3af;margin:0 2px;">:</span>
            <span style="font-weight:800;color:${balance > 0 ? "#dc2626" : "#16a34a"};">${escapeHtml(formatCurrency(balance))}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;font-size:13px;font-weight:700;color:#1e293b;padding:4px 2px 16px;border-bottom:1px solid #e5e7eb;margin-bottom:20px;">
          <div><span style="color:#64748b;">Due Date</span><span style="color:#d1d5db;margin:0 4px;">:</span><span>${escapeHtml(formatReceiptDate(invoice.dueDate))}</span></div>
          <span style="color:#d1d5db;">|</span>
          <div><span style="color:#64748b;">Print Date</span><span style="color:#d1d5db;margin:0 4px;">:</span><span>${escapeHtml(printDateStr)}</span></div>
        </div>

        <!-- Payment History -->
        ${renderTransactionRows()}
      </div>

      <!-- Footer -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:16px 24px 0;border-top:2px solid ${NAVY};margin-top:16px;min-height:120px;">
        <div style="max-width:50%;font-size:11px;font-weight:600;color:#64748b;">
          <p style="margin:3px 0;">This is a computer-generated receipt and does not require a physical signature.</p>
          <p style="margin:3px 0;font-weight:800;color:#1e293b;font-size:12px;">FEES ONCE PAID ARE NON-REFUNDABLE UNDER ANY CIRCUMSTANCES.</p>
          <p style="margin:8px 3px 3px;">Thank you for choosing Smart Tutors Pvt. Ltd.</p>
          <p style="margin:3px 0;">We appreciate your trust.</p>
        </div>
        <div style="text-align:center;width:220px;">
          <img src="${escapeHtml(signatureUrl)}" alt="Founder Signature" style="display:block;width:180px;height:64px;margin:0 auto 6px;object-fit:contain;" />
          <div style="border-top:1.5px solid #334155;margin-top:4px;padding-top:6px;">
            <div style="font-size:13px;font-weight:800;color:#1e293b;">Mr. Ravi Rana</div>
            <div style="font-size:11px;color:#64748b;margin-top:1px;">Director &amp; Founder</div>
            <div style="font-size:11px;color:#64748b;margin-top:1px;">Smart Tutors Pvt. Ltd.</div>
          </div>
        </div>
      </div>

      <!-- Bottom Terms -->
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;padding:10px 24px 14px;">
        <span>Smart Tutors Pvt. Ltd. | CIN: U80100MH2019PTC321658</span>
        <span>www.smarttutors.co.in</span>
      </div>

    </div>
  </div>
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
