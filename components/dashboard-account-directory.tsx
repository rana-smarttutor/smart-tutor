"use client";

import { useEffect, useMemo, useState } from "react";

import type { ManagedUser, Role } from "@/lib/types";

type DashboardAccountDirectoryProps = {
  initialUsers: ManagedUser[];
};

type CreateAccountForm = {
  name: string;
  email: string;
  role: Role;
  program: string;
  password: string;
  confirm: boolean;
  linkedStudentId: string;
  parentName: string;
  parentEmail: string;
  parentMobile: string;
  assignedFacultyIds: string[];
};

export function DashboardAccountDirectory({
  initialUsers,
}: DashboardAccountDirectoryProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ManagedUser>>({});
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "directory" | "verification">("register");
  const [pendingRequests, setPendingRequests] = useState<ManagedUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<CreateAccountForm>({
    name: "",
    email: "",
    role: "student",
    program: "",
    password: "Student@123",
    confirm: false,
    linkedStudentId: "",
    parentName: "",
    parentEmail: "",
    parentMobile: "",
    assignedFacultyIds: [],
  });

  const accountCounts = useMemo(
    () => ({
      students: users.filter((item) => item.role === "student").length,
      educators: users.filter((item) => item.role === "educator").length,
      admins: users.filter((item) => item.role === "admin").length,
      parents: users.filter((item) => item.role === "parent").length,
      counsellors: users.filter((item) => item.role === "counsellor").length,
      total: users.length,
    }),
    [users],
  );

  const studentOptions = useMemo(
    () => users.filter((item) => item.role === "student").sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const educatorOptions = useMemo(
    () => users.filter((item) => item.role === "educator").sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const sortedUsers = useMemo(() => {
    const roleOrder: Record<Role, number> = {
      admin: 0,
      counsellor: 1,
      educator: 2,
      student: 3,
      parent: 4,
    };
    return [...users].sort((left, right) => {
      const rd = roleOrder[left.role] - roleOrder[right.role];
      return rd !== 0 ? rd : left.name.localeCompare(right.name);
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = sortedUsers;
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.program.toLowerCase().includes(q),
      );
    }
    return list;
  }, [sortedUsers, roleFilter, searchQuery]);

  useEffect(() => {
    if (activeTab !== "verification") return;
    fetch("/api/admin/user-requests", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.requests)) setPendingRequests(data.requests);
      })
      .catch(() => {});
  }, [activeTab]);

  async function handleCreate() {
    const response = await fetch("/api/users", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const payload = (await response.json()) as { user?: ManagedUser; error?: string };
    if (!response.ok || !payload.user) {
      setStatus(payload.error ?? "New account could not be created.");
      return;
    }
    setUsers((current) => [payload.user as ManagedUser, ...current]);
    setCreateForm({
      name: "",
      email: "",
      role: "student",
      program: "",
      password: "Student@123",
      confirm: false,
      linkedStudentId: "",
      parentName: "",
      parentEmail: "",
      parentMobile: "",
      assignedFacultyIds: [],
    });
    setActiveTab("directory");
    setStatus("New registered account draft created.");
  }

  async function handleSave(userId: string) {
    const draft = drafts[userId];
    if (!draft) return;
    const response = await fetch("/api/users", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draft.id,
        name: draft.name,
        email: draft.email,
        role: draft.role,
        program: draft.program,
        status: draft.status,
        password: draft.passwordHint,
        verified: draft.verified,
        assignedFacultyIds: draft.assignedFacultyIds ?? null,
      }),
    });
    const payload = (await response.json()) as { user?: ManagedUser; error?: string };
    if (!response.ok || !payload.user) {
      setStatus(payload.error ?? "Account update could not be prepared.");
      return;
    }
    setUsers((current) =>
      current.map((item) => (item.id === userId ? { ...item, ...payload.user } : item)),
    );
    setEditingUserId(null);
    setStatus("Editable account draft prepared.");
  }

  async function handleDelete(userId: string) {
    if (!confirm("Delete this account permanently? This action cannot be undone.")) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    if (res.ok) {
      setUsers((current) => current.filter((u) => u.id !== userId));
      setStatus("Account deleted.");
    } else {
      const data = await res.json();
      setStatus(data.error ?? "Delete failed.");
    }
  }

  const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
    active: { bg: "#DCFCE7", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
    rejected: { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  };

  function getStatusStyle(status: string) {
    return statusStyles[status] ?? { bg: "#F1F5F9", color: "#64748B", border: "#E2E8F0" };
  }

  function getRoleIcon(role: Role) {
    switch (role) {
      case "admin": return "bi-shield-fill-check";
      case "educator": return "bi-person-workspace";
      case "student": return "bi-mortarboard-fill";
      case "parent": return "bi-people-fill";
      case "counsellor": return "bi-chat-dots-fill";
    }
  }

  function getRoleColor(role: Role) {
    switch (role) {
      case "admin": return { bg: "#EEF2FF", color: "#4F46E5" };
      case "educator": return { bg: "#F0F9FF", color: "#0284C7" };
      case "student": return { bg: "#F0FDF4", color: "#16A34A" };
      case "parent": return { bg: "#FFF7ED", color: "#D97706" };
      case "counsellor": return { bg: "#F5F3FF", color: "#7C3AED" };
    }
  }

  const isEditing = (userId: string) => editingUserId === userId;

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* ── Gradient Header ── */}
      <div
        className="px-6 py-5 text-white"
        style={{
          background: "linear-gradient(135deg, #1E1B4B, var(--color-primary), #6D28D9)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/60">
              Academics / <strong className="text-white">Accounts</strong>
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              Accounts
            </h1>
            <p className="mt-1 text-sm text-white/65">
              Register and manage all people across the institute
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
            <i className="bi bi-people-fill" />
            {accountCounts.total} accounts
          </span>
        </div>
      </div>

      {status ? (
        <div className="mx-6 mt-4 rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-[var(--color-border)]">
          {status}
        </div>
      ) : null}

      {/* ── Tab Buttons ── */}
      <div className="flex flex-wrap gap-2 px-6 pt-5">
        {[
          { id: "register" as const, label: "Register Account", icon: "bi-person-plus-fill" },
          { id: "directory" as const, label: "Registered Directory", icon: "bi-people-fill" },
          { id: "verification" as const, label: "Verification Requests", icon: "bi-shield-check" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
            }`}
          >
            <i className={`bi ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "register" ? (
          /* ── REGISTER TAB ── */
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
              <p className="mb-4 text-sm font-bold text-[var(--color-heading)]">
                <i className="bi bi-person-plus-fill me-2 text-[var(--color-primary)]" />
                Add a new registered person
              </p>
              <div className="grid gap-3">
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((c) => ({ ...c, name: e.target.value.slice(0, 48) }))}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <input
                  value={createForm.email}
                  onChange={(e) => setCreateForm((c) => ({ ...c, email: e.target.value.slice(0, 60) }))}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((c) => ({
                        ...c,
                        role: e.target.value as Role,
                        password:
                          e.target.value === "admin" ? "Admin@123"
                          : e.target.value === "educator" ? "Educator@123"
                          : e.target.value === "parent" ? "Parent@123"
                          : "Student@123",
                      }))
                    }
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="student">Student</option>
                    <option value="educator">Faculty</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                  {createForm.role !== "parent" ? (
                    <input
                      value={createForm.program}
                      onChange={(e) => setCreateForm((c) => ({ ...c, program: e.target.value.slice(0, 60) }))}
                      placeholder="Program / responsibility"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  ) : null}
                </div>

                {createForm.role === "parent" ? (
                  <select
                    value={createForm.linkedStudentId}
                    onChange={(e) => setCreateForm((c) => ({ ...c, linkedStudentId: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">Select student to link...</option>
                    {studentOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
                    ))}
                  </select>
                ) : null}

                {createForm.role === "student" ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        value={createForm.parentName}
                        onChange={(e) => setCreateForm((c) => ({ ...c, parentName: e.target.value.slice(0, 60) }))}
                        placeholder="Parent name"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <input
                        value={createForm.parentEmail}
                        onChange={(e) => setCreateForm((c) => ({ ...c, parentEmail: e.target.value.slice(0, 60) }))}
                        placeholder="Parent email"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <input
                        value={createForm.parentMobile}
                        onChange={(e) => setCreateForm((c) => ({ ...c, parentMobile: e.target.value.slice(0, 15) }))}
                        placeholder="Parent mobile"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    {educatorOptions.length > 0 ? (
                      <div className="rounded-xl border border-[var(--color-border)] p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Assign Faculty Members
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {educatorOptions.map((edu) => (
                            <label
                              key={edu.id}
                              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                            >
                              <input
                                type="checkbox"
                                checked={createForm.assignedFacultyIds.includes(edu.id)}
                                onChange={(e) =>
                                  setCreateForm((c) => ({
                                    ...c,
                                    assignedFacultyIds: e.target.checked
                                      ? [...c.assignedFacultyIds, edu.id]
                                      : c.assignedFacultyIds.filter((id) => id !== edu.id),
                                  }))
                                }
                                className="h-4 w-4 text-[var(--color-primary)]"
                              />
                              {edu.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                <input
                  value={createForm.password}
                  onChange={(e) => setCreateForm((c) => ({ ...c, password: e.target.value.slice(0, 24) }))}
                  placeholder="Temporary password"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-panel)]">
                  <input
                    type="checkbox"
                    checked={createForm.confirm}
                    onChange={(e) => setCreateForm((c) => ({ ...c, confirm: e.target.checked }))}
                    className="h-4 w-4 text-[var(--color-primary)]"
                  />
                  Confirm and finalize this new entry
                </label>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                >
                  <i className="bi bi-person-plus-fill me-2" />
                  Register New Account
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Current Registered Mix
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Students", value: accountCounts.students, icon: "bi-mortarboard-fill", color: "#16A34A" },
                    { label: "Faculty", value: accountCounts.educators, icon: "bi-person-workspace", color: "#0284C7" },
                    { label: "Parents", value: accountCounts.parents, icon: "bi-people-fill", color: "#D97706" },
                    { label: "Admins", value: accountCounts.admins, icon: "bi-shield-fill-check", color: "#4F46E5" },
                    { label: "Counsellors", value: accountCounts.counsellors, icon: "bi-chat-dots-fill", color: "#7C3AED" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center"
                    >
                      <i className={`bi ${item.icon} text-xl`} style={{ color: item.color }} />
                      <p className="mt-1 text-2xl font-black text-[var(--color-heading)]">{item.value}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Creation Checklist
                </p>
                <div className="space-y-2">
                  {[
                    "Admin-only registration authority.",
                    "Mandatory confirmation before API commit.",
                    "Draft payload includes temporary credentials.",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "directory" ? (          
          <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Total", value: accountCounts.total, icon: "bi-people-fill", color: "var(--color-primary)" },
              { label: "Active", value: users.filter((u) => u.status === "active").length, icon: "bi-person-check-fill", color: "#10B981" },
              { label: "Faculty", value: accountCounts.educators, icon: "bi-person-workspace", color: "#0EA5E9" },
              { label: "Students", value: accountCounts.students, icon: "bi-mortarboard-fill", color: "#8B5CF6" },
              { label: "Pending", value: users.filter((u) => u.status === "pending").length, icon: "bi-hourglass-split", color: "#F59E0B" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${stat.color}15` }}
                  >
                    <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: 16 }} />
                  </div>
                  <div>
                    <div className="text-xl font-black text-[var(--color-heading)]">{stat.value}</div>
                    <div className="text-xs font-semibold text-[var(--color-muted)]">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="Search name, email, program…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={{ minWidth: 140 }}
            >
              <option value="all">All Roles ({accountCounts.total})</option>
              <option value="student">Students ({accountCounts.students})</option>
              <option value="educator">Faculty ({accountCounts.educators})</option>
              <option value="admin">Admins ({accountCounts.admins})</option>
              <option value="parent">Parents ({accountCounts.parents})</option>
              <option value="counsellor">Counsellors ({accountCounts.counsellors})</option>
            </select>
            {(roleFilter !== "all" || searchQuery) ? (
              <button
                onClick={() => { setRoleFilter("all"); setSearchQuery(""); }}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
              >
                Clear
              </button>
            ) : null}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Person
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Role
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] sm:table-cell">
                    Program
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Verified
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--color-muted)]">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const rc = getRoleColor(user.role);
                    const ss = getStatusStyle(user.status);
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-panel)]/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                              style={{ background: rc.color }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--color-heading)]">{user.name}</div>
                              <div className="text-xs text-[var(--color-muted)]">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                            style={{ background: rc.bg, color: rc.color }}
                          >
                            <i className={`bi ${getRoleIcon(user.role)}`} />
                            {user.role}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-[var(--color-heading)] sm:table-cell">
                          {user.program || "—"}
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                            style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ss.color }} />
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.verified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <i className="bi bi-patch-check-fill" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingUserId(isEditing(user.id) ? null : user.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                              title="Edit"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/10"
                              title="Delete"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editingUserId ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
              <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
                <div
                  className="flex-shrink-0 rounded-t-[1.5rem] px-6 py-4 text-white"
                  style={{
                    background: "linear-gradient(135deg,#1E1B4B,var(--color-primary),#6D28D9)",
                  }}
                >
                  <h3 className="text-lg font-black">
                    <i className="bi bi-pencil-square me-2" />
                    Edit Account
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {filteredUsers.filter((u) => u.id === editingUserId).map((user) => {
                    const d = drafts[user.id] ?? user;
                    return (
                      <div key={user.id} className="grid gap-3">
                        <input
                          value={d.name}
                          onChange={(e) =>
                            setDrafts((c) => ({ ...c, [user.id]: { ...d, name: e.target.value.slice(0, 48) } }))
                          }
                          placeholder="Full name"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <input
                          value={d.email}
                          onChange={(e) =>
                            setDrafts((c) => ({ ...c, [user.id]: { ...d, email: e.target.value.slice(0, 60) } }))
                          }
                          placeholder="Email"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={d.role}
                            onChange={(e) =>
                              setDrafts((c) => ({ ...c, [user.id]: { ...d, role: e.target.value as Role } }))
                            }
                            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          >
                            <option value="student">Student</option>
                            <option value="educator">Faculty</option>
                            <option value="counsellor">Counsellor</option>
                            <option value="parent">Parent</option>
                            <option value="admin">Admin</option>
                          </select>
                          <input
                            value={d.program}
                            onChange={(e) =>
                              setDrafts((c) => ({ ...c, [user.id]: { ...d, program: e.target.value.slice(0, 60) } }))
                            }
                            placeholder="Program"
                            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={d.status}
                            onChange={(e) =>
                              setDrafts((c) => ({ ...c, [user.id]: { ...d, status: e.target.value as any } }))
                            }
                            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <input
                            value={d.passwordHint ?? ""}
                            onChange={(e) =>
                              setDrafts((c) => ({ ...c, [user.id]: { ...d, passwordHint: e.target.value.slice(0, 24) } }))
                            }
                            placeholder="Password"
                            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--color-heading)]">
                          <input
                            type="checkbox"
                            checked={d.verified ?? false}
                            onChange={(e) =>
                              setDrafts((c) => ({ ...c, [user.id]: { ...d, verified: e.target.checked } }))
                            }
                            className="h-5 w-5 text-[var(--color-primary)]"
                          />
                          Verified Badge
                        </label>
                        {d.role === "student" && educatorOptions.length > 0 ? (
                          <div className="rounded-xl border border-[var(--color-border)] p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                              Assign Faculty Members
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {educatorOptions.map((edu) => (
                                <label
                                  key={edu.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={(d.assignedFacultyIds ?? []).includes(edu.id)}
                                    onChange={(e) =>
                                      setDrafts((c) => ({
                                        ...c,
                                        [user.id]: {
                                          ...d,
                                          assignedFacultyIds: e.target.checked
                                            ? [...(d.assignedFacultyIds ?? []), edu.id]
                                            : (d.assignedFacultyIds ?? []).filter((id) => id !== edu.id),
                                        },
                                      }))
                                    }
                                    className="h-4 w-4 text-[var(--color-primary)]"
                                  />
                                  {edu.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="flex-shrink-0 border-t border-[var(--color-border)] px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => editingUserId && handleSave(editingUserId)}
                      className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
                    >
                      <i className="bi bi-check-circle-fill me-2" />
                      Update Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          </>
        ) : (
          /* ── VERIFICATION TAB ── */
          <div>
            <p className="mb-4 text-sm font-bold text-[var(--color-heading)]">
              <i className="bi bi-shield-check me-2 text-[var(--color-primary)]" />
              Pending Approval Requests
            </p>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/10"
                  >
                    <div>
                      <p className="font-bold text-[var(--color-heading)]">{req.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{req.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          <i className="bi bi-person-badge" />
                          {req.role}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
                          <i className="bi bi-book" />
                          {req.program}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/admin/user-requests/approve", {
                            method: "POST",
                            credentials: "same-origin",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: req.id }),
                          });
                          const data = await res.json();
                          if (data.ok) {
                            setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
                            setStatus(`Approved: ${req.name}`);
                          } else {
                            setStatus(data.error ?? "Failed to approve.");
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <i className="bi bi-check-lg" />
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/admin/user-requests/reject", {
                            method: "POST",
                            credentials: "same-origin",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: req.id }),
                          });
                          const data = await res.json();
                          if (data.ok) {
                            setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
                            setStatus(`Rejected: ${req.name}`);
                          } else {
                            setStatus(data.error ?? "Failed to reject.");
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                      >
                        <i className="bi bi-x-lg" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
