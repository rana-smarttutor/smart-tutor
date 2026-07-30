"use client";

import { Fragment, useEffect, useState } from "react";

import type { FeeTransactionLog, SessionUser } from "@/lib/types";

type Props = {
  session: SessionUser | null;
};

type Stats = {
  totalTransactions: number;
  thisMonth: number;
  totalAmount: number;
  byType: Record<string, number>;
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  invoice_created: "Invoice Created",
  invoice_deleted: "Invoice Deleted",
  installment_payment: "Installment Payment",
  installment_plan_deleted: "Installment Plan Deleted",
  payout_created: "Payout Created",
  payout_updated: "Payout Updated",
  payout_deleted: "Payout Deleted",
  payout_payment_recorded: "Payout Payment Recorded",
};

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  invoice_created: "#059669",
  invoice_deleted: "#DC2626",
  installment_payment: "#0284C7",
  installment_plan_deleted: "#DC2626",
  payout_created: "#7C3AED",
  payout_updated: "#D97706",
  payout_deleted: "#DC2626",
  payout_payment_recorded: "#059669",
};

function fmtCurrency(n: number | undefined | null) {
  if (n == null) return "₹0";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | undefined | null) {
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

export function FeeTransactionLogComponent({ session }: Props) {
  const [logs, setLogs] = useState<FeeTransactionLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("transactionType", typeFilter);
      if (search) params.set("search", search);
      if (performedBy) params.set("performedBy", performedBy);
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
    setTypeFilter("");
    setSearch("");
    setPerformedBy("");
    setDateFrom("");
    setDateTo("");
    setPaymentMode("");
    setTimeout(fetchLogs, 0);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function getTypeLabel(type: string) {
    return TRANSACTION_TYPE_LABELS[type] || type;
  }

  function getTypeColor(type: string) {
    return TRANSACTION_TYPE_COLORS[type] || "#6366F1";
  }

  const allTypes = Object.keys(TRANSACTION_TYPE_LABELS);

  return (
    <div className="fdl-outer">
      {/* Header */}
      <div className="fdl-hd">
        <div>
          <div className="fdl-title">Transaction Log</div>
          <div className="fdl-sub">
            Immutable record of every invoice, payment, and payout transaction
          </div>
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
            <div className="fdl-card-v">{stats.totalTransactions}</div>
            <div className="fdl-card-l">Total Transactions</div>
          </div>
          <div className="fdl-card">
            <div className="fdl-card-v">{stats.thisMonth}</div>
            <div className="fdl-card-l">This Month</div>
          </div>
          <div className="fdl-card">
            <div className="fdl-card-v">{fmtCurrency(stats.totalAmount)}</div>
            <div className="fdl-card-l">Total Volume</div>
          </div>
          {Object.entries(stats.byType).slice(0, 4).map(([type, count]) => (
            <div className="fdl-card" key={type}>
              <div className="fdl-card-v" style={{ color: getTypeColor(type) }}>{count}</div>
              <div className="fdl-card-l">{getTypeLabel(type)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="fdl-filters">
        <div className="fdl-fi">
          <label>Transaction Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{TRANSACTION_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="fdl-fi">
          <label>Search</label>
          <input
            type="text"
            placeholder="Student / Staff / Receipt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="fdl-fi">
          <label>Performed By</label>
          <input
            type="text"
            placeholder="Admin name..."
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
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
            <div style={{ fontSize: 14, color: "#6366F1" }}>Loading transaction logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="fdl-empty">
            No transaction records found
          </div>
        ) : (
          <table className="fdl-tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Type</th>
                <th>Reference</th>
                <th>Person</th>
                <th>Detail</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Method</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const typeColor = getTypeColor(log.transactionType);
                const personName = log.studentName || log.staffName || "—";
                const personId = log.studentId || log.staffId || "";
                const detail = log.feeTitle || log.payoutTitle || log.installmentTitle || log.courseName || "—";

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
                          className="fdl-pill"
                          style={{ background: typeColor + "18", color: typeColor }}
                        >
                          {getTypeLabel(log.transactionType)}
                        </span>
                      </td>
                      <td>
                        {log.receiptNo ? (
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
                            {log.receiptNo}
                          </span>
                        ) : log.invoiceId ? (
                          <span style={{ fontSize: 10, color: "#94A3B8" }}>
                            {log.invoiceId.slice(0, 12)}...
                          </span>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
                          {personName}
                        </div>
                        {personId && (
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>
                            {personId.slice(0, 12)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
                          {detail}
                        </div>
                        {log.month && (
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>{log.month}</div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {fmtCurrency(log.amount)}
                      </td>
                      <td>
                        {log.paymentMode ? (
                          <span className="fdl-pill" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                            {log.paymentMode}
                          </span>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "#0F172A" }}>
                          {log.performedByName}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 11 }}>{fmtDate(log.createdAt)}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{fmtTime(log.createdAt)}</div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    <tr className={`fdl-detail-row ${isExpanded ? "open" : ""}`}>
                      <td colSpan={9}>
                        <div className="fdl-detail-box">
                          <div className="fdl-detail-grid">
                            <div className="fdl-di">
                              <div className="fdl-di-l">Transaction ID</div>
                              <div className="fdl-di-v">{log.id}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Type</div>
                              <div className="fdl-di-v">{getTypeLabel(log.transactionType)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Amount</div>
                              <div className="fdl-di-v">{fmtCurrency(log.amount)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Payment Method</div>
                              <div className="fdl-di-v">{log.paymentMode || "—"}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Payment Date</div>
                              <div className="fdl-di-v">{fmtDate(log.paymentDate)}</div>
                            </div>
                            {log.receiptNo && (
                              <div className="fdl-di">
                                <div className="fdl-di-l">Receipt No</div>
                                <div className="fdl-di-v">{log.receiptNo}</div>
                              </div>
                            )}
                            {log.studentName && (
                              <div className="fdl-di">
                                <div className="fdl-di-l">Student</div>
                                <div className="fdl-di-v">{log.studentName}</div>
                              </div>
                            )}
                            {log.staffName && (
                              <div className="fdl-di">
                                <div className="fdl-di-l">Staff</div>
                                <div className="fdl-di-v">{log.staffName}</div>
                              </div>
                            )}
                            {log.courseName && (
                              <div className="fdl-di">
                                <div className="fdl-di-l">Course</div>
                                <div className="fdl-di-v">{log.courseName}</div>
                              </div>
                            )}
                            {log.month && (
                              <div className="fdl-di">
                                <div className="fdl-di-l">Month</div>
                                <div className="fdl-di-v">{log.month}</div>
                              </div>
                            )}
                            {log.installmentNumber && (
                              <div className="fdl-di">
                                <div className="fdl-di-l">Installment</div>
                                <div className="fdl-di-v">#{log.installmentNumber}</div>
                              </div>
                            )}
                            <div className="fdl-di">
                              <div className="fdl-di-l">Performed By</div>
                              <div className="fdl-di-v">{log.performedByName} ({log.performedByEmail})</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">Timestamp</div>
                              <div className="fdl-di-v">{fmtDateTime(log.createdAt)}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">IP Address</div>
                              <div className="fdl-di-v" style={{ fontFamily: "monospace", fontSize: 10 }}>{log.ipAddress || "—"}</div>
                            </div>
                            <div className="fdl-di">
                              <div className="fdl-di-l">User Agent</div>
                              <div className="fdl-di-v" style={{ fontSize: 10, wordBreak: "break-word" }}>{log.userAgent || "—"}</div>
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
              Showing {logs.length} of {stats?.totalTransactions ?? logs.length} records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
