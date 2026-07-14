"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  ManagedUser,
  Role,
  SessionUser,
  StaffPayrollProfile,
  PayrollRun,
  PayrollSlip,
  SalaryAdvance,
  SalaryIncrement,
  SalaryTransfer,
  PayrollRunStatus,
} from "@/lib/types";

type StaffPayrollManagerProps = {
  role: Role;
  session: SessionUser | null;
  managedUsers: ManagedUser[];
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
}

function formatMonth(m: number, y: number) {
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function employmentBadge(type: string) {
  const map: Record<string, { bg: string; text: string }> = {
    full_time: { bg: "bg-emerald-50 text-emerald-700 border border-emerald-200", text: "Full Time" },
    part_time: { bg: "bg-violet-50 text-violet-700 border border-violet-200", text: "Part Time" },
    contractual: { bg: "bg-amber-50 text-amber-700 border border-amber-200", text: "Contractual" },
    hourly: { bg: "bg-purple-50 text-purple-700 border border-purple-200", text: "Hourly" },
  };
  return map[type] || { bg: "bg-gray-50 text-gray-700 border border-gray-200", text: type };
}

function statusBadge(status: PayrollRunStatus) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-amber-100 text-amber-700",
    finalized: "bg-blue-100 text-blue-700",
    settled: "bg-emerald-100 text-emerald-700",
    rolled_back: "bg-rose-100 text-rose-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function slipStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    generated: "bg-blue-100 text-blue-700",
    approved: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    held: "bg-rose-100 text-rose-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function attendanceColor(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 75) return "bg-amber-500";
  return "bg-rose-500";
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function StaffPayrollManager({ role, session, managedUsers }: StaffPayrollManagerProps) {
  const isAdmin = role === "admin";
  const isEducator = role === "educator";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [profiles, setProfiles] = useState<StaffPayrollProfile[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [increments, setIncrements] = useState<SalaryIncrement[]>([]);
  const [transfers, setTransfers] = useState<SalaryTransfer[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modals
  const [showRunModal, setShowRunModal] = useState(false);
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<StaffPayrollProfile | null>(null);
  const [editingSlip, setEditingSlip] = useState<{ run: PayrollRun; slip: PayrollSlip } | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<PayrollRun | null>(null);

  // Form states
  const [runForm, setRunForm] = useState({ workingDays: "26" });
  const [incrementForm, setIncrementForm] = useState({ userId: "", newSalary: "", effectiveDate: now.toISOString().slice(0, 10), reason: "" });
  const [transferForm, setTransferForm] = useState({ userId: "", amount: "", paymentMode: "Bank Transfer", transactionRef: "", notes: "", payrollRunId: "" });
  const [profileForm, setProfileForm] = useState({ employeeId: "", employmentType: "full_time", salaryType: "monthly", monthlySalary: "", hourlyRate: "", perClassRate: "", bankName: "", accountNumber: "", ifscCode: "", panNumber: "", pfEnabled: false, tdsEnabled: false, notes: "" });
  const [slipForm, setSlipForm] = useState({ presentDays: "", grossPay: "", pfDeduction: "", tdsDeduction: "", advanceRecovery: "", paidAmount: "", paidDate: "", paymentMode: "Bank Transfer", transactionRef: "", notes: "" });
  const [rollbackReason, setRollbackReason] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const allStaff = useMemo(
    () => managedUsers.filter((u) => u.role === "educator" || u.role === "student" || u.status === "active").sort((a, b) => a.name.localeCompare(b.name)),
    [managedUsers],
  );

  const staffNameById = useMemo(() => new Map(allStaff.map((u) => [u.id, u.name])), [allStaff]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profilesRes, runsRes] = await Promise.all([
        api<{ profiles: StaffPayrollProfile[] }>("/api/staff-payroll/profiles"),
        api<{ runs: PayrollRun[] }>(`/api/staff-payroll/runs?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      setProfiles(profilesRes.profiles || []);
      const allRuns = runsRes.runs || [];
      setRuns(allRuns);
      setCurrentRun(allRuns[0] || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payroll data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadAdvances = useCallback(async () => {
    try {
      const res = await api<{ advances: SalaryAdvance[] }>("/api/staff-payroll/advances");
      setAdvances(res.advances || []);
    } catch { /* ignore */ }
  }, []);

  const loadIncrements = useCallback(async () => {
    try {
      const res = await api<{ increments: SalaryIncrement[] }>("/api/staff-payroll/increments");
      setIncrements(res.increments || []);
    } catch { /* ignore */ }
  }, []);

  const loadTransfers = useCallback(async () => {
    try {
      const res = await api<{ transfers: SalaryTransfer[] }>("/api/staff-payroll/transfers");
      setTransfers(res.transfers || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (isAdmin) {
      void loadAdvances();
      void loadIncrements();
      void loadTransfers();
    }
  }, [isAdmin, loadAdvances, loadIncrements, loadTransfers]);

  // --- Stats ---
  const stats = useMemo(() => {
    const totalStaff = profiles.length;
    const profilesSetUp = profiles.filter((p) => p.monthlySalary > 0 || p.hourlyRate > 0 || p.perClassRate > 0).length;
    const workingDays = currentRun?.workingDays || 0;
    const totalSettled = transfers.reduce((s, t) => s + t.amount, 0);
    return { totalStaff, profilesSetUp, workingDays, totalSettled };
  }, [profiles, currentRun, transfers]);

  // --- Actions ---
  async function handleRunPayroll(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api("/api/staff-payroll/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, workingDays: Number(runForm.workingDays) || 26 }),
      });
      setNotice("Payroll run created successfully.");
      setShowRunModal(false);
      setRunForm({ workingDays: "26" });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run payroll.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusUpdate(run: PayrollRun, status: PayrollRunStatus, reason?: string) {
    setIsSaving(true);
    setError(null);
    try {
      await api(`/api/staff-payroll/runs/${run.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      setNotice(`Payroll ${status === "rolled_back" ? "rolled back" : status} successfully.`);
      setRollbackTarget(null);
      setRollbackReason("");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleIncrement(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const profile = profiles.find((p) => p.userId === incrementForm.userId);
      await api("/api/staff-payroll/increments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: incrementForm.userId,
          userName: staffNameById.get(incrementForm.userId) || "",
          previousSalary: profile?.monthlySalary || 0,
          newSalary: Number(incrementForm.newSalary),
          effectiveDate: incrementForm.effectiveDate,
          reason: incrementForm.reason,
        }),
      });
      setNotice("Salary increment recorded.");
      setShowIncrementModal(false);
      setIncrementForm({ userId: "", newSalary: "", effectiveDate: now.toISOString().slice(0, 10), reason: "" });
      await Promise.all([loadAll(), loadIncrements()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record increment.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTransfer(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api("/api/staff-payroll/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: transferForm.userId,
          userName: staffNameById.get(transferForm.userId) || "",
          amount: Number(transferForm.amount),
          paymentMode: transferForm.paymentMode,
          transactionRef: transferForm.transactionRef,
          notes: transferForm.notes,
          payrollRunId: transferForm.payrollRunId || undefined,
        }),
      });
      setNotice("Transfer recorded successfully.");
      setShowTransferModal(false);
      setTransferForm({ userId: "", amount: "", paymentMode: "Bank Transfer", transactionRef: "", notes: "", payrollRunId: "" });
      void loadTransfers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record transfer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    if (!editingProfile) return;
    setIsSaving(true);
    setError(null);
    try {
      await api(`/api/staff-payroll/profiles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: editingProfile.id,
          ...profileForm,
          monthlySalary: Number(profileForm.monthlySalary) || 0,
          hourlyRate: Number(profileForm.hourlyRate) || 0,
          perClassRate: Number(profileForm.perClassRate) || 0,
          pfEnabled: profileForm.pfEnabled,
          tdsEnabled: profileForm.tdsEnabled,
        }),
      });
      setNotice("Payroll profile updated.");
      setShowProfileModal(false);
      setEditingProfile(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSlipUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingSlip) return;
    setIsSaving(true);
    setError(null);
    try {
      await api(`/api/staff-payroll/runs/${editingSlip.run.id}/slips/${editingSlip.slip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentDays: Number(slipForm.presentDays) || 0,
          grossPay: Number(slipForm.grossPay) || 0,
          pfDeduction: Number(slipForm.pfDeduction) || 0,
          tdsDeduction: Number(slipForm.tdsDeduction) || 0,
          advanceRecovery: Number(slipForm.advanceRecovery) || 0,
          paidAmount: Number(slipForm.paidAmount) || 0,
          paidDate: slipForm.paidDate || undefined,
          paymentMode: slipForm.paymentMode || undefined,
          transactionRef: slipForm.transactionRef || undefined,
          notes: slipForm.notes || undefined,
        }),
      });
      setNotice("Payslip updated.");
      setEditingSlip(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update slip.");
    } finally {
      setIsSaving(false);
    }
  }

  function openProfileEdit(profile: StaffPayrollProfile) {
    setEditingProfile(profile);
    setProfileForm({
      employeeId: profile.employeeId || "",
      employmentType: profile.employmentType,
      salaryType: profile.salaryType,
      monthlySalary: String(profile.monthlySalary || ""),
      hourlyRate: String(profile.hourlyRate || ""),
      perClassRate: String(profile.perClassRate || ""),
      bankName: profile.bankName || "",
      accountNumber: profile.accountNumber || "",
      ifscCode: profile.ifscCode || "",
      panNumber: profile.panNumber || "",
      pfEnabled: profile.pfEnabled,
      tdsEnabled: profile.tdsEnabled,
      notes: profile.notes || "",
    });
    setShowProfileModal(true);
  }

  function openSlipEdit(run: PayrollRun, slip: PayrollSlip) {
    setEditingSlip({ run, slip });
    setSlipForm({
      presentDays: String(slip.presentDays),
      grossPay: String(slip.grossPay),
      pfDeduction: String(slip.pfDeduction),
      tdsDeduction: String(slip.tdsDeduction),
      advanceRecovery: String(slip.advanceRecovery),
      paidAmount: String(slip.paidAmount),
      paidDate: slip.paidDate || "",
      paymentMode: slip.paymentMode || "Bank Transfer",
      transactionRef: slip.transactionRef || "",
      notes: slip.notes || "",
    });
  }

  // Faculty view: only their own slips
  const facultySlips = useMemo(() => {
    if (!isEducator || !session) return [];
    const mySlips: { run: PayrollRun; slip: PayrollSlip }[] = [];
    for (const run of runs) {
      for (const slip of run.slips) {
        if (slip.userId === session.id) mySlips.push({ run, slip });
      }
    }
    return mySlips;
  }, [isEducator, session, runs]);

  const years = useMemo(() => {
    const current = now.getFullYear();
    return [current, current - 1, current - 2, current - 3];
  }, []);

  if (isLoading) {
    return (
      <div className="surface flex min-h-[28rem] items-center justify-center rounded-[2rem]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  // ========== ADMIN VIEW ==========
  if (isAdmin) {
    return (
      <section className="grid min-w-0 gap-6">
        {/* Header */}
        <header className="surface rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-label">HR / Payroll</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">Staff Payroll</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                Manage payroll for all {stats.totalStaff} staff members. Run monthly payroll, manage salary profiles, record transfers, and track history.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { void loadAll(); }} disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
              <button type="button" onClick={() => setShowIncrementModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm font-bold text-[var(--color-heading)] transition hover:border-emerald-500 hover:text-emerald-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Increment
              </button>
              <button type="button" onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm font-bold text-[var(--color-heading)] transition hover:border-blue-500 hover:text-blue-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Transfer
              </button>
              <button type="button" onClick={() => setShowRunModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Run Payroll
              </button>
            </div>
          </div>
        </header>

        {/* Period Selector */}
        <div className="surface rounded-[2rem] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-[var(--color-muted)]">View Period:</span>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]">
              {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {currentRun && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusBadge(currentRun.status)}`}>
                {currentRun.status.charAt(0).toUpperCase() + currentRun.status.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="surface-soft rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Total Staff</p><p className="text-2xl font-bold text-[var(--color-heading)]">{stats.totalStaff}</p></div>
            </div>
          </article>
          <article className="surface-soft rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Profiles Set Up</p><p className="text-2xl font-bold text-[var(--color-heading)]">{stats.profilesSetUp}</p></div>
            </div>
          </article>
          <article className="surface-soft rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Working Days ({MONTH_NAMES[selectedMonth - 1]?.slice(0, 3)})</p><p className="text-2xl font-bold text-[var(--color-heading)]">{stats.workingDays}</p></div>
            </div>
          </article>
          <article className="surface-soft rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Total Transfers (All Time)</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalSettled)}</p></div>
            </div>
          </article>
        </div>

        {/* Current Run Card */}
        {currentRun ? (
          <article className="surface rounded-[2rem] p-5 sm:p-6" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-heading)]">{currentRun.label} Payroll</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {currentRun.totalStaff} staff · Gross {formatCurrency(currentRun.totalGross)} · Net {formatCurrency(currentRun.totalNet)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(currentRun.status)}`}>{currentRun.status}</span>
                {currentRun.status === "draft" && (
                  <button type="button" onClick={() => void handleStatusUpdate(currentRun, "approved")} disabled={isSaving}
                    className="rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60">
                    Approve
                  </button>
                )}
                {currentRun.status === "approved" && (
                  <button type="button" onClick={() => void handleStatusUpdate(currentRun, "finalized")} disabled={isSaving}
                    className="rounded-full bg-blue-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">
                    Finalize
                  </button>
                )}
                {currentRun.status === "finalized" && (
                  <button type="button" onClick={() => void handleStatusUpdate(currentRun, "settled")} disabled={isSaving}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                    Settle
                  </button>
                )}
                {(currentRun.status === "draft" || currentRun.status === "approved") && (
                  <button type="button" onClick={() => setRollbackTarget(currentRun)} disabled={isSaving}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                    Rollback
                  </button>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex overflow-hidden rounded-lg" style={{ height: 6, background: "#E2E8F0" }}>
                <div className={`flex-1 ${currentRun.status === "draft" || !currentRun.status ? "bg-gray-400" : "bg-emerald-500"}`} />
                <div className={`flex-1 ${currentRun.status === "approved" || currentRun.status === "finalized" || currentRun.status === "settled" ? "bg-amber-500" : "bg-gray-200"}`} />
                <div className={`flex-1 ${currentRun.status === "finalized" || currentRun.status === "settled" ? "bg-blue-500" : "bg-gray-200"}`} />
                <div className={`flex-1 ${currentRun.status === "settled" ? "bg-emerald-500" : "bg-gray-200"}`} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-bold" style={{ color: "#94A3B8" }}>
                <span style={{ color: currentRun.status === "draft" ? "#6B7280" : "#10B981" }}>Draft</span>
                <span>Approved</span>
                <span>Finalized</span>
                <span>Settled</span>
              </div>
            </div>
          </article>
        ) : (
          <article className="surface rounded-[2rem] p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">No payroll run found for {formatMonth(selectedMonth, selectedYear)}. Click &quot;Run Payroll&quot; to create one.</p>
          </article>
        )}

        {/* Staff Table */}
        {currentRun ? (
          <article className="surface overflow-hidden rounded-[2rem]">
            <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
              <p className="section-label">Staff — {currentRun.label}</p>
              <h3 className="mt-2 text-xl font-bold text-[var(--color-heading)]">Payroll Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    <th className="px-5 py-3">Staff</th>
                    <th className="px-5 py-3">Employment</th>
                    <th className="px-5 py-3">Salary</th>
                    <th className="px-5 py-3">Present / {currentRun.workingDays}</th>
                    <th className="px-5 py-3">Attendance</th>
                    <th className="px-5 py-3">Net Pay</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRun.slips.map((slip) => {
                    const eb = employmentBadge(slip.employmentType);
                    const profile = profiles.find((p) => p.userId === slip.userId);
                    return (
                      <tr key={slip.id} className="border-b border-[var(--color-border)] last:border-b-0 transition hover:bg-[var(--color-surface)]">
                        <td className="px-5 py-4">
                          <p className="font-bold text-[var(--color-heading)]">{slip.userName}</p>
                          <p className="text-xs text-[var(--color-muted)]">{slip.employeeId || "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${eb.bg}`}>{eb.text}</span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {slip.monthlySalary > 0 ? `${formatCurrency(slip.monthlySalary)}/mo` :
                           slip.hourlyRate > 0 ? `${formatCurrency(slip.hourlyRate)}/hr` :
                           slip.perClassRate > 0 ? `${formatCurrency(slip.perClassRate)}/class` :
                           <span className="text-[var(--color-muted)]">Not set</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-emerald-600">{slip.presentDays}</span>
                          <span className="text-[var(--color-muted)]"> / {currentRun.workingDays}</span>
                          {slip.presentDays === 0 && currentRun.workingDays > 0 && (
                            <span className="ml-1 text-[10px] text-[var(--color-muted)]">({currentRun.workingDays} absent)</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
                              <div className={`h-full rounded-full ${attendanceColor(slip.attendancePercent)}`} style={{ width: `${slip.attendancePercent}%` }} />
                            </div>
                            <span className="text-xs font-bold">{slip.attendancePercent}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-base font-extrabold text-emerald-600">{formatCurrency(slip.netPay)}</p>
                          <p className="text-[10px] text-[var(--color-muted)]">Gross {formatCurrency(slip.grossPay)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${slipStatusBadge(slip.status)}`}>{slip.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5">
                            {profile && (
                              <button type="button" onClick={() => openProfileEdit(profile)} title="Edit payroll profile"
                                className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              </button>
                            )}
                            <button type="button" onClick={() => openSlipEdit(currentRun, slip)} title="Edit payslip"
                              className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-muted)] transition hover:border-blue-500 hover:text-blue-600">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {/* Payroll History */}
        <article className="surface overflow-hidden rounded-[2rem]">
          <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
            <p className="section-label">Payroll History</p>
            <h3 className="mt-2 text-xl font-bold text-[var(--color-heading)]">All Runs</h3>
          </div>
          {runs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Staff</th>
                    <th className="px-5 py-3">Gross</th>
                    <th className="px-5 py-3">Deductions</th>
                    <th className="px-5 py-3">Net Pay</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-[var(--color-border)] last:border-b-0 transition hover:bg-[var(--color-surface)]">
                      <td className="px-5 py-3 font-bold text-[var(--color-heading)]">{run.label}</td>
                      <td className="px-5 py-3">{run.totalStaff}</td>
                      <td className="px-5 py-3">{formatCurrency(run.totalGross)}</td>
                      <td className="px-5 py-3 text-rose-600">-{formatCurrency(run.totalDeductions)}</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{formatCurrency(run.totalNet)}</td>
                      <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBadge(run.status)}`}>{run.status}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {(run.status === "draft" || run.status === "approved") && (
                            <button type="button" onClick={() => setRollbackTarget(run)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100">
                              Rollback
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--color-muted)]">No payroll history yet.</div>
          )}
        </article>

        {/* Transfer History */}
        {transfers.length > 0 && (
          <article className="surface overflow-hidden rounded-[2rem]">
            <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
              <p className="section-label">Transfer History</p>
              <h3 className="mt-2 text-xl font-bold text-[var(--color-heading)]">Manual Transfers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    <th className="px-5 py-3">Staff</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Mode</th>
                    <th className="px-5 py-3">Ref</th>
                    <th className="px-5 py-3">By</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="px-5 py-3 font-bold text-[var(--color-heading)]">{t.userName}</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-3">{t.paymentMode}</td>
                      <td className="px-5 py-3 text-xs text-[var(--color-muted)]">{t.transactionRef || "—"}</td>
                      <td className="px-5 py-3 text-xs">{t.transferredByName}</td>
                      <td className="px-5 py-3 text-xs text-[var(--color-muted)]">{new Date(t.transferredAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {/* Increment History */}
        {increments.length > 0 && (
          <article className="surface overflow-hidden rounded-[2rem]">
            <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
              <p className="section-label">Salary Increments</p>
              <h3 className="mt-2 text-xl font-bold text-[var(--color-heading)]">Increment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    <th className="px-5 py-3">Staff</th>
                    <th className="px-5 py-3">Previous</th>
                    <th className="px-5 py-3">New</th>
                    <th className="px-5 py-3">Effective</th>
                    <th className="px-5 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {increments.map((inc) => (
                    <tr key={inc.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="px-5 py-3 font-bold text-[var(--color-heading)]">{inc.userName}</td>
                      <td className="px-5 py-3">{formatCurrency(inc.previousSalary)}</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{formatCurrency(inc.newSalary)}</td>
                      <td className="px-5 py-3 text-xs">{inc.effectiveDate}</td>
                      <td className="px-5 py-3 text-xs text-[var(--color-muted)]">{inc.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {/* ========== MODALS ========== */}

        {/* Run Payroll Modal */}
        {showRunModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRunModal(false)}>
            <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-2xl dark:bg-[var(--color-panel)]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[1.5rem] bg-gradient-to-r from-emerald-500 to-green-600 p-5 text-white">
                <h3 className="text-lg font-bold">Run Payroll</h3>
                <p className="mt-1 text-sm text-white/80">Generate payroll for {formatMonth(selectedMonth, selectedYear)}</p>
              </div>
              <form onSubmit={handleRunPayroll} className="p-5">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Working Days
                  <input type="number" min="1" max="31" value={runForm.workingDays} onChange={(e) => setRunForm({ workingDays: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]" />
                </label>
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                  Payroll auto-calculates: attendance × salary rate, PF/TDS deductions. Review results before approving.
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowRunModal(false)} className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={isSaving} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                    {isSaving ? "Generating..." : "Generate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Increment Modal */}
        {showIncrementModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowIncrementModal(false)}>
            <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-2xl dark:bg-[var(--color-panel)]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[1.5rem] bg-gradient-to-r from-emerald-500 to-green-600 p-5 text-white">
                <h3 className="text-lg font-bold">Salary Increment</h3>
              </div>
              <form onSubmit={handleIncrement} className="p-5 grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Staff Member
                  <select value={incrementForm.userId} onChange={(e) => setIncrementForm({ ...incrementForm, userId: e.target.value })} required
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]">
                    <option value="">Select...</option>
                    {allStaff.map((u) => {
                      const p = profiles.find((pr) => pr.userId === u.id);
                      return <option key={u.id} value={u.id}>{u.name}{p ? ` (Current: ${formatCurrency(p.monthlySalary)})` : ""}</option>;
                    })}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  New Monthly Salary (₹)
                  <input type="number" min="1000" value={incrementForm.newSalary} onChange={(e) => setIncrementForm({ ...incrementForm, newSalary: e.target.value })} required placeholder="e.g. 25000"
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Effective Date
                  <input type="date" value={incrementForm.effectiveDate} onChange={(e) => setIncrementForm({ ...incrementForm, effectiveDate: e.target.value })} required
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Reason
                  <input type="text" value={incrementForm.reason} onChange={(e) => setIncrementForm({ ...incrementForm, reason: e.target.value })} placeholder="e.g. Annual appraisal..."
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]" />
                </label>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowIncrementModal(false)} className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={isSaving} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                    {isSaving ? "Saving..." : "Submit Increment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTransferModal(false)}>
            <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-2xl dark:bg-[var(--color-panel)]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[1.5rem] bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
                <h3 className="text-lg font-bold">Manual Salary Transfer</h3>
                <p className="mt-1 text-sm text-white/80">Record a transfer for individual staff</p>
              </div>
              <form onSubmit={handleTransfer} className="p-5 grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Staff Member
                  <select value={transferForm.userId} onChange={(e) => setTransferForm({ ...transferForm, userId: e.target.value })} required
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]">
                    <option value="">Select...</option>
                    {allStaff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Amount (₹)
                  <input type="number" min="1" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} required
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Payment Mode
                  <select value={transferForm.paymentMode} onChange={(e) => setTransferForm({ ...transferForm, paymentMode: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]">
                    <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Transaction Ref
                  <input type="text" value={transferForm.transactionRef} onChange={(e) => setTransferForm({ ...transferForm, transactionRef: e.target.value })} placeholder="UTR / Cheque No."
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Notes
                  <input type="text" value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} placeholder="Optional notes"
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]" />
                </label>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={isSaving} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    {isSaving ? "Recording..." : "Record Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Profile Edit Modal */}
        {showProfileModal && editingProfile && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowProfileModal(false); setEditingProfile(null); }}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl dark:bg-[var(--color-panel)]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[1.5rem] bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white">
                <h3 className="text-lg font-bold">Edit Payroll Profile — {editingProfile.userName}</h3>
              </div>
              <form onSubmit={handleProfileSave} className="p-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Employee ID
                  <input type="text" value={profileForm.employeeId} onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Employment Type
                  <select value={profileForm.employmentType} onChange={(e) => setProfileForm({ ...profileForm, employmentType: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]">
                    <option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contractual">Contractual</option><option value="hourly">Hourly</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Monthly Salary (₹)
                  <input type="number" min="0" value={profileForm.monthlySalary} onChange={(e) => setProfileForm({ ...profileForm, monthlySalary: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Hourly Rate (₹)
                  <input type="number" min="0" value={profileForm.hourlyRate} onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Per Class Rate (₹)
                  <input type="number" min="0" value={profileForm.perClassRate} onChange={(e) => setProfileForm({ ...profileForm, perClassRate: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Bank Name
                  <input type="text" value={profileForm.bankName} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Account Number
                  <input type="text" value={profileForm.accountNumber} onChange={(e) => setProfileForm({ ...profileForm, accountNumber: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  IFSC Code
                  <input type="text" value={profileForm.ifscCode} onChange={(e) => setProfileForm({ ...profileForm, ifscCode: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  PAN Number
                  <input type="text" value={profileForm.panNumber} onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-heading)]">
                    <input type="checkbox" checked={profileForm.pfEnabled} onChange={(e) => setProfileForm({ ...profileForm, pfEnabled: e.target.checked })} className="h-4 w-4 rounded" /> PF
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-heading)]">
                    <input type="checkbox" checked={profileForm.tdsEnabled} onChange={(e) => setProfileForm({ ...profileForm, tdsEnabled: e.target.checked })} className="h-4 w-4 rounded" /> TDS
                  </label>
                </div>
                <label className="col-span-full grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Notes
                  <input type="text" value={profileForm.notes} onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <div className="col-span-full flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowProfileModal(false); setEditingProfile(null); }} className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={isSaving} className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Slip Edit Modal */}
        {editingSlip && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingSlip(null)}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl dark:bg-[var(--color-panel)]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[1.5rem] bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
                <h3 className="text-lg font-bold">Edit Payslip — {editingSlip.slip.userName}</h3>
                <p className="mt-1 text-sm text-white/80">{editingSlip.run.label}</p>
              </div>
              <form onSubmit={handleSlipUpdate} className="p-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Present Days
                  <input type="number" min="0" max={editingSlip.run.workingDays} value={slipForm.presentDays} onChange={(e) => setSlipForm({ ...slipForm, presentDays: e.target.value })} required
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Gross Pay (₹)
                  <input type="number" min="0" value={slipForm.grossPay} onChange={(e) => setSlipForm({ ...slipForm, grossPay: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  PF Deduction (₹)
                  <input type="number" min="0" value={slipForm.pfDeduction} onChange={(e) => setSlipForm({ ...slipForm, pfDeduction: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  TDS Deduction (₹)
                  <input type="number" min="0" value={slipForm.tdsDeduction} onChange={(e) => setSlipForm({ ...slipForm, tdsDeduction: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Advance Recovery (₹)
                  <input type="number" min="0" value={slipForm.advanceRecovery} onChange={(e) => setSlipForm({ ...slipForm, advanceRecovery: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Paid Amount (₹)
                  <input type="number" min="0" value={slipForm.paidAmount} onChange={(e) => setSlipForm({ ...slipForm, paidAmount: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Payment Date
                  <input type="date" value={slipForm.paidDate} onChange={(e) => setSlipForm({ ...slipForm, paidDate: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Payment Mode
                  <select value={slipForm.paymentMode} onChange={(e) => setSlipForm({ ...slipForm, paymentMode: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]">
                    <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Transaction Ref
                  <input type="text" value={slipForm.transactionRef} onChange={(e) => setSlipForm({ ...slipForm, transactionRef: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Notes
                  <input type="text" value={slipForm.notes} onChange={(e) => setSlipForm({ ...slipForm, notes: e.target.value })}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <div className="col-span-full flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingSlip(null)} className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={isSaving} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    {isSaving ? "Saving..." : "Save Payslip"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rollback Modal */}
        {rollbackTarget && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setRollbackTarget(null)}>
            <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-2xl dark:bg-[var(--color-panel)]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[1.5rem] bg-gradient-to-r from-rose-500 to-red-600 p-5 text-white">
                <h3 className="text-lg font-bold">Rollback Payroll</h3>
              </div>
              <div className="p-5">
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  Rolling back will reset all payslips for <strong>{rollbackTarget.label}</strong> and allow regeneration. Paid amounts are NOT automatically reversed.
                </div>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                  Reason *
                  <textarea value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)} rows={3} required placeholder="e.g. Wrong attendance data..."
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
                </label>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={() => setRollbackTarget(null)} className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button>
                  <button type="button" onClick={() => void handleStatusUpdate(rollbackTarget, "rolled_back", rollbackReason)} disabled={isSaving || rollbackReason.length < 3}
                    className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60">
                    {isSaving ? "Rolling back..." : "Confirm Rollback"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ========== EDUCATOR / FACULTY VIEW ==========
  if (isEducator) {
    return (
      <section className="grid min-w-0 gap-6">
        <header className="surface rounded-[2rem] p-5 sm:p-6">
          <div>
            <p className="section-label">My Salary</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">My Payout Details</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              View your monthly salary, attendance, deductions, and payment history. Only you can see your salary details.
            </p>
          </div>
        </header>

        {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}

        {/* Summary Cards */}
        {facultySlips.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="surface-soft rounded-[1.75rem] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Total Earned</p>
              <p className="mt-3 text-2xl font-bold text-[var(--color-heading)]">
                {formatCurrency(facultySlips.reduce((s, fs) => s + fs.slip.grossPay, 0))}
              </p>
            </article>
            <article className="surface-soft rounded-[1.75rem] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Total Received</p>
              <p className="mt-3 text-2xl font-bold text-emerald-600">
                {formatCurrency(facultySlips.reduce((s, fs) => s + fs.slip.paidAmount, 0))}
              </p>
            </article>
            <article className="surface-soft rounded-[1.75rem] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Pending</p>
              <p className="mt-3 text-2xl font-bold text-rose-600">
                {formatCurrency(facultySlips.reduce((s, fs) => s + Math.max(0, fs.slip.netPay - fs.slip.paidAmount), 0))}
              </p>
            </article>
          </div>
        )}

        {/* Payslip History */}
        <article className="surface overflow-hidden rounded-[2rem]">
          <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
            <p className="section-label">Payout History</p>
            <h3 className="mt-2 text-xl font-bold text-[var(--color-heading)]">My Payslips</h3>
          </div>
          {facultySlips.length > 0 ? (
            <div className="grid gap-4 p-5">
              {facultySlips.map(({ run, slip }) => (
                <article key={slip.id} className="surface-soft rounded-[1.75rem] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-[var(--color-heading)]">{run.label}</h4>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${slipStatusBadge(slip.status)}`}>{slip.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {slip.presentDays}/{run.workingDays} days · {slip.attendancePercent}% attendance
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Gross Pay</p>
                      <p className="mt-1 font-bold text-[var(--color-heading)]">{formatCurrency(slip.grossPay)}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Deductions</p>
                      <p className="mt-1 font-bold text-rose-600">-{formatCurrency(slip.totalDeductions)}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">PF: {formatCurrency(slip.pfDeduction)} · TDS: {formatCurrency(slip.tdsDeduction)}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Net Pay</p>
                      <p className="mt-1 font-bold text-emerald-600">{formatCurrency(slip.netPay)}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Received</p>
                      <p className="mt-1 font-bold text-emerald-600">{formatCurrency(slip.paidAmount)}</p>
                      {slip.paidDate && <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">on {slip.paidDate}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--color-muted)]">No salary records available for your account yet.</div>
          )}
        </article>
      </section>
    );
  }

  return null;
}
