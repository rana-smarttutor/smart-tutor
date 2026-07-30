"use client";

import React, { useCallback, useEffect, useState } from "react";

import type { ActionLogAction, ActionLogCategory, ActionLogEntry } from "@/lib/audit-log-types";

type Props = {
  session: { id: string; role: string } | null;
};

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  session_expire: "Session Expired",
  create: "Create",
  update: "Update",
  delete: "Delete",
  view: "View",
  api_call: "API Call",
  bulk_operation: "Bulk Operation",
  approve: "Approve",
  reject: "Reject",
  restore: "Restore",
  import: "Import",
  export: "Export",
};

const ACTION_COLORS: Record<string, string> = {
  login: "#059669",
  logout: "#DC2626",
  session_expire: "#D97706",
  create: "#059669",
  update: "#0284C7",
  delete: "#DC2626",
  view: "#6B7280",
  api_call: "#4F46E5",
  bulk_operation: "#7C3AED",
  approve: "#059669",
  reject: "#DC2626",
  restore: "#7C3AED",
  import: "#0284C7",
  export: "#4F46E5",
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: "Auth",
  fees: "Fees",
  payout: "Payout",
  courses: "Courses",
  users: "Users",
  roles: "Roles",
  students: "Students",
  attendance: "Attendance",
  messages: "Messages",
  library: "Library",
  performance: "Performance",
  settings: "Settings",
  exams: "Exams",
  homework: "Homework",
  certificates: "Certificates",
  placement: "Placement",
  crm: "CRM",
  leave: "Leave",
  communication: "Communication",
  complaints: "Complaints",
  feedback: "Feedback",
  enquiries: "Enquiries",
  payroll: "Payroll",
  expenses: "Expenses",
  other: "Other",
};

type SortableColumn = "timestamp" | "action" | "category" | "userName" | "ip";

