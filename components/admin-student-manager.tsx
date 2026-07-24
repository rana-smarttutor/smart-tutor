"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ManagedUser,
  StudentDirectoryEntry,
  StudentRiskLevel,
  StudentStats,
} from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "#14B8A6", "#6366F1", "#8B5CF6", "#EC4899",
    "#F59E0B", "#10B981", "#3B82F6", "#EF4444",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inactive": return "bg-slate-100 text-slate-500 border-slate-200";
    case "at_risk": return "bg-rose-50 text-rose-700 border-rose-200";
    case "dropped": return "bg-red-50 text-red-700 border-red-200";
    case "graduated": return "bg-blue-50 text-blue-700 border-blue-200";
    case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function riskBadge(level?: StudentRiskLevel) {
  if (!level || level === "low") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Low
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      High
    </span>
  );
}

function attendanceBar(pct: number) {
  const color = pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
    </div>
  );
}

interface Props {
  initialStudents: ManagedUser[];
}

export default function AdminStudentManager({ initialStudents }: Props) {
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([]);
  const [stats, setStats] = useState<StudentStats>({ total: 0, active: 0, atRisk: 0, dropped: 0, newThisMonth: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDirectoryEntry | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [buFile, setBuFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [buResult, setBuResult] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [buLoading, setBuLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setStudents(data.students as StudentDirectoryEntry[]);
      } else {
        setError(data.error ?? "Failed to fetch students");
      }
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/students?mode=stats");
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
    fetchStats();
  };

  const handleFilterChange = () => {
    fetchStudents();
    fetchStats();
  };

  const runRiskScores = async () => {
    setRiskLoading(true);
    try {
      const res = await fetch("/api/admin/students?mode=risk-scores", { method: "GET" });
      const data = await res.json();
      if (data.ok) {
        fetchStudents();
        fetchStats();
      }
    } finally {
      setRiskLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!buFile) return;
    setBuLoading(true);
    setBuResult(null);
    try {
      const formData = new FormData();
      formData.append("file", buFile);
      const res = await fetch("/api/admin/students/bulk-update", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) {
        setBuResult(`Updated: ${data.result.updated}, Skipped: ${data.result.skipped}${data.result.errors.length ? `, Errors: ${data.result.errors.join("; ")}` : ""}`);
        fetchStudents();
        fetchStats();
      } else {
        setBuResult(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setBuResult(`Error: ${e.message}`);
    } finally {
      setBuLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("send_welcome_email", "1");
      formData.append("skip_duplicates", "1");
      formData.append("auto_generate_password", "1");
      const res = await fetch("/api/admin/students/import", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) {
        setImportResult(`Imported: ${data.result.imported}, Skipped: ${data.result.skipped}${data.result.errors.length ? `, Errors: ${data.result.errors.join("; ")}` : ""}`);
        fetchStudents();
        fetchStats();
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setImportResult(`Error: ${e.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (student: StudentDirectoryEntry) => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;
    setActionLoading(student.id);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: student.id, mode: "delete" }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchStudents();
        fetchStats();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (student: StudentDirectoryEntry) => {
    setActionLoading(student.id);
    try {
      await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate", userId: student.id, name: student.name, email: student.email, program: student.program, password: "" }),
      });
      fetchStudents();
      fetchStats();
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: "bi-people-fill", color: "var(--primary)", bg: "var(--primary-grad-12-3, #EEF2FF)", textColor: "var(--primary, #4F46E5)" },
    { label: "Active", value: stats.active, icon: "bi-person-check-fill", color: "#059669", bg: "#DCFCE7", textColor: "#059669" },
    { label: "At Risk", value: stats.atRisk, icon: "bi-exclamation-triangle-fill", color: "#DC2626", bg: "#FEE2E2", textColor: "#DC2626" },
    { label: "Dropped", value: stats.dropped, icon: "bi-person-dash-fill", color: "#64748B", bg: "#F1F5F9", textColor: "#64748B" },
    { label: "New (Month)", value: stats.newThisMonth, icon: "bi-person-add", color: "#0284C7", bg: "#F0F9FF", textColor: "#0284C7" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">Manage all enrolled students</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={runRiskScores}
            disabled={riskLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {riskLoading ? "Computing..." : "AI Risk Scores"}
          </button>
          <button
            onClick={() => { setShowBulkModal(true); setBuResult(null); setBuFile(null); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Bulk Update
          </button>
          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Import
          </button>
          <a
            href="/api/admin/students?mode=export"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: card.bg, color: card.textColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {card.icon === "bi-people-fill" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />}
                  {card.icon === "bi-person-check-fill" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {card.icon === "bi-exclamation-triangle-fill" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                  {card.icon === "bi-person-dash-fill" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14h6m-3-3v6" />}
                  {card.icon === "bi-person-add" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />}
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs font-medium text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, admission no..."
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setTimeout(handleFilterChange, 0); }}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="at_risk">At Risk</option>
          <option value="dropped">Dropped</option>
          <option value="graduated">Graduated</option>
        </select>
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all cursor-pointer">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter
        </button>
        {(searchQuery || statusFilter) && (
          <button
            type="button"
            onClick={() => { setSearchQuery(""); setStatusFilter(""); fetchStudents(); fetchStats(); }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Clear
          </button>
        )}
      </form>

      {/* Student Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {error && <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-100">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Student</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Admission No.</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3 hidden md:table-cell">Attendance</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Fees</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3 hidden md:table-cell">Risk</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Status</th>
                <th className="text-center font-semibold text-slate-600 px-4 py-3" style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: getAvatarColor(student.name) }}
                        >
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-slate-600">{student.admissionNo || "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {attendanceBar(student.attendancePercent ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-slate-400">
                        {student.feesStatus === "none" ? "No Fees" : student.feesStatus === "paid" ? "Paid" : student.feesStatus === "partial" ? "Partial" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{riskBadge(student.riskLevel)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${statusBadgeClass(student.status)}`}>
                        {String(student.status) === "active" ? "Active" : String(student.status) === "inactive" ? "Inactive" : String(student.status) === "at_risk" ? "At Risk" : String(student.status) === "dropped" ? "Dropped" : String(student.status) === "graduated" ? "Graduated" : String(student.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={`/admin/students/${student.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                          title="View Profile"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </a>
                        <a
                          href={`/admin/students/${student.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-amber-600 transition-all"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </a>
                        {student.status !== "active" && (
                          <button
                            onClick={() => handleReactivate(student)}
                            disabled={actionLoading === student.id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
                            title="Reactivate"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(student)}
                          disabled={actionLoading === student.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all cursor-pointer"
                          title="Delete student"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-400">
          Showing {students.length} student{students.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-sky-500 px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Bulk Update Students</h3>
                  <p className="text-white/70 text-xs mt-1">Download, edit in Excel, and re-upload to update existing student records</p>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
              <div className="p-6 border-r border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">How to Bulk Update</div>
                {[
                  { num: "1", title: "Download Current Data", desc: "Click below to export a pre-filled CSV with all existing student data." },
                  { num: "2", title: "Edit in Excel", desc: "Update any column. Do NOT change the admission_number column — it is the matching key." },
                  { num: "3", title: "Upload & Apply", desc: "Upload the edited CSV. Each row is matched by admission_number." },
                  { num: "4", title: "Review Results", desc: "See how many students were updated and which rows were skipped." },
                ].map((step) => (
                  <div key={step.num} className="flex gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{step.num}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                      <div className="text-xs text-slate-500">{step.desc}</div>
                      {step.num === "1" && (
                        <a href="/api/admin/students?mode=export" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Download Student Data (CSV)
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50/50">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Upload Edited CSV</div>
                <div
                  className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-all"
                  onClick={() => document.getElementById("buFileInput")?.click()}
                >
                  <div className="text-4xl text-emerald-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="text-sm font-semibold text-emerald-700 mb-1">Click to upload or drag & drop</div>
                  <div className="text-xs text-slate-400">CSV only · Max 10MB · Matches by admission_number</div>
                  {buFile && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {buFile.name}
                    </div>
                  )}
                </div>
                <input
                  id="buFileInput"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setBuFile(e.target.files?.[0] ?? null)}
                />
                {buResult && (
                  <div className="mt-3 p-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">{buResult}</div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Only existing students are modified. No new students are created.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!buFile || buLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-sky-500 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {buLoading ? "Updating..." : "Apply Updates"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Bulk Import Students</h3>
                  <p className="text-white/70 text-xs mt-1">Upload a CSV to enroll multiple students at once</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
              <div className="p-6 border-r border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">How to Import</div>
                {[
                  { num: "1", title: "Download Template", desc: "Start with our pre-formatted CSV template." },
                  { num: "2", title: "Fill Student Data", desc: "Open in Excel/Sheets. Do NOT rename column headers." },
                  { num: "3", title: "Upload & Validate", desc: "Upload the file — we validate before importing." },
                  { num: "4", title: "Review Results", desc: "See success/error counts and download error report." },
                ].map((step) => (
                  <div key={step.num} className="flex gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{step.num}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                      <div className="text-xs text-slate-500">{step.desc}</div>
                      {step.num === "1" && (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const csv = "name,email,phone,batch_code,date_of_birth,father_name,guardian_phone,address\nTanish,ankit@smarttutors.co.in,9876543210,JEE-XI-A,2007-04-15,Rajiv Sharma,9876500001,42 Main Street";
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "student-import-template.csv";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Download Template
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50/50">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Upload CSV File</div>
                <div
                  className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-all"
                  onClick={() => document.getElementById("importFileInput")?.click()}
                >
                  <div className="text-4xl text-indigo-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div className="text-sm font-semibold text-indigo-700 mb-1">Click to upload or drag & drop</div>
                  <div className="text-xs text-slate-400">CSV only · Max 5MB · Up to 1,000 rows</div>
                  {importFile && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {importFile.name}
                    </div>
                  )}
                </div>
                <input
                  id="importFileInput"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Import Options</div>
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 cursor-pointer" /> Send welcome email with login credentials
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 cursor-pointer" /> Skip duplicate emails (don't re-import)
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 cursor-pointer" /> Auto-generate password if column is empty
                  </label>
                </div>
                {importResult && (
                  <div className="mt-3 p-3 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">{importResult}</div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                All data is encrypted and stored securely.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {importLoading ? "Importing..." : "Import Students"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
