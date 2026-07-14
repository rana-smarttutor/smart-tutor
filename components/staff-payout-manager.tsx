"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import type { ManagedUser, Role, SessionUser, StaffPayout, StaffPayoutStatus, StaffPayoutAuditLog } from "@/lib/types";

type Props = {
  role: Role;
  session: SessionUser | null;
  managedUsers: ManagedUser[];
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  const idx = parseInt(m, 10) - 1;
  return `${MONTHS[idx] || m} ${y}`;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function StaffPayoutManager({ role, session, managedUsers }: Props) {
  const isAdmin = role === "admin";
  const [payouts, setPayouts] = useState<StaffPayout[]>([]);
  const [auditLogs, setAuditLogs] = useState<StaffPayoutAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"payouts" | "audit">("payouts");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordingPaymentId, setRecordingPaymentId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const facultyOptions = useMemo(
    () =>
      managedUsers
        .filter((u) => u.role === "educator" && u.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [managedUsers],
  );

  const [form, setForm] = useState({
    staffId: "",
    staffName: "",
    month: getCurrentMonth(),
    title: "Monthly Salary",
    particulars: "",
    amount: "",
    isPaymentDone: false,
    paymentMode: "UPI",
    transactionId: "",
    paidDate: new Date().toISOString().slice(0, 10),
  });

  const [editForm, setEditForm] = useState({
    title: "",
    particulars: "",
    amount: "",
    month: "",
    paymentMode: "",
    transactionId: "",
    paidDate: "",
  });

  const [payForm, setPayForm] = useState({
    paymentMode: "UPI",
    transactionId: "",
    paidDate: new Date().toISOString().slice(0, 10),
  });

  const [auditFilters, setAuditFilters] = useState({
    staffId: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  useEffect(() => {
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab]);

  async function fetchPayouts() {
    setLoading(true);
    try {
      const res = await fetch("/api/staff-payouts", { credentials: "same-origin" });
      const data = await res.json();
      if (data.ok) setPayouts(data.payouts || []);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditFilters.staffId) params.set("staffId", auditFilters.staffId);
      if (auditFilters.action) params.set("action", auditFilters.action);
      if (auditFilters.dateFrom) params.set("dateFrom", auditFilters.dateFrom);
      if (auditFilters.dateTo) params.set("dateTo", auditFilters.dateTo);
      const res = await fetch(`/api/staff-payouts/audit-log?${params.toString()}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.ok) setAuditLogs(data.logs || []);
    } catch {
      // keep existing
    } finally {
      setAuditLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = payouts.reduce((s, p) => s + p.amount, 0);
    const paid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.paidAmount, 0);
    const pending = total - paid;
    return { total, paid, pending, count: payouts.length };
  }, [payouts]);

  const auditStats = useMemo(() => {
    const total = auditLogs.length;
    const created = auditLogs.filter((l) => l.action === "created").length;
    const payments = auditLogs.filter((l) => l.action === "payment_recorded").length;
    const deleted = auditLogs.filter((l) => l.action === "deleted").length;
    return { total, created, payments, deleted };
  }, [auditLogs]);

  async function handleCreate() {
    if (!form.staffId || !form.amount || !form.month) {
      setStatus("Staff, month, and amount are required.");
      return;
    }
    const num = Number(form.amount);
    if (isNaN(num) || num <= 0) {
      setStatus("Amount must be a positive number.");
      return;
    }
    if (form.isPaymentDone && !form.paymentMode) {
      setStatus("Please select a payment mode.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        staffId: form.staffId,
        staffName: form.staffName,
        month: form.month,
        title: form.title,
        particulars: form.particulars,
        amount: num,
      };
      if (form.isPaymentDone) {
        payload.paymentMode = form.paymentMode;
        payload.transactionId = form.transactionId;
        payload.paidDate = form.paidDate;
      }
      const res = await fetch("/api/staff-payouts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus(data.error || "Failed to create payout.");
        return;
      }
      setPayouts((prev) => [data.payout, ...prev]);
      setShowForm(false);
      setForm({
        staffId: "", staffName: "", month: getCurrentMonth(), title: "Monthly Salary",
        particulars: "", amount: "", isPaymentDone: false, paymentMode: "UPI", transactionId: "", paidDate: new Date().toISOString().slice(0, 10),
      });
      setStatus(form.isPaymentDone ? "Payout created with payment recorded. Faculty notified." : "Payout record created.");
    } catch {
      setStatus("Failed to create payout.");
    }
  }

  function openEdit(p: StaffPayout) {
    setEditingId(p.id);
    setEditForm({
      title: p.title,
      particulars: p.particulars,
      amount: String(p.amount),
      month: p.month,
      paymentMode: p.paymentMode || "",
      transactionId: p.transactionId || "",
      paidDate: p.paidDate || "",
    });
  }

  async function handleEditSave() {
    if (!editingId) return;
    const num = Number(editForm.amount);
    if (isNaN(num) || num <= 0) {
      setStatus("Amount must be positive.");
      return;
    }
    try {
      const res = await fetch(`/api/staff-payouts/${editingId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, amount: num }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus(data.error || "Failed to update.");
        return;
      }
      setPayouts((prev) => prev.map((p) => (p.id === editingId ? data.payout : p)));
      setEditingId(null);
      setStatus("Payout updated.");
    } catch {
      setStatus("Failed to update payout.");
    }
  }

  async function handleRecordPayment() {
    if (!recordingPaymentId) return;
    try {
      const res = await fetch(`/api/staff-payouts/${recordingPaymentId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: payForm.paymentMode,
          transactionId: payForm.transactionId,
          paidDate: payForm.paidDate,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus(data.error || "Failed to record payment.");
        return;
      }
      setPayouts((prev) => prev.map((p) => (p.id === recordingPaymentId ? data.payout : p)));
      setRecordingPaymentId(null);
      setStatus("Payment recorded. Faculty notified. Transaction ID: " + (payForm.transactionId || "N/A"));
      setPayForm({ paymentMode: "UPI", transactionId: "", paidDate: new Date().toISOString().slice(0, 10) });
    } catch {
      setStatus("Failed to record payment.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payout record permanently? This action is logged in the audit trail.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/staff-payouts/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        setPayouts((prev) => prev.filter((p) => p.id !== id));
        setStatus("Payout deleted. Audit trail preserved.");
      } else {
        setStatus("Delete failed.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function downloadReceipt(p: StaffPayout) {
    const receiptNo = (p as any).receiptNo || `STF-${p.id.slice(-8).toUpperCase()}`;
    const logoUrl = `${window.location.origin}/stpl.jpeg`;
    const signatureUrl = `${window.location.origin}/founder-sign.png`;
    const balance = Math.max(p.amount - p.paidAmount, 0);

    const statusColors: Record<string, string> = {
      paid: "background:#d1fae5;color:#065f46;",
      partial: "background:#dbeafe;color:#1e40af;",
      unpaid: "background:#fef3c7;color:#92400e;",
    };
    const statusStyle = statusColors[p.status] ?? statusColors.unpaid;

    function renderTransactionRows(): string {
      if (!p.transactions || !p.transactions.length) return "";
      const rows = p.transactions
        .map(
          (t, i) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${i + 1}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(fmtDate(t.paidDate))}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:right;font-size:13px;font-weight:700;">${escapeHtml(fmtCurrency(t.paidAmount))}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(t.paymentMode)}</td>
          <td style="padding:8px 10px;border:1px solid #d1d5db;text-align:center;font-size:13px;">${escapeHtml(t.transactionId || "-")}</td>
        </tr>`,
        )
        .join("");

      return `
      <div style="margin-top:16px;border:1px solid #94a3b8;overflow:hidden;">
        <div style="background:#00072d;color:#fff;padding:6px 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Payment History</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;width:40px;">#</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Date</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:right;">Amount</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Mode</th>
            <th style="padding:8px 10px;border:1px solid #94a3b8;background:#dde3f0;font-size:12px;text-align:center;">Transaction Ref</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }

    const receiptHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Staff Payment Receipt - ${escapeHtml(receiptNo)}</title>
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
    table.fee-table th, table.fee-table td { border: 1px solid #94a3b8; padding: 8px 10px; }
    table.fee-table th { background: #00072d; color: #fff; font-weight: 600; text-align: center; }
    table.fee-table td { text-align: center; font-size: 13px; }
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
      <div class="title">STAFF PAYMENT RECEIPT</div>
      <div class="meta-row">
        <div><span>Receipt No.</span> <span style="margin-right:8px;">:</span> <span class="val">${escapeHtml(receiptNo)}</span></div>
        <div><span>Receipt Date</span> <span style="margin-right:8px;">:</span> <span class="val">${escapeHtml(fmtDate(p.createdAt))}</span></div>
      </div>
      <div class="section-label">Staff Details</div>
      <div class="details-grid">
        <div class="row">
          <div class="cell"><span class="label">Staff Name</span><span class="sep">:</span><span class="value">${escapeHtml(p.staffName)}</span></div>
          <div class="cell"><span class="label">Staff ID</span><span class="sep">:</span><span class="value">${escapeHtml(p.staffId.replace("-", "").substring(0, 8).toUpperCase())}</span></div>
        </div>
        <div class="row">
          <div class="cell"><span class="label">Payment For</span><span class="sep">:</span><span class="value">${escapeHtml(formatMonth(p.month))}</span></div>
          <div class="cell"><span class="label">Status</span><span class="sep">:</span><span class="value"><span style="${statusStyle}display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:800;text-transform:uppercase;">${escapeHtml(p.status)}</span></span></div>
        </div>
      </div>
      <div class="section-label">Payment Details</div>
      <table class="fee-table">
        <thead><tr><th style="width:50px;">Sr No.</th><th style="text-align:left;">Description</th><th style="text-align:right;">Amount (₹)</th><th style="text-align:right;">Paid (₹)</th><th style="text-align:right;">Balance (₹)</th></tr></thead>
        <tbody>
          <tr>
            <td>1</td>
            <td style="text-align:left;font-weight:600;">${escapeHtml(p.title)}${p.particulars ? " — " + escapeHtml(p.particulars) : ""}</td>
            <td style="text-align:right;font-weight:700;">${escapeHtml(fmtCurrency(p.amount))}</td>
            <td style="text-align:right;font-weight:700;color:#065f46;">${escapeHtml(fmtCurrency(p.paidAmount))}</td>
            <td style="text-align:right;font-weight:700;color:${balance > 0 ? "#991b1b" : "#065f46"};">${escapeHtml(fmtCurrency(balance))}</td>
          </tr>
        </tbody>
      </table>
      ${p.paymentMode ? `
      <div style="margin-top:16px;">
        <div class="section-label">Transaction Information</div>
        <div class="details-grid">
          <div class="row">
            <div class="cell"><span class="label">Payment Mode</span><span class="sep">:</span><span class="value">${escapeHtml(p.paymentMode)}</span></div>
            <div class="cell"><span class="label">Paid Date</span><span class="sep">:</span><span class="value">${escapeHtml(fmtDate(p.paidDate || ""))}</span></div>
          </div>
          ${p.transactionId ? `<div class="row">
            <div class="cell" style="border-right:none;"><span class="label">Transaction ID</span><span class="sep">:</span><span class="value" style="font-family:monospace;">${escapeHtml(p.transactionId)}</span></div>
          </div>` : ""}
        </div>
      </div>` : ""}
      ${renderTransactionRows()}
      </div>
      <div class="footer-row">
        <div class="footer-note">
          <p>This is a computer generated receipt and does not require signature.</p>
          <p style="font-weight:800;color:#1e293b;">Actual payment processed externally.</p>
          <p>Thank you for choosing Smart Tutors Pvt. Ltd.</p>
        </div>
        <div class="signature">
          <img src="${escapeHtml(signatureUrl)}" alt="Founder Signature" style="display:block;width:180px;height:72px;margin:0 auto 4px;object-fit:contain;" />
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
    const w = window.open("", "_blank", "width=1280,height=860");
    if (!w) return;
    w.document.write(receiptHtml);
    w.document.close();
  }

  const statusColor: Record<StaffPayoutStatus, { bg: string; text: string }> = {
    paid: { bg: "#DCFCE7", text: "#059669" },
    partial: { bg: "#FEF3C7", text: "#D97706" },
    unpaid: { bg: "#FEE2E2", text: "#DC2626" },
  };

  const filteredPayouts = useMemo(() => {
    return [...payouts].sort((a, b) => b.month.localeCompare(a.month));
  }, [payouts]);

  const actionLabel: Record<string, string> = {
    created: "Created",
    updated: "Updated",
    payment_recorded: "Payment Recorded",
    deleted: "Deleted",
  };

  const actionColor: Record<string, { bg: string; text: string }> = {
    created: { bg: "#dbeafe", text: "#1e40af" },
    updated: { bg: "#fef3c7", text: "#92400e" },
    payment_recorded: { bg: "#d1fae5", text: "#065f46" },
    deleted: { bg: "#fee2e2", text: "#991b1b" },
  };

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-heading)] tracking-tight">
              {isAdmin ? "Staff Payout System" : "My Earnings & Payouts"}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isAdmin
                ? "Create payout records, track payment status, and view tamper-proof audit logs."
                : "View your salary payments, receipts, and transaction history."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { fetchPayouts(); if (activeTab === "audit") fetchAuditLogs(); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
            >
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
            {isAdmin && activeTab === "payouts" && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                <i className="bi bi-plus-circle" /> New Payout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-4 flex gap-1 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === "payouts"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
          }`}
        >
          <i className="bi bi-receipt me-1.5" />Payouts
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === "audit"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
            }`}
          >
            <i className="bi bi-shield-lock me-1.5" />Audit Log
          </button>
        )}
      </div>

      {status && (
        <div className="mx-6 mt-4 rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-[var(--color-border)]">
          {status}
          <button onClick={() => setStatus("")} className="ml-2 text-[var(--color-muted)] hover:text-[var(--color-heading)]">
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* ═══════ PAYOUTS TAB ═══════ */}
      {activeTab === "payouts" && (
        <>
          {/* Stats */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total Payable", value: fmtCurrency(stats.total), icon: "bi-wallet2", color: "#4F46E5" },
                { label: "Amount Paid", value: fmtCurrency(stats.paid), icon: "bi-check-circle-fill", color: "#10B981" },
                { label: "Pending", value: fmtCurrency(stats.pending), icon: "bi-hourglass-split", color: "#EF4444" },
                { label: "Total Records", value: `${stats.count}`, icon: "bi-receipt", color: "#8B5CF6" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
                      <i className={`bi ${s.icon} text-lg`} style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{s.label}</p>
                      <p className="text-lg font-black text-[var(--color-heading)] truncate">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Form */}
          {isAdmin && showForm && (
            <div className="mx-6 mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
              <p className="mb-3 text-sm font-bold text-[var(--color-heading)]">
                <i className="bi bi-plus-circle me-2 text-[var(--color-primary)]" />
                Create Staff Payout Record
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={form.staffId}
                  onChange={(e) => {
                    const opt = facultyOptions.find((f) => f.id === e.target.value);
                    setForm((f) => ({ ...f, staffId: e.target.value, staffName: opt?.name || "" }));
                  }}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Select faculty member...</option>
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                  ))}
                </select>
                <select
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const now = new Date();
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    return <option key={val} value={val}>{formatMonth(val)}</option>;
                  })}
                </select>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Title (e.g. Monthly Salary)"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <input
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="Amount (INR)"
                  type="number"
                  min="0"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <input
                  value={form.particulars}
                  onChange={(e) => setForm((f) => ({ ...f, particulars: e.target.value }))}
                  placeholder="Particulars (optional)"
                  className="sm:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Payment Done Toggle */}
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-white">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isPaymentDone: !f.isPaymentDone }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                    form.isPaymentDone ? "bg-[var(--color-primary)]" : "bg-gray-300"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    form.isPaymentDone ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
                <div>
                  <p className="text-sm font-bold text-[var(--color-heading)]">Payment done?</p>
                  <p className="text-[11px] text-[var(--color-muted)]">Record payment transaction immediately at creation time</p>
                </div>
              </div>

              {form.isPaymentDone && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                  <input
                    value={form.transactionId}
                    onChange={(e) => setForm((f) => ({ ...f, transactionId: e.target.value }))}
                    placeholder="Transaction ID / UPI Ref / Cheque No"
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={form.paidDate}
                    onChange={(e) => setForm((f) => ({ ...f, paidDate: e.target.value }))}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="sm:col-span-3 text-[10px] text-[var(--color-muted)]">
                    The actual payment happens outside this system. You are recording the transaction reference here. Faculty will be notified.
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]">
                  Cancel
                </button>
                <button onClick={handleCreate} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                  <i className="bi bi-check-circle-fill me-2" />Create Payout
                </button>
              </div>
            </div>
          )}

          {/* Payouts Table */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] py-16 text-center">
                <i className="bi bi-receipt text-4xl text-[var(--color-muted)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
                  {isAdmin ? "No payout records yet. Click New Payout to create one." : "No payment records found."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayouts.map((p) => {
                  const sc = statusColor[p.status];
                  return (
                    <div key={p.id} className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
                      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-sm font-black text-[var(--color-primary)]">
                          {p.staffName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[var(--color-heading)]">{p.staffName}</p>
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: sc.bg, color: sc.text }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: sc.text }} />
                              {p.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">
                            {formatMonth(p.month)} &middot; {p.title}
                            {p.transactionId && <span className="ml-2 font-mono text-[10px] text-[var(--color-primary)]">TXN: {p.transactionId}</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-[var(--color-heading)]">{fmtCurrency(p.amount)}</p>
                          {p.paidAmount > 0 && p.paidAmount < p.amount && (
                            <p className="text-[10px] font-bold text-amber-600">Paid: {fmtCurrency(p.paidAmount)}</p>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2.5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => downloadReceipt(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                        >
                          <i className="bi bi-download" /> Receipt
                        </button>
                        {isAdmin && p.status !== "paid" && (
                          <button
                            onClick={() => {
                              setRecordingPaymentId(p.id);
                              setPayForm({ paymentMode: "UPI", transactionId: "", paidDate: new Date().toISOString().slice(0, 10) });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600"
                          >
                            <i className="bi bi-credit-card" /> Record Payment
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                            >
                              <i className="bi bi-pencil" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <i className="bi bi-trash" /> {deletingId === p.id ? "..." : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════ AUDIT LOG TAB ═══════ */}
      {activeTab === "audit" && isAdmin && (
        <div className="fdl-outer">
          {/* ── Top Bar ─────────────────────────────────── */}
          <div className="fdl-hd" style={{ padding: "16px 24px 0" }}>
            <div className="fdl-hd-left">
              <h1 className="fdl-title">Staff Payout Audit Log</h1>
              <span className="fdl-sub">Immutable record of all payout operations</span>
            </div>
          </div>

          {/* ── Warning Banner ─────────────────────────── */}
          <div style={{ padding: "0 24px" }}>
            <div className="fdl-warn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <strong>Tamper-Proof Audit Trail</strong> &mdash; All payout operations (create, update, payment record, delete) are permanently logged. Entries cannot be modified or deleted.
              </div>
            </div>
          </div>

          {/* ── Stat Cards ─────────────────────────────── */}
          <div className="fdl-cards" style={{ padding: "0 24px" }}>
            {[
              { label: "Total Events", value: auditStats.total, bg: "#EEF2FF", color: "#4F46E5" },
              { label: "Payouts Created", value: auditStats.created, bg: "#DBEAFE", color: "#2563EB" },
              { label: "Payments Recorded", value: auditStats.payments, bg: "#D1FAE5", color: "#065F46" },
              { label: "Deleted", value: auditStats.deleted, bg: "#FEE2E2", color: "#991B1B" },
            ].map((s) => (
              <div key={s.label} className="fdl-card">
                <div className="fdl-card-v" style={{ color: s.color }}>{s.value}</div>
                <div className="fdl-card-l">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Filters ────────────────────────────────── */}
          <div style={{ padding: "0 24px" }}>
            <div className="fdl-filters">
              <div className="fdl-fi">
                <label>Faculty</label>
                <select
                  value={auditFilters.staffId}
                  onChange={(e) => setAuditFilters((f) => ({ ...f, staffId: e.target.value }))}
                >
                  <option value="">All Faculty</option>
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="fdl-fi">
                <label>Action</label>
                <select
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters((f) => ({ ...f, action: e.target.value }))}
                >
                  <option value="">All Actions</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="payment_recorded">Payment Recorded</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
              <div className="fdl-fi">
                <label>Date From</label>
                <input
                  type="date"
                  value={auditFilters.dateFrom}
                  onChange={(e) => setAuditFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                />
              </div>
              <div className="fdl-fi">
                <label>Date To</label>
                <input
                  type="date"
                  value={auditFilters.dateTo}
                  onChange={(e) => setAuditFilters((f) => ({ ...f, dateTo: e.target.value }))}
                />
              </div>
              <button className="fdl-btn fdl-btn-primary" onClick={fetchAuditLogs}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Apply
              </button>
              <button
                className="fdl-btn fdl-btn-reset"
                onClick={() => { setAuditFilters({ staffId: "", action: "", dateFrom: "", dateTo: "" }); setTimeout(fetchAuditLogs, 50); }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* ── Audit Table ────────────────────────────── */}
          <div style={{ padding: "0 24px 24px" }}>
            {auditLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "fdl-spin .6s linear infinite" }} />
                <style>{`@keyframes fdl-spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="fdl-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p style={{ marginTop: 8, fontWeight: 600 }}>No audit log entries found.</p>
              </div>
            ) : (
              <div className="fdl-card-tbl">
                <table className="fdl-tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Receipt</th>
                      <th>Staff</th>
                      <th>Action</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th style={{ textAlign: "right" }}>Paid</th>
                      <th>Mode</th>
                      <th>TXN Ref</th>
                      <th>Performed By</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const ac = actionColor[log.action] || { bg: "#f1f5f9", text: "#475569" };
                      return (
                        <Fragment key={log.id}>
                          <tr>
                            <td>
                              <button className="fdl-expand-btn" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                                {isExpanded ? "−" : "+"}
                              </button>
                            </td>
                            <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#6366F1" }}>{log.receiptNo}</td>
                            <td style={{ fontWeight: 700, color: "#0F172A" }}>{log.staffName}</td>
                            <td>
                              <span className="fdl-pill" style={{ background: ac.bg, color: ac.text }}>
                                {log.action === "deleted" && "🗑 "}
                                {log.action === "payment_recorded" && "✓ "}
                                {actionLabel[log.action] || log.action}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#0F172A" }}>{log.amount != null ? fmtCurrency(log.amount) : "—"}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: (log.paidAmount || 0) > 0 ? "#065F46" : "#94A3B8" }}>
                              {log.paidAmount != null ? fmtCurrency(log.paidAmount) : "—"}
                            </td>
                            <td style={{ color: "#475569" }}>{log.paymentMode || "—"}</td>
                            <td style={{ fontFamily: "monospace", color: "#475569" }}>{log.transactionId || "—"}</td>
                            <td style={{ fontWeight: 600 }}>{log.performedByName}</td>
                            <td style={{ color: "#94A3B8" }}>{fmtDateTime(log.createdAt)}</td>
                          </tr>
                          {isExpanded && (
                            <tr className="fdl-detail-row open">
                              <td colSpan={10}>
                                <div className="fdl-detail-box">
                                  <div className="fdl-detail-grid">
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Audit Log ID</div>
                                      <div className="fdl-di-v" style={{ fontFamily: "monospace" }}>{log.id}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Payout ID</div>
                                      <div className="fdl-di-v" style={{ fontFamily: "monospace" }}>{log.payoutId}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Staff ID</div>
                                      <div className="fdl-di-v" style={{ fontFamily: "monospace" }}>{log.staffId}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Month</div>
                                      <div className="fdl-di-v">{log.month ? formatMonth(log.month) : "—"}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Title</div>
                                      <div className="fdl-di-v">{log.title || "—"}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Paid Date</div>
                                      <div className="fdl-di-v">{log.paidDate ? fmtDate(log.paidDate) : "—"}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Performed By ID</div>
                                      <div className="fdl-di-v" style={{ fontFamily: "monospace" }}>{log.performedBy}</div>
                                    </div>
                                    <div className="fdl-di">
                                      <div className="fdl-di-l">Full Timestamp</div>
                                      <div className="fdl-di-v">{log.createdAt}</div>
                                    </div>
                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                      <div className="fdl-di" style={{ gridColumn: "1 / -1" }}>
                                        <div className="fdl-di-l">Changes</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                                          {Object.entries(log.changes).map(([key, change]) => (
                                            <span key={key} style={{
                                              display: "inline-flex", alignItems: "center", gap: 4,
                                              background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6,
                                              padding: "3px 8px", fontSize: 11,
                                            }}>
                                              <span style={{ fontWeight: 700, color: "#475569" }}>{key}:</span>
                                              <span style={{ color: "#94A3B8" }}>{String(change.from ?? "—")}</span>
                                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                              <span style={{ color: "#0F172A", fontWeight: 600 }}>{String(change.to ?? "—")}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
                <div className="fdl-page">
                  <span>Showing {auditLogs.length} of {auditLogs.length} audit entries</span>
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>Tamper-proof &middot; Cannot be edited or deleted</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isAdmin && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-white shadow-2xl">
            <div className="rounded-t-[1.5rem] px-6 py-4 text-white" style={{ background: "linear-gradient(135deg,#1E1B4B,#4F46E5,#6D28D9)" }}>
              <h3 className="text-lg font-black"><i className="bi bi-pencil-square me-2" />Edit Payout</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <input value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} type="number" placeholder="Amount" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <input value={editForm.particulars} onChange={(e) => setEditForm((f) => ({ ...f, particulars: e.target.value }))} placeholder="Particulars" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              <select value={editForm.month} onChange={(e) => setEditForm((f) => ({ ...f, month: e.target.value }))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {Array.from({ length: 12 }, (_, i) => {
                  const now = new Date();
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                  return <option key={val} value={val}>{formatMonth(val)}</option>;
                })}
              </select>
            </div>
            <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setEditingId(null)} className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]">Cancel</button>
              <button onClick={handleEditSave} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"><i className="bi bi-check-circle-fill me-2" />Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isAdmin && recordingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="flex w-full max-w-md flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-white shadow-2xl">
            <div className="rounded-t-[1.5rem] px-6 py-4" style={{ background: "linear-gradient(135deg,#059669,#10B981)" }}>
              <h3 className="text-lg font-black text-white"><i className="bi bi-credit-card me-2" />Record Payment</h3>
              <p className="mt-1 text-xs text-white/70">Record an external transaction. Faculty will be notified.</p>
            </div>
            <div className="px-6 py-5 grid gap-3">
              <select value={payForm.paymentMode} onChange={(e) => setPayForm((f) => ({ ...f, paymentMode: e.target.value }))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Card</option>
                <option value="Online Payment">Online Payment</option>
              </select>
              <input value={payForm.transactionId} onChange={(e) => setPayForm((f) => ({ ...f, transactionId: e.target.value }))} placeholder="Transaction ID / UPI Ref / Cheque No" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="date" value={payForm.paidDate} onChange={(e) => setPayForm((f) => ({ ...f, paidDate: e.target.value }))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p className="text-[10px] text-[var(--color-muted)]">
                The actual payment happens outside this system. You are only recording the transaction reference here. The faculty member will receive a notification.
              </p>
            </div>
            <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setRecordingPaymentId(null)} className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]">Cancel</button>
              <button onClick={handleRecordPayment} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><i className="bi bi-check-circle-fill me-2" />Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