function formatTime(ts: string) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function AuditLogPanel({ session }: Props) {
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<{
    total: number;
    today: number;
    byAction: Record<string, number>;
    byCategory: Record<string, number>;
    uniqueUsers: number;
    uniqueIps: number;
  } | null>(null);

  const [actionFilter, setActionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [sortBy, setSortBy] = useState<SortableColumn>("timestamp");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (p: number, sBy?: SortableColumn, sOrd?: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchFilter) params.set("search", searchFilter);
      if (ipFilter) params.set("ip", ipFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(p));
      params.set("limit", String(limit));
      params.set("sortBy", sBy ?? sortBy);
      params.set("sortOrder", sOrd ?? sortOrder);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      setError("Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, categoryFilter, searchFilter, ipFilter, dateFrom, dateTo, limit, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audit-logs?stats=true", {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
  }, [fetchLogs, fetchStats]);

  function handleSort(column: SortableColumn) {
    if (sortBy === column) {
      const newOrder = sortOrder === "desc" ? "asc" : "desc";
      setSortOrder(newOrder);
      fetchLogs(1, column, newOrder);
    } else {
      setSortBy(column);
      setSortOrder("desc");
      fetchLogs(1, column, "desc");
    }
  }

  function handleApply() {
    fetchLogs(1);
  }

  function handleReset() {
    setActionFilter("");
    setCategoryFilter("");
    setSearchFilter("");
    setIpFilter("");
    setDateFrom("");
    setDateTo("");
    setSortBy("timestamp");
    setSortOrder("desc");
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  function SortIcon({ column }: { column: SortableColumn }) {
    if (sortBy !== column) {
      return (
        <svg className="ml-1 inline-block h-3 w-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className={`ml-1 inline-block h-3 w-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  }

  function SortableTh({ column, label, className }: { column: SortableColumn; label: string; className?: string }) {
    return (
      <th
        className={`cursor-pointer select-none px-4 py-3 font-bold text-[var(--color-muted)] hover:text-[var(--color-heading)] ${className || ""}`}
        onClick={() => handleSort(column)}
      >
        {label}
        <SortIcon column={column} />
      </th>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="surface rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Total</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-heading)]">{stats.total}</p>
          </div>
          <div className="surface rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Today</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-heading)]">{stats.today}</p>
          </div>
          <div className="surface rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Users</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-heading)]">{stats.uniqueUsers}</p>
          </div>
          <div className="surface rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">IPs</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-heading)]">{stats.uniqueIps}</p>
          </div>
          <div className="surface rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Top Action</p>
            <p className="mt-1 text-lg font-black text-[var(--color-heading)]">
              {Object.entries(stats.byAction).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
            </p>
          </div>
          <div className="surface rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Top Category</p>
            <p className="mt-1 text-lg font-black text-[var(--color-heading)]">
              {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="surface rounded-[2rem] border border-[var(--color-border)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-bold text-[var(--color-heading)]">Search &amp; Filters</span>
        </div>

        {/* Search row — prominent */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by details, user, email, IP, or path..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder-[var(--color-muted)] focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by IP..."
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-heading)] outline-none placeholder-[var(--color-muted)] focus:border-[var(--color-primary)]"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
              title="To date"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="surface overflow-hidden rounded-[2rem] border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--color-background-strong)]">
                <SortableTh column="timestamp" label="Time" />
                <SortableTh column="userName" label="User" />
                <SortableTh column="action" label="Action" />
                <SortableTh column="category" label="Category" />
                <SortableTh column="ip" label="IP" />
                <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Details</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="cursor-pointer border-b border-[var(--color-border)] hover:bg-[var(--color-background-strong)]/50"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-[var(--color-muted)]">
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-xs font-semibold text-[var(--color-heading)]">
                              {log.userName || log.userEmail || "—"}
                            </div>
                            {log.userRole && (
                              <div className="text-[10px] text-[var(--color-muted)]">{log.userRole}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: ACTION_COLORS[log.action] || "#6B7280" }}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#475569]">
                            {CATEGORY_LABELS[log.category] || log.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-[var(--color-muted)]">{log.ip}</span>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-[var(--color-body)]">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          <svg
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-background-strong)]/30">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs lg:grid-cols-3">
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Entry ID</span>
                                <p className="font-mono text-[var(--color-heading)]">{log.id}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Timestamp</span>
                                <p className="text-[var(--color-heading)]">{formatTime(log.timestamp)}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">User ID</span>
                                <p className="font-mono text-[var(--color-heading)]">{log.userId || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Email</span>
                                <p className="text-[var(--color-heading)]">{log.userEmail || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Role</span>
                                <p className="text-[var(--color-heading)]">{log.userRole || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Path</span>
                                <p className="font-mono text-[var(--color-heading)]">{log.path}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Method</span>
                                <p className="text-[var(--color-heading)]">{log.method}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Status</span>
                                <p className="text-[var(--color-heading)]">{log.statusCode ?? "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Duration</span>
                                <p className="text-[var(--color-heading)]">
                                  {log.duration != null ? `${log.duration}ms` : "—"}
                                </p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">IP Address</span>
                                <p className="font-mono text-[var(--color-heading)]">{log.ip}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Browser</span>
                                <p className="text-[var(--color-heading)]">{log.browser || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">OS</span>
                                <p className="text-[var(--color-heading)]">{log.os || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Device</span>
                                <p className="text-[var(--color-heading)]">{log.device || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">User Agent</span>
                                <p className="max-w-xs truncate font-mono text-[10px] text-[var(--color-heading)]">
                                  {log.userAgent}
                                </p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Referer</span>
                                <p className="truncate text-[var(--color-heading)]">{log.referer || "—"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[var(--color-muted)]">Language</span>
                                <p className="text-[var(--color-heading)]">{log.acceptLanguage || "—"}</p>
                              </div>
                              {log.cfCountry && (
                                <div>
                                  <span className="font-bold text-[var(--color-muted)]">Country (CF)</span>
                                  <p className="text-[var(--color-heading)]">{log.cfCountry}</p>
                                </div>
                              )}
                              {log.geo && (
                                <div>
                                  <span className="font-bold text-[var(--color-muted)]">Geo Location</span>
                                  <p className="text-[var(--color-heading)]">
                                    {[log.geo.city, log.geo.region, log.geo.country]
                                      .filter(Boolean)
                                      .join(", ") || "—"}
                                  </p>
                                </div>
                              )}
                              {log.metadata && (
                                <div className="col-span-2 lg:col-span-3">
                                  <span className="font-bold text-[var(--color-muted)]">Metadata</span>
                                  <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-[var(--color-panel)] p-2 font-mono text-[10px] text-[var(--color-heading)]">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
            <span className="text-xs text-[var(--color-muted)]">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="rounded-lg px-3 py-1 text-xs font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)] disabled:opacity-30"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="rounded-lg px-3 py-1 text-xs font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)] disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
