"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AvailableModule, CustomRole, CustomRoleAssignment } from "@/lib/types";
import { AVAILABLE_MODULES } from "@/lib/types";

type Props = {
  managedUsers: { id: string; name: string; role: string; email: string }[];
};

type Tab = "roles" | "staff" | "permissions";

type StatusBanner = {
  type: "success" | "error";
  message: string;
};

const MODULE_GROUPS: Record<string, AvailableModule[]> = {
  "Dashboard & Access": ["overview", "accounts", "students", "password-reset-requests"],
  "People & Staff": ["attendance", "leave"],
  Academics: [
    "courses",
    "lectures",
    "timetable",
    "homework",
    "tests",
    "weekly-tests",
    "daily-activities",
    "student-feedback",
    "performance",
    "library",
  ],
  Communication: ["messages", "chat", "chat-monitor", "notifications", "ptm"],
  Finance: ["fees", "fee-installments", "teacher-payouts"],
  Growth: ["sales-crm", "placement-jobs", "gamification"],
};

function groupModules() {
  const result: { group: string; modules: { id: AvailableModule; label: string }[] }[] = [];
  const availableIds = new Set(AVAILABLE_MODULES.map((m) => m.id));
  for (const [group, ids] of Object.entries(MODULE_GROUPS)) {
    const mods = ids.filter((id) => availableIds.has(id)).map((id) => AVAILABLE_MODULES.find((m) => m.id === id)!);
    if (mods.length > 0) result.push({ group, modules: mods });
  }
  return result;
}

