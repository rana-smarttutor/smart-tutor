"use client";

import { Fragment, useMemo } from "react";
import { type FeeInvoice, type FeeInstallmentPlan, type Role } from "@/lib/types";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatReceiptDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusColor(s: string) {
  if (s === "paid") return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
  if (s === "partial") return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
  if (s === "overdue") return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
  return { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
}

type Props = {
  role: Role;
  feeInvoices: FeeInvoice[];
  feeInstallmentPlans: FeeInstallmentPlan[];
};

export function StudentFeeReceiptsView({ role, feeInvoices, feeInstallmentPlans }: Props) {
  const isAdmin = role === "admin";

  const invoices = useMemo(() => feeInvoices ?? [], [feeInvoices]);
  const plans = useMemo(() => feeInstallmentPlans ?? [], [feeInstallmentPlans]);

  const totalFees = useMemo(() => {
    const fromInvoices = invoices.reduce((s, i) => s + i.amount, 0);
    const fromPlans = plans.reduce((s, p) => s + p.totalFee, 0);
    return fromInvoices + fromPlans;
  }, [invoices, plans]);

  const totalPaid = useMemo(() => {
    const fromInvoices = invoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
    const fromPlans = plans.reduce((s, p) => s + p.paidAmount, 0);
    return fromInvoices + fromPlans;
  }, [invoices, plans]);

  const totalDue = Math.max(totalFees - totalPaid, 0);

  const hasFees = totalFees > 0;

  function downloadInvoiceReceipt(invoice: FeeInvoice) {
    const popup = window.open("", "_blank", "width=1280,height=860");
    if (!popup) return;

    const paidAmount = invoice.paidAmount ?? 0;
    const balance = Math.max(invoice.amount - paidAmount, 0);
    const receiptNo = invoice.receiptNo || invoice.id;
    const logoUrl = `${window.location.origin}/stpl.jpeg`;
    const signatureUrl = `${window.location.origin}/founder-sign.png`;
    const transactions = invoice.transactions ?? [];

    const statusColors: Record<string, string> = {
      paid: "background:#d1fae5;color:#065f46;",
      partial: "background:#dbeafe;color:#1e40af;",
      unpaid: "background:#fef3c7;color:#92400e;",
      overdue: "background:#fee2e2;color:#991b1b;",
    };
    const statusStyle = statusColors[invoice.status] ?? statusColors.unpaid;

    function renderTransactionRows(): string {
      if (!transactions.length) return "";
      const rows = transactions
        .map(
          (t, i) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${i + 1}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(formatReceiptDate(t.paidDate))}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:right;font-size:13px;font-weight:700;">${escapeHtml(formatCurrency(t.paidAmount))}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(t.paymentMode)}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(t.transactionId || t.chequeNumber || "-")}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(t.bankName || "-")}</td>
        </tr>`,
        )
        .join("");

      return `
      <div style="margin-top:16px;border:1px solid #94a3b8;overflow:hidden;">
        <div class="section-label" style="margin-bottom:0;">Payment History</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;width:40px;">#</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Date</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:right;">Amount</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Mode</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Transaction Ref</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Bank</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }

    const receiptHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #e5e7eb; color: #111827; font-family: Arial, Helvetica, sans-serif; }
    .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; background: #00072d; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 20px; }
    .print-btn:hover { background: #000525; }
    .receipt { max-width: 850px; margin: 0 auto; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    .receipt-inner { border: 1.5px solid #475569; margin: 8px; padding: 0; }
    .header-row { display: flex; align-items: stretch; border-bottom: 1.5px solid #475569; }
    .brand { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 20px; border-right: 1px solid #cbd5e1; }
    .brand img { width: 100%; max-height: 110px; object-fit: contain; }
    .addresses { display: flex; flex-direction: column; justify-content: center; padding: 14px 20px; text-align: right; min-width: 220px; }
    .content-area { padding: 20px 24px; }
    .addresses .name { font-size: 13px; font-weight: 700; color: #00072d; }
    .addresses .addr { font-size: 11px; line-height: 1.6; color: #64748b; margin-top: 4px; }
    .title { text-align: center; font-size: 20px; font-weight: 900; color: #00072d; margin: 16px 0; letter-spacing: 0.05em; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
    .meta-row .val { font-weight: 400; color: #475569; }
    .section-label { background: #00072d; color: #fff; padding: 6px 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .details-grid { border: 1px solid #94a3b8; font-size: 13px; margin-bottom: 20px; }
    .details-grid .row { display: flex; border-bottom: 1px solid #94a3b8; }
    .details-grid .row:last-child { border-bottom: none; }
    .details-grid .cell { flex: 1; display: flex; padding: 8px 12px; }
    .details-grid .cell:first-child { border-right: 1px solid #94a3b8; }
    .details-grid .label { width: 110px; font-weight: 700; white-space: nowrap; }
    .details-grid .sep { margin-right: 8px; }
    .details-grid .value { color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.fee-table th, table.fee-table td { border: 1px solid #94a3b8; padding: 8px 10px; }
    table.fee-table th { background: #00072d; color: #fff; font-weight: 600; text-align: center; }
    table.fee-table td { text-align: center; }
    .center { text-align: center; }
    .right { text-align: right; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .footer-row { display: flex; justify-content: space-between; align-items: flex-end; min-height: 120px; border-top: 1.5px solid #475569; padding: 16px 24px 0 24px; margin-top: 0; }
    .footer-note { font-size: 12px; font-weight: 600; color: #475569; }
    .footer-note p { margin: 2px 0; }
    .signature { text-align: center; width: 220px; }
    .signature .line { border-top: 1.5px solid #334155; margin-top: 4px; padding-top: 6px; font-size: 13px; font-weight: 800; color: #1e293b; }
    .signature .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .terms { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding: 12px 24px 16px 24px; }
    @media print {
      body { padding: 0; background: #fff; }
      .print-btn { display: none !important; }
      .receipt { border: none; margin: 0; }
      .receipt-inner { border: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div style="max-width:850px;margin:0 auto;">
    <button class="print-btn" onclick="window.print();">
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
      Print Receipt
    </button>
  </div>
  <div class="receipt">
    <div class="receipt-inner">
      <div class="header-row">
        <div class="brand">
          <img src="${escapeHtml(logoUrl)}" alt="Smart Tutors" />
        </div>
        <div class="addresses">
          <div class="name">Smart Tutors</div>
          <div class="addr">
            Plot No. 2, Second Floor, Vashi Plaza,<br/>
            Sector 17, Vashi, Navi Mumbai – 400703<br/>
            info@smarttutors.co.in | +91 88504 47887
          </div>
        </div>
      </div>
      <div class="content-area">
      <div class="title">FEE RECEIPT</div>
      <div class="meta-row">
        <div><span>Receipt No.</span> <span style="margin-right:8px;">:</span> <span class="val">${escapeHtml(receiptNo)}</span></div>
        <div><span>Receipt Date</span> <span style="margin-right:8px;">:</span> <span class="val">${escapeHtml(formatReceiptDate(invoice.dueDate))}</span></div>
      </div>
      <div class="section-label">Student Details</div>
      <div class="details-grid">
        <div class="row">
          <div class="cell"><span class="label">Student Name</span><span class="sep">:</span><span class="value">${escapeHtml(invoice.studentName || "—")}</span></div>
          <div class="cell"><span class="label">Enrollment ID</span><span class="sep">:</span><span class="value">${escapeHtml((invoice.studentId || "—").replace("-", "").substring(0, 8).toUpperCase())}</span></div>
        </div>
        <div class="row">
          <div class="cell"><span class="label">Class / Board</span><span class="sep">:</span><span class="value">${escapeHtml(invoice.classCourse || "—")}</span></div>
          <div class="cell"><span class="label">Academic Year</span><span class="sep">:</span><span class="value">${escapeHtml(invoice.academicYear || "—")}</span></div>
        </div>
        <div class="row">
          <div class="cell"><span class="label">Mobile No.</span><span class="sep">:</span><span class="value">${escapeHtml(invoice.mobileNo || "—")}</span></div>
          <div class="cell"><span class="label">Payment Mode</span><span class="sep">:</span><span class="value">${escapeHtml(invoice.paymentMode || "—")}</span></div>
        </div>
      </div>
      <div class="section-label">Fee Details</div>
      <table class="fee-table">
        <thead><tr><th style="width:50px;">Sr No.</th><th style="text-align:left;">Particulars</th><th>Month</th><th>Due Date</th><th style="text-align:right;">Amount (₹)</th><th style="text-align:right;">Paid (₹)</th><th style="text-align:right;">Balance (₹)</th></tr></thead>
        <tbody>
          <tr>
            <td>1</td>
            <td style="text-align:left;font-weight:600;">${escapeHtml(invoice.title || "Fee")}${invoice.particulars ? " — " + escapeHtml(invoice.particulars) : ""}</td>
            <td>${escapeHtml(invoice.month || "—")}</td>
            <td>${escapeHtml(formatReceiptDate(invoice.dueDate))}</td>
            <td style="text-align:right;font-weight:700;">${escapeHtml(formatCurrency(invoice.amount))}</td>
            <td style="text-align:right;font-weight:700;">${escapeHtml(formatCurrency(paidAmount))}</td>
            <td style="text-align:right;font-weight:700;">${escapeHtml(formatCurrency(balance))}</td>
          </tr>
        </tbody>
      </table>
      ${renderTransactionRows()}
      </div>
      <div class="footer-row">
        <div class="footer-note">
          <p>This is a computer generated receipt and does not require signature.</p>
          <p style="font-weight:800;color:#1e293b;">FEES ARE NOT REFUNDABLE UNDER ANY CIRCUMSTANCES.</p>
          <p>Thank you for choosing Smart Tutors Pvt. Ltd.</p>
        </div>
        <div class="signature">
          <img src="${signatureUrl}" alt="Founder Signature" style="display:block;width:180px;height:72px;margin:0 auto 4px;object-fit:contain;" />
          <div class="line">Prof. Ravi Rana</div>
          <div class="sub">Founder – Smart Tutors</div>
        </div>
      </div>
      <div class="terms">
        <span>Smart Tutors Pvt. Ltd. | CIN: U80100MH2019PTC321658</span>
        <span>www.smarttutors.co.in</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    popup.document.write(receiptHtml);
    popup.document.close();
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(37,99,235,.1)", color: "#2563EB" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Fees</div>
              <div className="text-xl font-bold text-slate-800">{formatCurrency(totalFees)}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,.1)", color: "#10B981" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</div>
              <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: totalDue > 0 ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)", color: totalDue > 0 ? "#EF4444" : "#10B981" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount Due</div>
              <div className={`text-xl font-bold ${totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(totalDue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── No Fees ── */}
      {!hasFees && (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <p className="text-sm font-medium">No fee records found.</p>
        </div>
      )}

      {/* ── Fee Installment Plans ── */}
      {plans.length > 0 && (
        <div className="mb-5">
          {plans.map((plan) => {
            const planStatus = plan.status === "completed" ? "paid" : plan.pendingAmount > 0 && plan.paidAmount > 0 ? "partial" : plan.paidAmount === 0 ? "unpaid" : "paid";
            const sc = statusColor(planStatus);

            return (
              <div key={plan.id} className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{plan.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {plan.courseName ? `${plan.courseName}` : ""}{plan.batchName ? ` \u00B7 ${plan.batchName}` : ""}{plan.academicYear ? ` \u00B7 ${plan.academicYear}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-slate-500">Total: <strong className="text-slate-800">{formatCurrency(plan.totalFee)}</strong></span>
                    <span className="text-emerald-600">Paid: <strong>{formatCurrency(plan.paidAmount)}</strong></span>
                    {plan.pendingAmount > 0 && <span className="text-red-600">Due: <strong>{formatCurrency(plan.pendingAmount)}</strong></span>}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {planStatus === "paid" ? "Paid" : planStatus === "partial" ? "Partial" : "Unpaid"}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2 font-semibold text-slate-600">Installment</th>
                        <th className="px-4 py-2 font-semibold text-slate-600 text-right">Total</th>
                        <th className="px-4 py-2 font-semibold text-slate-600 text-right">Paid</th>
                        <th className="px-4 py-2 font-semibold text-slate-600 text-right">Due</th>
                        <th className="px-4 py-2 font-semibold text-slate-600">Due Date</th>
                        <th className="px-4 py-2 font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-2 font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.installments.map((inst, idx) => {
                        const instStatus = inst.status === "paid" ? "paid" : inst.paidAmount > 0 ? "partial" : inst.status === "overdue" ? "overdue" : "unpaid";
                        const isc = statusColor(instStatus);
                        const matchedInvoice = invoices.find((inv) => inv.receiptNo === inst.receiptNumber || inv.id === inst.receiptNumber);

                        return (
                          <Fragment key={idx}>
                            <tr className="border-t border-[var(--color-border)]">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-800">{plan.title}</div>
                                <div className="text-[11px] text-slate-400">Installment {inst.installmentNumber}</div>
                              </td>
                              <td className="px-4 py-3 text-right">{formatCurrency(inst.amount)}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(inst.paidAmount)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ color: inst.pendingAmount > 0 ? "#EF4444" : "#10B981" }}>
                                {formatCurrency(inst.pendingAmount)}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{formatReceiptDate(inst.dueDate)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isc.bg} ${isc.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isc.dot}`} />
                                  {instStatus === "paid" ? "Paid" : instStatus === "partial" ? "Partial" : instStatus === "overdue" ? "Overdue" : "Unpaid"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {(instStatus === "paid" || instStatus === "partial") && matchedInvoice ? (
                                  <button
                                    onClick={() => downloadInvoiceReceipt(matchedInvoice)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Receipt
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                            {inst.transactions.length > 0 && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={7} className="px-4 py-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment History</div>
                                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                                    {inst.transactions.map((t, ti) => (
                                      <span key={ti} className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {formatCurrency(t.paidAmount)} via {t.paymentMode} on {formatReceiptDate(t.paidDate)}
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
                  <th className="px-4 py-2 font-semibold text-slate-600">Description</th>
                  <th className="px-4 py-2 font-semibold text-slate-600 text-right">Total</th>
                  <th className="px-4 py-2 font-semibold text-slate-600 text-right">Paid</th>
                  <th className="px-4 py-2 font-semibold text-slate-600 text-right">Due</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Due Date</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Action</th>
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
                          <div className="font-semibold text-slate-800">{inv.title}</div>
                          {inv.particulars && <div className="text-[11px] text-slate-400">{inv.particulars}</div>}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(paidAmt)}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: bal > 0 ? "#EF4444" : "#10B981" }}>
                          {formatCurrency(bal)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatReceiptDate(inv.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isc.bg} ${isc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isc.dot}`} />
                            {invStatus === "paid" ? "Paid" : invStatus === "partial" ? "Partial" : invStatus === "overdue" ? "Overdue" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(invStatus === "paid" || invStatus === "partial") ? (
                            <button
                              onClick={() => downloadInvoiceReceipt(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              Receipt
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                      {inv.transactions.length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-4 py-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment History</div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1">
                              {inv.transactions.map((t, ti) => (
                                <span key={ti} className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {formatCurrency(t.paidAmount)} via {t.paymentMode} on {formatReceiptDate(t.paidDate)}
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


