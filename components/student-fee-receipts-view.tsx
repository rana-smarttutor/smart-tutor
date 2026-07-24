"use client";

import { Fragment, useMemo } from "react";
import {
  type FeeInvoice,
  type FeeInstallmentPlan,
  type Role,
} from "@/lib/types";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatReceiptDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatReceiptClassBoard(value?: string) {
  const normalizedValue = value?.trim() ?? "";

  if (!normalizedValue) {
    return "—";
  }

  const examMatch = normalizedValue.match(
    /^(?:competitive exams?|govt exams?|government exams?)\s*\|\s*(.+)$/i,
  );

  if (!examMatch?.[1]) {
    return normalizedValue;
  }

  return examMatch[1].replace(/-/g, " ").replace(/\s+/g, " ").trim();
}
function statusColor(s: string) {
  if (s === "paid")
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    };
  if (s === "partial")
    return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
  if (s === "overdue")
    return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
  return { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
}

function numberToWords(n: number): string {
  if (n === 0) return "Zero Rupees Only";
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
  function convertBelow1000(num: number): string {
    let result = "";
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) result += ones[num] + " ";
    return result.trim();
  }
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  let result = "";
  if (crore) result += convertBelow1000(crore) + " Crore ";
  if (lakh) result += convertBelow1000(lakh) + " Lakh ";
  if (thousand) result += convertBelow1000(thousand) + " Thousand ";
  if (n > 0) result += convertBelow1000(n) + " ";
  return result.trim() + " Rupees Only";
}

type Props = {
  role: Role;
  feeInvoices: FeeInvoice[];
  feeInstallmentPlans: FeeInstallmentPlan[];
};