export function RolesManager({ managedUsers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("roles");
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [assignments, setAssignments] = useState<CustomRoleAssignment[]>([]);
  const [stats, setStats] = useState({ totalRoles: 0, activeRoles: 0, totalStaff: 0, staffAssigned: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusBanner, setStatusBanner] = useState<StatusBanner | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showStatus(type: StatusBanner["type"], message: string, autoHide = true) {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setStatusBanner({ type, message });
    if (autoHide && type === "success") {
      bannerTimer.current = setTimeout(() => setStatusBanner(null), 3000);
    }
  }

  // Delete confirmation inline
  const [deleteTarget, setDeleteTarget] = useState<CustomRole | null>(null);

  // New role form
  const [newRole, setNewRole] = useState({ name: "", description: "", color: "#4F46E5", modules: [] as AvailableModule[] });

  // Edit role modal
  const [editTarget, setEditTarget] = useState<CustomRole | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editMod, setEditMod] = useState<AvailableModule[]>([]);

  // User permissions tab
  const [userModuleEdits, setUserModuleEdits] = useState<Record<string, AvailableModule[]>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/roles", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRoles(data.roles || []);
      setAssignments(data.assignments || []);
      if (data.stats) setStats(data.stats);
    } catch {
      setError("Could not load roles data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  function getAssignedUsers(roleId: string) {
    return assignments.filter((a) => a.roleId === roleId).map((a) => managedUsers.find((u) => u.id === a.userId)).filter(Boolean);
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRole.name.trim()) {
      showStatus("error", "Role name is required.", false);
      return;
    }
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(newRole),
      });
      if (!res.ok) {
        const data = await res.json();
        showStatus("error", data.error || "Failed to create role.", false);
        return;
      }
      setNewRole({ name: "", description: "", color: "#4F46E5", modules: [] });
      showStatus("success", "Role created successfully.");
      void fetchAll();
    } catch {
      showStatus("error", "Network error.", false);
    }
  }

  async function handleUpdateRole(id: string) {
    if (!editName.trim()) {
      showStatus("error", "Role name is required.", false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), color: editColor, modules: editMod }),
      });
      if (!res.ok) {
        const data = await res.json();
        showStatus("error", data.error || "Failed to update.", false);
        return;
      }
      setEditTarget(null);
      showStatus("success", "Role updated successfully.");
      void fetchAll();
    } catch {
      showStatus("error", "Network error.", false);
    }
  }

  async function handleDeleteRole(id: string) {
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) {
        const data = await res.json();
        showStatus("error", data.error || "Delete failed.", false);
        return;
      }
      showStatus("success", "Role deleted.");
      void fetchAll();
    } catch {
      showStatus("error", "Network error.", false);
    }
  }

  function openEdit(role: CustomRole) {
    setEditTarget(role);
    setEditName(role.name);
    setEditDesc(role.description || "");
    setEditColor(role.color);
    setEditMod(role.modules);
  }

  async function handleAssignRole(userId: string, roleId: string) {
    if (!roleId) return;
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId, roleId, roleName: role.name }),
      });
      if (!res.ok) {
        const data = await res.json();
        showStatus("error", data.error || "Failed to assign.", false);
        return;
      }
      void fetchAll();
    } catch {
      showStatus("error", "Network error.", false);
    }
  }

  async function handleRemoveRole(userId: string, roleId: string) {
    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId, roleId }),
      });
      if (!res.ok) {
        const data = await res.json();
        showStatus("error", data.error || "Failed to remove.", false);
        return;
      }
      void fetchAll();
    } catch {
      showStatus("error", "Network error.", false);
    }
  }

  async function handleSaveUserPermissions(userId: string) {
    const modules = userModuleEdits[userId] || [];
    setSavingUserId(userId);
    try {
      const res = await fetch("/api/admin/users/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId, modules }),
      });
      if (!res.ok) {
        const data = await res.json();
        showStatus("error", data.error || "Failed to save permissions.", false);
        return;
      }
      setEditingUserId(null);
      showStatus("success", "User permissions saved.");
    } catch {
      showStatus("error", "Network error.", false);
    } finally {
      setSavingUserId(null);
    }
  }

  function toggleModule(mod: AvailableModule, target: AvailableModule[], setter: (v: AvailableModule[]) => void) {
    setter(target.includes(mod) ? target.filter((m) => m !== mod) : [...target, mod]);
  }

  function selectAllModules(setter: (v: AvailableModule[]) => void) {
    setter(AVAILABLE_MODULES.map((m) => m.id));
  }

  function clearAllModules(setter: (v: AvailableModule[]) => void) {
    setter([]);
  }

  const grouped = groupModules();

  function renderModuleToggles(mods: AvailableModule[], setter: (v: AvailableModule[]) => void) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => selectAllModules(setter)} className="rounded-lg bg-[var(--color-primary)]/10 px-3 py-1 text-[11px] font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20">
            Select All
          </button>
          <button type="button" onClick={() => clearAllModules(setter)} className="rounded-lg bg-[#F1F5F9] px-3 py-1 text-[11px] font-bold text-[var(--color-muted)] transition hover:bg-[#E2E8F0]">
            Clear All
          </button>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] text-white">{mods.length}</span>
            / {AVAILABLE_MODULES.length} modules
          </span>
        </div>
        {grouped.map(({ group, modules }) => (
          <div key={group}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{group}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {modules.map((mod) => (
                <label key={mod.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--color-body)] hover:bg-[var(--color-primary)]/5">
                  <input
                    type="checkbox"
                    checked={mods.includes(mod.id)}
                    onChange={() => toggleModule(mod.id, mods, setter)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  {mod.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {statusBanner && (
        <div
          className={`rounded-xl p-4 text-sm font-semibold ${
            statusBanner.type === "success" ? "border border-[#A7F3D0] bg-[#ECFDF5] text-[#067647]" : "border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusBanner.type === "success" ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
              {statusBanner.message}
            </div>
            <button type="button" onClick={() => setStatusBanner(null)} className="text-current opacity-60 hover:opacity-100">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="section-label">Settings</p>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-heading)]">Roles &amp; Permissions</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Create custom roles and control which modules staff can access.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
        {[
          { label: "Custom Roles", value: stats.totalRoles, icon: "shield-check", color: "#4F46E5", bg: "#EEF2FF" },
          { label: "Active Roles", value: stats.activeRoles, icon: "toggle-on", color: "#059669", bg: "#ECFDF5" },
          { label: "Staff Members", value: managedUsers.length, icon: "people", color: "#0284C7", bg: "#E0F2FE" },
          { label: "Staff Assigned", value: stats.staffAssigned, icon: "person-check", color: "#D97706", bg: "#FEF3C7" },
        ].map((s) => (
          <div key={s.label} className="surface rounded-2xl p-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg }}>
              <svg className="h-5 w-5" fill="none" stroke={s.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                  s.icon === "shield-check" ? "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.59 3.689 10.352 8.618 11.544a3 3 0 00.764 0C17.311 19.352 21 14.59 21 9a12.03 12.03 0 00-.382-2.016z" :
                  s.icon === "toggle-on" ? "M9 3l5.646 5.646a.5.5 0 01-.353.853H5.707a.5.5 0 01-.353-.853L9 3zm8 18l-5.646-5.646a.5.5 0 01.353-.853h8.586a.5.5 0 01.353.853L17 21z" :
                  s.icon === "people" ? "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" :
                  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.59 3.689 10.352 8.618 11.544a3 3 0 00.764 0C17.311 19.352 21 14.59 21 9a12.03 12.03 0 00-.382-2.016z"
                } />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-heading)]">{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
        {([
          { id: "roles" as Tab, label: "Roles", count: stats.totalRoles },
          { id: "staff" as Tab, label: "Staff Assignments", count: managedUsers.length },
          { id: "permissions" as Tab, label: "User Permissions", count: managedUsers.length },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === t.id ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)] hover:bg-[var(--color-primary)]/10"
            }`}
          >
            <span className="rounded-md bg-current/20 px-1.5 py-0.5 text-xs">{t.count}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ======================== ROLES TAB ======================== */}
      {activeTab === "roles" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Existing roles */}
          <div className="surface rounded-[2rem] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--color-heading)]">Custom Roles</h3>
            </div>
            {roles.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No custom roles created yet.</p>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => {
                  const assignedUsers = getAssignedUsers(role.id);
                  const roleModules = role.modules || [];
                  const moduleLabels = roleModules.map((m) => AVAILABLE_MODULES.find((a) => a.id === m)?.label || m);
                  const displayModules = moduleLabels.slice(0, 5);
                  const remaining = moduleLabels.length - 5;
                  return (
                    <div key={role.id} className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
                      <div className="h-1" style={{ background: role.color }} />
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: role.color + "18" }}>
                              <svg className="h-4 w-4" fill="none" stroke={role.color} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.59 3.689 10.352 8.618 11.544a3 3 0 00.764 0C17.311 19.352 21 14.59 21 9a12.03 12.03 0 00-.382-2.016z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--color-heading)]">{role.name}</div>
                              {role.description && <div className="text-[11px] text-[var(--color-muted)]">{role.description}</div>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => openEdit(role)} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10">
                              Edit
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(role)} className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#EF4444] transition-colors hover:bg-[#FEF2F2]" title="Delete">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#ECFDF3] px-2.5 py-1 text-[10px] font-bold text-[#067647]">
                            {assignedUsers.length} staff
                          </span>
                          <span className="inline-block rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[10px] font-bold text-[#166534] border border-[#A7F3D0]">
                            {moduleLabels.length} module{moduleLabels.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {displayModules.map((label) => (
                            <span key={label} className="inline-flex items-center gap-1 rounded-md bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-bold text-[#067647]">
                              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              {label}
                            </span>
                          ))}
                          {remaining > 0 && (
                            <span className="rounded-md bg-[#E0E7FF] px-2 py-0.5 text-[10px] font-bold text-[#4338CA]">+{remaining} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create new role */}
          <div className="surface rounded-[2rem] p-6">
            <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Role Name *</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  required
                  placeholder="e.g. Front desk"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Description</label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Color</label>
                  <input type="color" value={newRole.color} onChange={(e) => setNewRole({ ...newRole, color: e.target.value })} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-1" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Module Permissions</label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                  {renderModuleToggles(newRole.modules, (v) => setNewRole({ ...newRole, modules: v }))}
                </div>
              </div>
              <button type="submit" className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                Create Role
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================== STAFF TAB ======================== */}
      {activeTab === "staff" && (
        <div className="surface rounded-[2rem] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-bold text-[var(--color-heading)]">Staff Members</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--color-background-strong)]">
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Staff Member</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">System Role</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Custom Roles</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {managedUsers.map((user) => {
                  const userAssignments = assignments.filter((a) => a.userId === user.id);
                  const availableRoles = roles.filter((r) => !userAssignments.some((a) => a.roleId === r.id));
                  return (
                    <tr key={user.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-strong)]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B40A1] text-xs font-bold text-white">
                            {user.name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-heading)]">{user.name}</div>
                            <div className="text-[11px] text-[var(--color-muted)]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {userAssignments.length === 0 ? (
                            <span className="text-xs text-[#CBD5E1]">No roles assigned</span>
                          ) : (
                            userAssignments.map((a) => (
                              <span key={a.id} className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-bold text-[#4338CA]">
                                {a.roleName}
                                <button type="button" onClick={() => handleRemoveRole(user.id, a.roleId)} className="ml-0.5 text-[#818CF8] hover:text-[#EF4444]" title="Remove">&times;</button>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                          value=""
                          onChange={(e) => {
                            const roleId = e.target.value;
                            e.target.value = "";
                            if (roleId) handleAssignRole(user.id, roleId);
                          }}
                        >
                          <option value="">+ Assign role...</option>
                          {availableRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== USER PERMISSIONS TAB ======================== */}
      {activeTab === "permissions" && (
        <div className="surface rounded-[2rem] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-bold text-[var(--color-heading)]">User Permissions</span>
            </div>
            <span className="text-xs text-[var(--color-muted)]">Set direct module access per staff member</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--color-background-strong)]">
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Staff Member</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">System Role</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Assigned Custom Roles</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Direct Permissions</th>
                </tr>
              </thead>
              <tbody>
                {managedUsers.map((user) => {
                  const userAssignments = assignments.filter((a) => a.userId === user.id);
                  const currentEdits = userModuleEdits[user.id] || [];
                  const isEditing = editingUserId === user.id;
                  const isSaving = savingUserId === user.id;
                  const editCount = currentEdits.length;

                  return (
                    <React.Fragment key={user.id}>
                      <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-strong)]/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B40A1] text-xs font-bold text-white">
                              {user.name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[var(--color-heading)]">{user.name}</div>
                              <div className="text-[11px] text-[var(--color-muted)]">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">{user.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {userAssignments.length === 0 ? (
                              <span className="text-xs text-[#CBD5E1]">None</span>
                            ) : (
                              userAssignments.map((a) => (
                                <span key={a.id} className="inline-flex items-center rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-bold text-[#4338CA]">
                                  {a.roleName}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <span className="text-[11px] font-bold text-[var(--color-primary)]">
                              Editing... ({editCount}/{AVAILABLE_MODULES.length})
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                                  <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${(editCount / AVAILABLE_MODULES.length) * 100}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-[var(--color-muted)]">{editCount}/{AVAILABLE_MODULES.length}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setUserModuleEdits((prev) => ({ ...prev, [user.id]: currentEdits.length > 0 ? currentEdits : [] }));
                                }}
                                className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
                              >
                                Edit Permissions
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {isEditing && (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 bg-[var(--color-background-strong)]">
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-bold text-[var(--color-heading)]">Module Permissions for {user.name}</p>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
                                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] text-white">{editCount}</span>
                                  of {AVAILABLE_MODULES.length} modules
                                </div>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {renderModuleToggles(currentEdits, (v) => setUserModuleEdits((prev) => ({ ...prev, [user.id]: v })))}
                              </div>
                              <div className="mt-4 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveUserPermissions(user.id)}
                                  disabled={isSaving}
                                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== EDIT ROLE MODAL ======================== */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setEditTarget(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--color-panel)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-heading)]">Edit Permissions: {editTarget.name}</h3>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-semibold">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Description</label>
                <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Color</label>
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-1" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Modules</label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                  {renderModuleToggles(editMod, setEditMod)}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]">
                  Cancel
                </button>
                <button type="button" onClick={() => handleUpdateRole(editTarget.id)} className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white transition hover:opacity-90">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== DELETE CONFIRM MODAL ======================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-[var(--color-panel)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-heading)]">Delete Role</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--color-body)]">
                Delete role <span className="font-bold text-[var(--color-heading)]">&lsquo;{deleteTarget.name}&rsquo;</span>? Staff with this role will lose these permissions.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]">
                  Cancel
                </button>
                <button type="button" onClick={() => handleDeleteRole(deleteTarget.id)} className="rounded-full bg-[#EF4444] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#DC2626]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
