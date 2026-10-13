"use client";

import { useCallback, useEffect, useState } from "react";

type Activity = {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action?: string;
  category?: string;
  details?: string;
  timestamp?: string;
  ip?: string;
  browser?: string;
  device?: string;
  path?: string;
  method?: string;
  statusCode?: number;
};

const roles = [
  "admin", "staff", "educator",
  "student", "parent", "counsellor",
];

const actions = [
  "login", "logout", "create", "update",
  "delete", "approve", "reject",
  "view", "api_call", "import", "export",
];

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN");
}

export function AdminUserActivityLogs() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "30",
      });

      if (search.trim()) params.set("search", search.trim());
      if (role) params.set("role", role);
      if (action) params.set("action", action);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(
        `/api/admin/user-activity-logs?${params.toString()}`,
        { credentials: "same-origin", cache: "no-store", signal }
      );

      if (!response.ok) {
        throw new Error(`Could not load activities (${response.status})`);
      }

      const data = await response.json();

      if (signal?.aborted) return;
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 0);
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        err instanceof Error ? err.message : "Unable to load activity logs"
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [search, role, action, from, to, page, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function downloadCsv() {
    const columns: (keyof Activity)[] = [
      "timestamp", "userName", "userEmail",
      "userId", "userRole", "action",
      "category", "details", "ip", "path",
      "method", "statusCode",
    ];

    const quote = (value: unknown) =>
      `"${String(value ?? "")
        .replace(/^[=+\-@\t\r]/, "'$&")
        .replace(/"/g, '""')}"`;

    const content = [
      columns.join(","),
      ...logs.map((log) =>
        columns.map((key) => quote(log[key])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartiq-user-activity-current-page.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0A193A]">
            User Activity Logs
          </h2>
          <p className="text-sm text-slate-500">
            Monitor account actions across SmartIQ Institute.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRefresh((n) => n + 1)}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Refresh
          </button>
          <button
            onClick={downloadCsv}
            disabled={!logs.length}
            className="rounded-xl bg-[#0A54B7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Export Current Page
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className={field}
            placeholder="Search user, email, ID or activity"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <select
            className={field}
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            {roles.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>

          <select
            className={field}
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
          >
            <option value="">All Actions</option>
            {actions.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>

          <label className="text-xs text-slate-500">
            From date
            <input
              type="date"
              className={field}
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            />
          </label>

          <label className="text-xs text-slate-500">
            To date
            <input
              type="date"
              className={field}
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
            />
          </label>

          <div className="flex items-end text-sm text-slate-500">
            {total.toLocaleString()} matching events
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[950px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Account</th>
              <th className="p-3">Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Module</th>
              <th className="p-3">Details</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No recorded activities match these filters.
                </td>
              </tr>
            ) : logs.map((log, index) => (
              <tr
                key={log.id ?? `${log.timestamp}-${index}`}
                className="border-t border-slate-100 align-top"
              >
                <td className="whitespace-nowrap p-3 text-xs">
                  {formatDate(log.timestamp)}
                </td>
                <td className="p-3">
                  <div className="font-semibold">{log.userName ?? "-"}</div>
                  <div className="text-xs text-slate-500">
                    {log.userEmail ?? log.userId ?? "-"}
                  </div>
                </td>
                <td className="p-3 capitalize">{log.userRole ?? "-"}</td>
                <td className="p-3 font-semibold capitalize">{log.action ?? "-"}</td>
                <td className="p-3 capitalize">{log.category ?? "-"}</td>
                <td className="max-w-xs p-3">
                  <div>{log.details ?? "-"}</div>
                  <div className="mt-1 break-all text-xs text-slate-400">
                    {log.method} {log.path}
                  </div>
                  <div className="text-xs text-slate-400">
                    {log.browser ?? ""}
                  </div>
                </td>
                <td className="p-3 text-xs">{log.ip ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Page {page} of {Math.max(pages, 1)}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <button
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}