export function StudentFeeReceiptsView({
  role,
  feeInvoices,
  feeInstallmentPlans,
}: Props) {
  const isAdmin = role === "admin";

  const invoices = useMemo(() => feeInvoices ?? [], [feeInvoices]);
  const plans = useMemo(() => feeInstallmentPlans ?? [], [feeInstallmentPlans]);
  const installmentReceiptNumbers = useMemo(
    () =>
      new Set(
        plans
          .flatMap((plan) => plan.installments)
          .map((installment) => installment.receiptNumber?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    [plans],
  );

  const standaloneInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const invoiceReference = invoice.receiptNo || invoice.id;

        return !installmentReceiptNumbers.has(invoiceReference);
      }),
    [invoices, installmentReceiptNumbers],
  );

  const totalFees = useMemo(() => {
    const fromInvoices = standaloneInvoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    );

    const fromPlans = plans.reduce((sum, plan) => sum + plan.totalFee, 0);

    return fromInvoices + fromPlans;
  }, [standaloneInvoices, plans]);

  const totalPaid = useMemo(() => {
    const fromInvoices = standaloneInvoices.reduce(
      (sum, invoice) => sum + (invoice.paidAmount ?? 0),
      0,
    );

    const fromPlans = plans.reduce((sum, plan) => sum + plan.paidAmount, 0);

    return fromInvoices + fromPlans;
  }, [standaloneInvoices, plans]);

  const totalDue = Math.max(totalFees - totalPaid, 0);

  const nextMonthlyFee = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First use an already scheduled future unpaid installment.
    const scheduledInstallments = plans
      .flatMap((plan) =>
        plan.installments.map((installment) => ({
          amount:
            installment.pendingAmount > 0
              ? installment.pendingAmount
              : installment.amount,
          dueDate: installment.dueDate,
          pendingAmount: installment.pendingAmount,
        })),
      )
      .filter((installment) => {
        const dueDate = new Date(installment.dueDate);

        return (
          !Number.isNaN(dueDate.getTime()) &&
          dueDate.getTime() >= today.getTime() &&
          installment.pendingAmount > 0
        );
      })
      .sort(
        (first, second) =>
          new Date(first.dueDate).getTime() -
          new Date(second.dueDate).getTime(),
      );

    if (scheduledInstallments.length > 0) {
      return {
        amount: scheduledInstallments[0].amount,
        dueDate: scheduledInstallments[0].dueDate,
        isProjected: false,
      };
    }

    // When the next installment has not yet been generated,
    // calculate it from the latest fee record.
    const feeHistory = [
      ...plans.flatMap((plan) =>
        plan.installments.map((installment) => ({
          amount: installment.amount,
          dueDate: installment.dueDate,
        })),
      ),
      ...invoices.map((invoice) => ({
        amount: invoice.amount,
        dueDate: invoice.dueDate || invoice.createdAt || "",
      })),
    ]
      .filter((record) => {
        const date = new Date(record.dueDate);
        return record.amount > 0 && !Number.isNaN(date.getTime());
      })
      .sort(
        (first, second) =>
          new Date(second.dueDate).getTime() -
          new Date(first.dueDate).getTime(),
      );

    const latestFee = feeHistory[0];

    if (!latestFee) {
      return null;
    }

    const nextDueDate = new Date(latestFee.dueDate);
    const originalDay = nextDueDate.getDate();

    nextDueDate.setDate(1);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const lastDayOfNextMonth = new Date(
      nextDueDate.getFullYear(),
      nextDueDate.getMonth() + 1,
      0,
    ).getDate();

    nextDueDate.setDate(Math.min(originalDay, lastDayOfNextMonth));

    return {
      amount: latestFee.amount,
      dueDate: nextDueDate.toISOString(),
      isProjected: true,
    };
  }, [invoices, plans]);
  const hasInstallmentPlan = plans.length > 0;

  const primaryFeeLabel = hasInstallmentPlan
    ? "Total Course Fee"
    : "Monthly Fees";

  const nextFeeLabel = hasInstallmentPlan
    ? "Next Installment"
    : "Next Monthly Fee";

  const primaryFeeAmount = useMemo(() => {
    if (plans.length > 0) {
      return plans.reduce((sum, plan) => sum + plan.totalFee, 0);
    }

    const latestInvoice = [...invoices]
      .filter((invoice) => invoice.amount > 0)
      .sort((first, second) => {
        const firstDate = new Date(
          first.dueDate || first.createdAt || "",
        ).getTime();

        const secondDate = new Date(
          second.dueDate || second.createdAt || "",
        ).getTime();

        return secondDate - firstDate;
      })[0];

    return latestInvoice?.amount ?? 0;
  }, [invoices, plans]);

  const hasFees = totalFees > 0;

  function downloadInvoiceReceipt(invoice: FeeInvoice) {
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
    const amountInWords = numberToWords(invoice.amount);

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
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.receipt-logo {
  display: block;
  width: 108%;
  max-width: none;
  height: auto;
  margin-left: -4%;
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
  width: 108% !important;
  max-width: none !important;
  height: auto !important;
  margin-left: -4% !important;
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
            <div class="detail-cell" style="border-right:1px solid #d1d5db;"><span class="detail-lbl">Class / Board</span><span class="detail-sep">:</span><span class="detail-val">${escapeHtml(formatReceiptClassBoard(invoice.classCourse))}</span></div>
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
          <span style="color:#475569;font-weight:500;">${escapeHtml(amountInWords)}</span>
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

    /*
     * Opening the finished Blob directly is more reliable on
     * iPhone and iPad than writing HTML into an about:blank popup.
     */
    const receiptWindow = window.open(receiptUrl, "_blank");

    if (!receiptWindow) {
      // Popup blocked: open receipt in the current tab.
      window.location.assign(receiptUrl);
      return;
    }

    try {
      receiptWindow.opener = null;
    } catch {
      // Some mobile browsers do not allow changing opener.
    }

    /*
     * Allow enough time for the new tab to load before releasing
     * the temporary browser URL.
     */
    window.setTimeout(() => {
      URL.revokeObjectURL(receiptUrl);
    }, 60_000);
  }

  return (
    <article className="surface rounded-[2rem] p-5 sm:p-6">
      <div className="mb-6">
        <p className="section-label">Fee Details</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-heading)]">
          {isAdmin ? "Fee Overview" : "My Fee Details"}
        </h2>
      </div>

      {/* ── Summary Stats ── */}
      {hasFees && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Monthly Fees */}
          <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "rgba(37,99,235,.1)",
                color: "#2563EB",
              }}
            >
              <span className="text-xl font-black leading-none">₹</span>
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {primaryFeeLabel}
              </p>

              <p className="mt-1 truncate text-2xl font-black text-slate-800">
                {formatCurrency(primaryFeeAmount)}
              </p>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "rgba(16,185,129,.1)",
                color: "#10B981",
              }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Amount Paid
              </p>

              <p className="mt-1 truncate text-2xl font-black text-emerald-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>

          {/* Amount Due */}
          <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background:
                  totalDue > 0 ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)",
                color: totalDue > 0 ? "#EF4444" : "#10B981",
              }}
            >
              <span className="text-xl font-black leading-none">₹</span>
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Amount Due
              </p>

              <p
                className={`mt-1 truncate text-2xl font-black ${
                  totalDue > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(totalDue)}
              </p>
            </div>
          </div>

          {/* Next Monthly Fee */}
          <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {nextFeeLabel}
              </p>

              <p className="mt-1 truncate text-2xl font-black text-amber-600">
                {nextMonthlyFee
                  ? formatCurrency(nextMonthlyFee.amount)
                  : "Not Scheduled"}
              </p>

              <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
                {nextMonthlyFee
                  ? `${nextMonthlyFee.isProjected ? "Expected" : "Due"} ${formatReceiptDate(
                      nextMonthlyFee.dueDate,
                    )}`
                  : hasInstallmentPlan
                    ? "No next installment scheduled"
                    : "No monthly fee scheduled"}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ── No Fees ── */}
      {!hasFees && (
        <div className="text-center py-12 text-slate-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium">No fee records found.</p>
        </div>
      )}

      {/* ── Fee Installment Plans ── */}
      {plans.length > 0 && (
        <div className="mb-5">
          {plans.map((plan) => {
            const planStatus =
              plan.status === "completed"
                ? "paid"
                : plan.pendingAmount > 0 && plan.paidAmount > 0
                  ? "partial"
                  : plan.paidAmount === 0
                    ? "unpaid"
                    : "paid";
            const sc = statusColor(planStatus);

            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden mb-4"
              >
                <div className="px-4 py-3 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {plan.courseName || plan.academicYear ? (
                      <div className="text-[11px] text-slate-500">
                        {plan.courseName ?? ""}
                        {plan.courseName && plan.academicYear ? " · " : ""}
                        {plan.academicYear ?? ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-slate-500">
                      Total:{" "}
                      <strong className="text-slate-800">
                        {formatCurrency(plan.totalFee)}
                      </strong>
                    </span>
                    <span className="text-emerald-600">
                      Paid: <strong>{formatCurrency(plan.paidAmount)}</strong>
                    </span>
                    {plan.pendingAmount > 0 && (
                      <span className="text-red-600">
                        Due:{" "}
                        <strong>{formatCurrency(plan.pendingAmount)}</strong>
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {planStatus === "paid"
                        ? "Paid"
                        : planStatus === "partial"
                          ? "Partial"
                          : "Unpaid"}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2 font-semibold text-slate-600">
                          Installment
                        </th>
                        <th className="px-4 py-2 font-semibold text-slate-600 text-right">
                          Total
                        </th>
                        <th className="px-4 py-2 font-semibold text-slate-600 text-right">
                          Paid
                        </th>
                        <th className="px-4 py-2 font-semibold text-slate-600 text-right">
                          Due
                        </th>
                        <th className="px-4 py-2 font-semibold text-slate-600">
                          Due Date
                        </th>
                        <th className="px-4 py-2 font-semibold text-slate-600">
                          Status
                        </th>
                        <th className="px-4 py-2 font-semibold text-slate-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.installments.map((inst, idx) => {
                        const instStatus =
                          inst.status === "paid"
                            ? "paid"
                            : inst.paidAmount > 0
                              ? "partial"
                              : inst.status === "overdue"
                                ? "overdue"
                                : "unpaid";
                        const isc = statusColor(instStatus);
                        const matchedInvoice = invoices.find(
                          (inv) =>
                            inv.receiptNo === inst.receiptNumber ||
                            inv.id === inst.receiptNumber,
                        );

                        return (
                          <Fragment key={idx}>
                            <tr className="border-t border-[var(--color-border)]">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-800">
                                  {inst.installmentTitle ||
                                    `Installment ${inst.installmentNumber}`}
                                </div>

    
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(inst.amount)}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                                {formatCurrency(inst.paidAmount)}
                              </td>
                              <td
                                className="px-4 py-3 text-right font-semibold"
                                style={{
                                  color:
                                    inst.pendingAmount > 0
                                      ? "#EF4444"
                                      : "#10B981",
                                }}
                              >
                                {formatCurrency(inst.pendingAmount)}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatReceiptDate(inst.dueDate)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isc.bg} ${isc.text}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isc.dot}`}
                                  />
                                  {instStatus === "paid"
                                    ? "Paid"
                                    : instStatus === "partial"
                                      ? "Partial"
                                      : instStatus === "overdue"
                                        ? "Overdue"
                                        : "Unpaid"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {(instStatus === "paid" ||
                                  instStatus === "partial") &&
                                matchedInvoice ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      downloadInvoiceReceipt(matchedInvoice);
                                    }}
                                    className="inline-flex touch-manipulation items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Receipt
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                            {(inst.transactions ?? []).length > 0 && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={7} className="px-4 py-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Payment History
                                  </div>
                                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                                    {(inst.transactions ?? []).map((t, ti) => (
                                      <span
                                        key={ti}
                                        className="inline-flex items-center gap-1 text-[12px] text-slate-600"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {formatCurrency(t.paidAmount)} via{" "}
                                        {t.paymentMode} on{" "}
                                        {formatReceiptDate(t.paidDate)}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Individual Invoices ── */}
      {invoices.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <div className="text-sm font-bold text-slate-800">Fee Invoices</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-semibold text-slate-600">
                    Description
                  </th>
                  <th className="px-4 py-2 font-semibold text-slate-600 text-right">
                    Total
                  </th>
                  <th className="px-4 py-2 font-semibold text-slate-600 text-right">
                    Paid
                  </th>
                  <th className="px-4 py-2 font-semibold text-slate-600 text-right">
                    Due
                  </th>
                  <th className="px-4 py-2 font-semibold text-slate-600">
                    Due Date
                  </th>
                  <th className="px-4 py-2 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-2 font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const paidAmt = inv.paidAmount ?? 0;
                  const bal = Math.max(inv.amount - paidAmt, 0);
                  const invStatus = inv.status;
                  const isc = statusColor(invStatus);

                  return (
                    <Fragment key={inv.id}>
                      <tr className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {inv.title}
                          </div>
                          {inv.particulars && (
                            <div className="text-[11px] text-slate-400">
                              {inv.particulars}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                          {formatCurrency(paidAmt)}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-semibold"
                          style={{ color: bal > 0 ? "#EF4444" : "#10B981" }}
                        >
                          {formatCurrency(bal)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatReceiptDate(inv.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isc.bg} ${isc.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isc.dot}`}
                            />
                            {invStatus === "paid"
                              ? "Paid"
                              : invStatus === "partial"
                                ? "Partial"
                                : invStatus === "overdue"
                                  ? "Overdue"
                                  : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {invStatus === "paid" || invStatus === "partial" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                downloadInvoiceReceipt(inv);
                              }}
                              className="inline-flex touch-manipulation items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Receipt
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                      {(inv.transactions ?? []).length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-4 py-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Payment History
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1">
                              {(inv.transactions ?? []).map((t, ti) => (
                                <span
                                  key={ti}
                                  className="inline-flex items-center gap-1 text-[12px] text-slate-600"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {formatCurrency(t.paidAmount)} via{" "}
                                  {t.paymentMode} on{" "}
                                  {formatReceiptDate(t.paidDate)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}
