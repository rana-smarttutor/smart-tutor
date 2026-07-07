"use client";

import { useEffect, useMemo, useState } from "react";

import type { Batch } from "@/lib/types";

type ManagedUser = {
  id: string;
  name: string;
  role: string;
  status: string;
  program?: string;
};

type BatchManagerProps = {
  managedUsers: ManagedUser[];
};

type BatchForm = {
  name: string;
  code: string;
  courseName: string;
  subject: string;
  capacity: string;
  schedule: string;
  startDate: string;
  endDate: string;
  studentIds: string[];
  teacherIds: string[];
};

const emptyForm: BatchForm = {
  name: "",
  code: "",
  courseName: "",
  subject: "",
  capacity: "",
  schedule: "",
  startDate: "",
  endDate: "",
  studentIds: [],
  teacherIds: [],
};

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getFillPercent(batch: Batch): number {
  const cap = batch.capacity ?? 0;
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((batch.studentIds.length / cap) * 100));
}

function getBatchStatusMeta(batch: Batch) {
  if (batch.status === "archived") {
    return { label: "Inactive", bg: "bg-slate-100 text-slate-600" };
  }
  const now = new Date();
  if (batch.endDate) {
    const end = new Date(batch.endDate);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (diffDays < 0) return { label: "Expired", bg: "bg-red-100 text-red-700" };
    if (diffDays <= 30) return { label: "Ending soon", bg: "bg-amber-100 text-amber-700" };
  }
  return { label: "Active", bg: "bg-emerald-100 text-emerald-700" };
}

function getBatchTopColor(batch: Batch): string {
  if (batch.status === "archived") return "bg-slate-300";
  const fill = getFillPercent(batch);
  if (fill >= 100) return "bg-red-400";
  if (fill >= 80) return "bg-amber-400";
  return "bg-[var(--color-primary)]";
}

