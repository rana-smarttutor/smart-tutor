"use client";

import { Fragment, useEffect, useState } from "react";

import type { FeeDeletionAuditLog, SessionUser } from "@/lib/types";

type Props = {
  session: SessionUser | null;
};

type AuditStats = {
  totalDeletions: number;
  thisMonth: number;
  totalPrincipalDeleted: number;
  totalNetReversed: number;
  totalFineReversed: number;
};

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return { bg: "#ECFDF5", fg: "#065F46" };
  if (s === "partial") return { bg: "#FEF3C7", fg: "#92400E" };
  if (s === "overdue") return { bg: "#FEF2F2", fg: "#991B1B" };
  return { bg: "#EEF2FF", fg: "#4F46E5" };
}

export function FeeDeletionAuditLogComponent({ session }: Props) {
  const [logs, setLogs] = useState<FeeDeletionAuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [deletedBy, setDeletedBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (studentSearch) params.set("studentSearch", studentSearch);
      if (deletedBy) params.set("deletedBy", deletedBy);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (paymentMode) params.set("paymentMode", paymentMode);

      const res = await fetch(`/api/fee-deletion-audit-log?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply() {
    fetchLogs();
  }

  function handleReset() {
    setStudentSearch("");
    setDeletedBy("");
    setDateFrom("");
    setDateTo("");
    setPaymentMode("");
    setTimeout(fetchLogs, 0);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="fdl-outer">
      {/* Header */}
      <div className="fdl-hd">
        <div>
          <div className="fdl-title">Fee Deletion Audit Log</div>
          <div className="fdl-sub">Immutable record of every deleted fee payment</div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="fdl-warn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        This log is read-only and tamper-proof
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="fdl-cards">
          <div className="fdl-card">
            <div className="fdl-card-v">{stats.totalDeletions}</div>
            <div className="fdl-card-l">Total Deletions</div>
          </div>
          <div className="fdl-card">
            <div className="fdl-card-v">{stats.thisMonth}</div>
            <div className="fdl-card-l">This Month</div>
          </div>
          <div className="fdl-card">
            <div className="fdl-card-v">{fmtCurrency(stats.totalPrincipalDeleted)}</div>
            <div className="fdl-card-l">Total Principal Deleted</div>
          </div>
          <div className="fdl-card">
            <div className="fdl-card-v">{fmtCurrency(stats.totalNetReversed)}</div>
            <div className="fdl-card-l">Total Net Reversed</div>
          </div>
          <div className="fdl-card">
            <div className="fdl-card-v">{fmtCurrency(stats.totalFineReversed)}</div>
            <div className="fdl-card-l">Fine Reversed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="fdl-filters">
        <div className="fdl-fi">
          <label>Student Name / ADM # / Receipt</label>
          <input
            type="text"
            placeholder="Search student..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
        </div>
        <div className="fdl-fi">
          <label>Deleted By</label>
          <input
            type="text"
            placeholder="Admin name..."
            value={deletedBy}
            onChange={(e) => setDeletedBy(e.target.value)}
          />
        </div>
        <div className="fdl-fi">
          <label>From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="fdl-fi">
          <label>To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="fdl-fi">
          <label>Payment Method</label>
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Online Payment">Online Payment</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          <button className="fdl-btn fdl-btn-primary" onClick={handleApply}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Apply
          </button>
          <button className="fdl-btn fdl-btn-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="fdl-card-tbl">
        {loading ? (
          <div className="fdl-empty">
            <div style={{ fontSize: 14, color: "#6366F1" }}>Loading audit logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="fdl-empty">
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            No fee deletion records found
          </div>
        ) : (
          <table className="fdl-tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Receipt</th>
                <th>Student</th>
                <th>Fee</th>
                <th style={{ textAlign: "right" }}>Principal</th>
                <th style={{ textAlign: "right" }}>Fine</th>
                <th style={{ textAlign: "right" }}>Discount</th>
                <th style={{ textAlign: "right" }}>Net Reversed</th>
                <th>Method</th>
                <th>Pay Date</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th>Fee Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const beforeColor = statusColor(log.previousFeeStatus);
                const afterColor = statusColor(log.newFeeStatus);

                return (
                  <Fragment key={log.id}>
                    <tr>
                      <td>
                        <button
                          className="fdl-expand-btn"
                          onClick={() => toggleExpand(log.id)}
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? "−" : "+"}
                        </button>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            fontWeight: 700,
                            background: "#F1F5F9",
                            border: "1px solid #E2E8F0",
                            borderRadius: 4,
                            padding: "2px 6px",
                            display: "inline-block",
                          }}
                        >
                          {log.receiptNo || "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
                          {log.studentName}
                        </div>
                        {log.studentAdmNo && (
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>
                            ADM: {log.studentAdmNo}
                          </div>
                        )}
                        {log.courseName && (
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>
                            {log.courseName}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
                          {log.feeTitle}
                        </div>
                        {log.feeType && (
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>
                            {log.feeType}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {fmtCurrency(log.principalAmount)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {fmtCurrency(log.fineAmount)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ color: log.discountAmount > 0 ? "#059669" : undefined }}>
                          {fmtCurrency(log.discountAmount)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: "#4F46E5", fontVariantNumeric: "tabular-nums" }}>
                        {fmtCurrency(log.netReversed)}
                      </td>
                      <td>
                        <span
                          className="fdl-pill"
                          style={{
                            background: "#EEF2FF",
                            color: "#4F46E5",
                          }}
                        >
                          {log.paymentMode}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                        {fmtDate(log.paymentDate)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "#0F172A" }}>
                          {log.performedByName}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>
                          {log.performedByEmail}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 11 }}>{fmtDate(log.createdAt)}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{fmtTime(log.createdAt)}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                          <span
                            className="fdl-pill"
                            style={{ background: beforeColor.bg, color: beforeColor.fg }}
                          >
                            {log.previousFeeStatus}
                          </span>
                          <span style={{ color: "#94A3B8", fontSize: 10 }}>→</span>
                          <span
                            className="fdl-pill"
                            style={{ background: afterColor.bg, color: afterColor.fg }}
                          >
                            {log.newFeeStatus}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    <tr className={`fdl-detail-row ${isExpanded ? "open" : ""}`}>
                      <td colSpan={13}>
                        <div className="fdl-detail-box">
                          <div className="fdl-detail-grid">
                            <div className="fdl-di">
                              <div className="fdl-di-l">Log ID</div>
                              <div className="fdl-di-v">{log.id}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Receipt No</div>
                              <div className="fdl-di-v">{log.receiptNo || "—"}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Student ID</div>
                              <div className="fdl-di-v">{log.studentId}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Balance Before (Paid)</div>
                              <div className="fdl-di-v">{fmtCurrency(log.balanceBeforePaid)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Balance Before (Due)</div>
                              <div className="fdl-di-v">{fmtCurrency(log.balanceBeforeDue)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Balance After (Paid)</div>
                              <div className="fdl-di-v">{fmtCurrency(log.balanceAfterPaid)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Balance After (Due)</div>
                              <div className="fdl-di-v">{fmtCurrency(log.balanceAfterDue)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Deletion Timestamp</div>
                              <div className="fdl-di-v">{fmtDateTime(log.createdAt)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">IP Address</div>
                              <div className="fdl-di-v">{log.ipAddress || "—"}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Originally Recorded By</div>
                              <div className="fdl-di-v">{log.performedByName}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer */}
        {!loading && (
          <div className="fdl-page">
            <span>
              Showing {logs.length} of {stats?.totalDeletions ?? logs.length} records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