export function BatchManager({ managedUsers }: BatchManagerProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const students = useMemo(
    () =>
      managedUsers.filter(
        (user) => user.role === "student" && user.status === "active",
      ),
    [managedUsers],
  );

  const teachers = useMemo(
    () =>
      managedUsers.filter(
        (user) => user.role === "educator" && user.status === "active",
      ),
    [managedUsers],
  );

  useEffect(() => {
    void loadBatches();
  }, []);

  async function loadBatches() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/batches", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = (await response.json()) as { batches?: Batch[]; error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "Unable to load batches.");
        return;
      }
      setBatches(payload.batches ?? []);
    } catch {
      setMessage("Unable to load batches.");
    } finally {
      setIsLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = batches.length;
    const active = batches.filter((b) => b.status === "active").length;
    const inactive = batches.filter((b) => b.status === "archived").length;
    const totalStudents = batches.reduce((s, b) => s + b.studentIds.length, 0);
    const now = new Date();
    const expiring = batches.filter((b) => {
      if (!b.endDate || b.status !== "active") return false;
      const end = new Date(b.endDate);
      const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return diff >= 0 && diff <= 30;
    }).length;
    return { total, active, inactive, totalStudents, expiring };
  }, [batches]);

  const filteredBatches = useMemo(() => {
    let list = showInactive ? batches : batches.filter((b) => b.status === "active");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.code && b.code.toLowerCase().includes(q)) ||
          (b.courseName && b.courseName.toLowerCase().includes(q)) ||
          (b.subject && b.subject.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [batches, showInactive, searchQuery]);

  function getUserName(userId: string) {
    return managedUsers.find((u) => u.id === userId)?.name;
  }

  function getUserNames(userIds: string[]) {
    return userIds
      .map((id) => getUserName(id))
      .filter(Boolean)
      .join(", ");
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function openAddModal() {
    resetForm();
    setEditingBatchId(null);
    setShowAddModal(true);
    setMessage("");
  }

  function openEditModal(batch: Batch) {
    setEditingBatchId(batch.id);
    setForm({
      name: batch.name ?? "",
      code: batch.code ?? "",
      courseName: batch.courseName ?? "",
      subject: batch.subject ?? "",
      capacity: batch.capacity != null ? String(batch.capacity) : "",
      schedule: batch.schedule ?? "",
      startDate: batch.startDate ?? "",
      endDate: batch.endDate ?? "",
      studentIds: batch.studentIds ?? [],
      teacherIds: batch.teacherIds ?? [],
    });
    setShowEditModal(true);
    setMessage("");
  }

  function updateForm<Key extends keyof BatchForm>(key: Key, value: BatchForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSelection(key: "studentIds" | "teacherIds", userId: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(userId)
        ? current[key].filter((id) => id !== userId)
        : [...current[key], userId],
    }));
  }

  async function saveBatch() {
    if (!form.name.trim()) {
      setMessage("Batch name is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const body = {
        name: form.name,
        code: form.code || undefined,
        courseName: form.courseName || undefined,
        subject: form.subject || undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        schedule: form.schedule || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        studentIds: form.studentIds,
        teacherIds: form.teacherIds,
      };

      if (!editingBatchId) {
        const response = await fetch("/api/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as { batch?: Batch; error?: string };
        if (!response.ok || !payload.batch) {
          setMessage(payload.error ?? "Unable to create batch.");
          return;
        }
        setMessage("Batch created successfully.");
      } else {
        const response = await fetch("/api/batches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: editingBatchId, ...body }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setMessage(payload.error ?? "Unable to update batch.");
          return;
        }
        setMessage("Batch updated successfully.");
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      setEditingBatchId(null);
      await loadBatches();
    } catch {
      setMessage("Something went wrong while saving the batch.");
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveBatch(batchId: string) {
    if (!window.confirm("Archive this batch? Students and teachers will no longer see it.")) return;
    try {
      const response = await fetch("/api/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, status: "archived" }),
      });
      if (!response.ok) {
        setMessage("Unable to archive batch.");
        return;
      }
      setMessage("Batch archived.");
      await loadBatches();
    } catch {
      setMessage("Unable to archive batch.");
    }
  }

  async function handleDelete(batchId: string) {
    try {
      const response = await fetch("/api/batches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setMessage(payload.error ?? "Unable to delete batch.");
        setDeleteConfirmId(null);
        return;
      }
      setBatches((current) => current.filter((b) => b.id !== batchId));
      setDeleteConfirmId(null);
      setMessage("Batch deleted.");
    } catch {
      setMessage("Unable to delete batch.");
      setDeleteConfirmId(null);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Academic Operations</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-heading)]">
              Batch Management
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Create and manage student batches, assign faculty, and track capacity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-muted)]">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-primary)]"
              />
              Show Inactive
            </label>
            <button type="button" onClick={openAddModal} className="btn-action btn-md font-bold">
              + Add Batch
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="surface-soft rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-extrabold text-[var(--color-primary)]">{stats.total}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Total</p>
          </div>
          <div className="surface-soft rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-extrabold text-[var(--color-success)]">{stats.active}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Active</p>
          </div>
          <div className="surface-soft rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-extrabold text-[var(--color-warning)]">{stats.totalStudents}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Students</p>
          </div>
          <div className="surface-soft rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-extrabold text-[var(--color-danger)]">{stats.expiring}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Expiring</p>
          </div>
          <div className="surface-soft rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-extrabold text-slate-500">{stats.inactive}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Inactive</p>
          </div>
        </div>

        {/* Search/filter */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, course, or subject..."
              className="surface-soft w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 pl-10 text-sm text-[var(--color-heading)] outline-none transition focus:border-[var(--color-primary)]"
            />
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-[var(--color-muted)]">
            {filteredBatches.length} batch{filteredBatches.length === 1 ? "" : "es"}
          </span>
        </div>

        {message ? (
          <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">{message}</p>
        ) : null}
      </div>

      {/* Batch grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="surface rounded-2xl p-5 animate-pulse">
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
              <div className="mt-4 flex gap-3">
                <div className="h-10 w-10 rounded bg-slate-200" />
                <div className="h-10 flex-1 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBatches.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBatches.map((batch) => {
            const statusMeta = getBatchStatusMeta(batch);
            const fillPct = getFillPercent(batch);
            const cap = batch.capacity ?? 0;
            const teacherName = getUserName(batch.teacherIds[0]) || "To be assigned";
            const teacherNames = batch.teacherIds.length > 1
              ? `${teacherName} +${batch.teacherIds.length - 1}`
              : teacherName;

            return (
              <div
                key={batch.id}
                className="surface rounded-2xl overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Color top bar */}
                <div className={`h-2 ${getBatchTopColor(batch)}`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-[var(--color-heading)] truncate">
                        {batch.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {batch.code ? (
                          <code className="rounded-md bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                            {batch.code}
                          </code>
                        ) : null}
                        {batch.courseName ? (
                          <span className="rounded-md bg-[var(--color-info)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-info)]">
                            {batch.courseName}
                          </span>
                        ) : null}
                        {batch.subject ? (
                          <span className="rounded-md bg-[var(--color-purple)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-purple)]">
                            {batch.subject}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.bg}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 flex gap-4">
                    <div className="text-center">
                      <p className="text-lg font-extrabold text-[var(--color-primary)]">
                        {batch.studentIds.length}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-extrabold text-[var(--color-success)]">
                        {cap || "—"}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Capacity</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-extrabold ${fillPct >= 100 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
                        {cap > 0 ? `${fillPct}%` : "—"}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Fill</p>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  {cap > 0 ? (
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPct >= 100
                            ? "bg-[var(--color-danger)]"
                            : fillPct >= 80
                              ? "bg-[var(--color-warning)]"
                              : "bg-[var(--color-success)]"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  ) : null}

                  {/* Teacher info */}
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--color-background-strong)] p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)]">
                      {getInitials(getUserName(batch.teacherIds[0]))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--color-heading)] truncate">{teacherNames}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">Faculty</p>
                    </div>
                  </div>

                  {/* Date range */}
                  {batch.startDate || batch.endDate ? (
                    <p className="mt-3 text-[11px] text-[var(--color-muted)]">
                      {batch.startDate ? formatDate(batch.startDate) : "—"} → {batch.endDate ? formatDate(batch.endDate) : "—"}
                    </p>
                  ) : null}

                  {/* Schedule */}
                  {batch.schedule ? (
                    <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)]">
                      {batch.schedule}
                    </p>
                  ) : null}

                  {/* Action buttons */}
                  <div className="mt-4 flex gap-2 border-t border-[var(--color-border)] pt-4">
                    <button
                      type="button"
                      onClick={() => openEditModal(batch)}
                      className="flex-1 rounded-xl border border-[var(--color-primary)]/30 px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
                    >
                      Edit
                    </button>
                    {batch.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => void archiveBatch(batch.id)}
                        className="flex-1 rounded-xl border border-[var(--color-warning)]/30 px-3 py-2 text-xs font-bold text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/10"
                      >
                        Archive
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(batch.id)}
                      className="flex-1 rounded-xl border border-[var(--color-danger)]/30 px-3 py-2 text-xs font-bold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface rounded-[2rem] p-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            {searchQuery || showInactive ? "No batches match your filters." : "No batches created yet. Click \"+ Add Batch\" to get started."}
          </p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl my-auto">
            <div className="rounded-t-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] px-6 py-5">
              <h3 className="text-lg font-bold text-white">Add Batch</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="e.g. Class 10 CBSE - Morning"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Code
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) => updateForm("code", e.target.value)}
                    placeholder="e.g. X-CBSE-MORN"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Course / Program
                  </label>
                  <input
                    value={form.courseName}
                    onChange={(e) => updateForm("courseName", e.target.value)}
                    placeholder="e.g. Class 10 CBSE"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Subject
                  </label>
                  <input
                    value={form.subject}
                    onChange={(e) => updateForm("subject", e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Capacity
                  </label>
                  <input
                    value={form.capacity}
                    onChange={(e) => updateForm("capacity", e.target.value)}
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Schedule
                  </label>
                  <input
                    value={form.schedule}
                    onChange={(e) => updateForm("schedule", e.target.value)}
                    placeholder="e.g. Mon, Wed, Fri · 5:00 PM"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Start Date
                  </label>
                  <input
                    value={form.startDate}
                    onChange={(e) => updateForm("startDate", e.target.value)}
                    type="date"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    End Date
                  </label>
                  <input
                    value={form.endDate}
                    onChange={(e) => updateForm("endDate", e.target.value)}
                    type="date"
                    className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                  />
                </div>
              </div>

              {/* Students */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Students</p>
                  <span className="text-[10px] text-[var(--color-muted)]">{form.studentIds.length} selected</span>
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-strong)] p-2">
                  {students.length ? students.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--color-panel)] px-3 py-2 text-sm transition hover:bg-[var(--color-primary)]/5">
                      <input
                        type="checkbox"
                        checked={form.studentIds.includes(s.id)}
                        onChange={() => toggleSelection("studentIds", s.id)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span className="font-medium text-[var(--color-heading)]">{s.name}</span>
                      <span className="ml-auto text-[10px] text-[var(--color-muted)]">{s.program || "Student"}</span>
                    </label>
                  )) : (
                    <p className="p-3 text-sm text-[var(--color-muted)]">No active students.</p>
                  )}
                </div>
              </div>

              {/* Teachers */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Faculty</p>
                  <span className="text-[10px] text-[var(--color-muted)]">{form.teacherIds.length} selected</span>
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-strong)] p-2">
                  {teachers.length ? teachers.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--color-panel)] px-3 py-2 text-sm transition hover:bg-[var(--color-primary)]/5">
                      <input
                        type="checkbox"
                        checked={form.teacherIds.includes(t.id)}
                        onChange={() => toggleSelection("teacherIds", t.id)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span className="font-medium text-[var(--color-heading)]">{t.name}</span>
                      <span className="ml-auto text-[10px] text-[var(--color-muted)]">Faculty</span>
                    </label>
                  )) : (
                    <p className="p-3 text-sm text-[var(--color-muted)]">No active faculty.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)]">
                Cancel
              </button>
              <button type="button" onClick={() => void saveBatch()} disabled={isSaving} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {isSaving ? "Saving..." : "Add Batch"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl my-auto">
            <div className="rounded-t-2xl bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning-strong)] px-6 py-5">
              <h3 className="text-lg font-bold text-white">Edit Batch</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Code</label>
                  <input value={form.code} onChange={(e) => updateForm("code", e.target.value)} className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Course / Program</label>
                  <input value={form.courseName} onChange={(e) => updateForm("courseName", e.target.value)} className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Subject</label>
                  <input value={form.subject} onChange={(e) => updateForm("subject", e.target.value)} className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Capacity</label>
                  <input value={form.capacity} onChange={(e) => updateForm("capacity", e.target.value)} type="number" min="0" className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Schedule</label>
                  <input value={form.schedule} onChange={(e) => updateForm("schedule", e.target.value)} className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Start Date</label>
                  <input value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} type="date" className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">End Date</label>
                  <input value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} type="date" className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none" />
                </div>
              </div>

              {/* Students */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Students</p>
                  <span className="text-[10px] text-[var(--color-muted)]">{form.studentIds.length} selected</span>
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-strong)] p-2">
                  {students.length ? students.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--color-panel)] px-3 py-2 text-sm transition hover:bg-[var(--color-primary)]/5">
                      <input type="checkbox" checked={form.studentIds.includes(s.id)} onChange={() => toggleSelection("studentIds", s.id)} className="h-4 w-4 accent-[var(--color-primary)]" />
                      <span className="font-medium text-[var(--color-heading)]">{s.name}</span>
                      <span className="ml-auto text-[10px] text-[var(--color-muted)]">{s.program || "Student"}</span>
                    </label>
                  )) : (
                    <p className="p-3 text-sm text-[var(--color-muted)]">No active students.</p>
                  )}
                </div>
              </div>

              {/* Teachers */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Faculty</p>
                  <span className="text-[10px] text-[var(--color-muted)]">{form.teacherIds.length} selected</span>
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-strong)] p-2">
                  {teachers.length ? teachers.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--color-panel)] px-3 py-2 text-sm transition hover:bg-[var(--color-primary)]/5">
                      <input type="checkbox" checked={form.teacherIds.includes(t.id)} onChange={() => toggleSelection("teacherIds", t.id)} className="h-4 w-4 accent-[var(--color-primary)]" />
                      <span className="font-medium text-[var(--color-heading)]">{t.name}</span>
                      <span className="ml-auto text-[10px] text-[var(--color-muted)]">Faculty</span>
                    </label>
                  )) : (
                    <p className="p-3 text-sm text-[var(--color-muted)]">No active faculty.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button type="button" onClick={() => { setShowEditModal(false); resetForm(); setEditingBatchId(null); }} className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)]">
                Cancel
              </button>
              <button type="button" onClick={() => void saveBatch()} disabled={isSaving} className="rounded-xl bg-[var(--color-warning)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete confirm */}
      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--color-heading)]">Delete batch?</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">This will also remove all teacher assignments. This cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-heading)]">
                Cancel
              </button>
              <button type="button" onClick={() => void handleDelete(deleteConfirmId)} className="flex-1 rounded-xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
