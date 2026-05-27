"use client";

import { useMemo, useState } from "react";

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
};

export function DashboardAccountDirectory({
  initialUsers,
}: DashboardAccountDirectoryProps) {
  const [users, setUsers] = useState(initialUsers);
  const [sortBy, setSortBy] = useState<"name" | "role">("name");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ManagedUser>>({});
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "directory">("register");
  const [createForm, setCreateForm] = useState<CreateAccountForm>({
    name: "",
    email: "",
    role: "student",
    program: "",
    password: "Student@123",
    confirm: false,
  });

  const accountCounts = useMemo(
    () => ({
      students: users.filter((item) => item.role === "student").length,
      educators: users.filter((item) => item.role === "educator").length,
      admins: users.filter((item) => item.role === "admin").length,
      parents: users.filter((item) => item.role === "parent").length,
    }),
    [users],
  );

  const sortedUsers = useMemo(() => {
    const roleOrder: Record<Role, number> = {
      admin: 0,
      educator: 1,
      student: 2,
      parent: 3,
    };

    return [...users].sort((left, right) => {
      if (sortBy === "role") {
        const roleDifference = roleOrder[left.role] - roleOrder[right.role];

        if (roleDifference !== 0) {
          return roleDifference;
        }
      }

      return left.name.localeCompare(right.name);
    });
  }, [sortBy, users]);

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
    });
    setActiveTab("directory");
    setStatus("New registered account draft created.");
  }

  async function handleSave(userId: string) {
    const draft = drafts[userId];

    if (!draft) {
      return;
    }

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
      }),
    });

    const payload = (await response.json()) as { user?: ManagedUser; error?: string };

    if (!response.ok || !payload.user) {
      setStatus(payload.error ?? "Account update could not be prepared.");
      return;
    }

    setUsers((current) => current.map((item) => (item.id === userId ? { ...item, ...payload.user } : item)));
    setEditingUserId(null);
    setStatus("Editable account draft prepared.");
  }

  return (
    <section className="surface max-w-full overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Account Control</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Register and manage people
          </h2>
        </div>
        <span className="pill">{users.length} accounts</span>
      </div>

      {status ? <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">{status}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`btn-md font-bold ${
            activeTab === "register"
              ? "btn-action"
              : "btn-surface"
          }`}
        >
          Register Account
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`btn-md font-bold ${
            activeTab === "directory"
              ? "btn-action"
              : "btn-surface"
          }`}
        >
          Registered Directory
        </button>
      </div>

      {activeTab === "register" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-soft rounded-[1.75rem] p-5">
            <p className="text-sm font-semibold text-[var(--color-heading)]">
              Add a new registered person
            </p>
            <div className="mt-4 grid gap-3">
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value.slice(0, 48) }))
                }
                placeholder="Full name"
                className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
              />
              <input
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, email: event.target.value.slice(0, 60) }))
                }
                placeholder="Email address"
                className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      role: event.target.value as Role,
                      password:
                        event.target.value === "admin"
                          ? "Admin@123"
                          : event.target.value === "educator"
                            ? "Educator@123"
                            : event.target.value === "parent"
                              ? "Parent@123"
                              : "Student@123",
                    }))
                  }
                  className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                >
                  <option value="student">Student</option>
                  <option value="educator">Faculty</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  value={createForm.program}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, program: event.target.value.slice(0, 60) }))
                  }
                  placeholder="Program / responsibility"
                  className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
              <input
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, password: event.target.value.slice(0, 24) }))
                }
                placeholder="Temporary password"
                className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
              />
              <label className="surface rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-transparent hover:border-blue-200 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.confirm}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, confirm: event.target.checked }))
                  }
                  className="mr-3"
                />
                Confirm and finalize this new entry
              </label>
              <button type="button" onClick={handleCreate} className="btn-action btn-md w-full font-bold">
                Register New Account
              </button>
              </div>
              </div>

              <div className="grid gap-4">
              <div className="surface-soft rounded-[1.75rem] p-5 border border-blue-100/50">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Current Registered Mix</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="surface rounded-2xl p-4 text-center border border-[var(--color-border)]">
                  <p className="text-2xl font-bold text-[var(--color-heading)]">{accountCounts.students}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Students</p>
                </div>
                <div className="surface rounded-2xl p-4 text-center border border-[var(--color-border)]">
                  <p className="text-2xl font-bold text-[var(--color-heading)]">{accountCounts.educators}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Faculty</p>
                </div>
                <div className="surface rounded-2xl p-4 text-center border border-[var(--color-border)]">
                  <p className="text-2xl font-bold text-[var(--color-heading)]">{accountCounts.parents}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Parents</p>
                </div>
                <div className="surface rounded-2xl p-4 text-center border border-[var(--color-border)]">
                  <p className="text-2xl font-bold text-[var(--color-heading)]">{accountCounts.admins}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Admins</p>
                </div>
              </div>
              </div>

              <div className="surface-soft rounded-[1.75rem] p-5 border border-[var(--color-border)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Creation Checklist</p>
              <div className="grid gap-2">
                {[
                  "Admin-only registration authority.",
                  "Mandatory confirmation before API commit.",
                  "Draft payload includes temporary credentials."
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </div>
                ))}
              </div>
              </div>
              </div>
              </div>
              ) : (
              <div className="mt-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[var(--color-heading)]">
              Directory sorted by <span className="text-blue-600 uppercase text-xs font-bold tracking-wider">{sortBy === "role" ? "role" : "name"}</span>.
              </p>
              <label className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2 text-sm font-bold text-[var(--color-heading)] shadow-sm">
              <span>Sort By</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "name" | "role")}
                className="bg-transparent text-sm font-bold text-blue-600 outline-none cursor-pointer"
              >
                <option value="name">Full Name</option>
                <option value="role">Academy Role</option>
              </select>
              </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
              {sortedUsers.map((user) => {
              const currentDraft = drafts[user.id] ?? user;
              const isEditing = editingUserId === user.id;

              return (
              <div key={user.id} className="surface-soft rounded-[1.75rem] p-5 border border-transparent hover:border-blue-100 transition-all">
                {isEditing ? (
                  <div className="grid gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Editing Account</p>
                    <input
                      value={currentDraft.name}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [user.id]: { ...currentDraft, name: event.target.value.slice(0, 48) },
                        }))
                      }
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-blue-400"
                      placeholder="Full name"
                    />
                    <input
                      value={currentDraft.email}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [user.id]: { ...currentDraft, email: event.target.value.slice(0, 60) },
                        }))
                      }
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-blue-400"
                      placeholder="Email address"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={currentDraft.role}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.id]: { ...currentDraft, role: event.target.value as Role },
                          }))
                        }
                        className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-blue-400"
                      >
                        <option value="student">Student</option>
                        <option value="educator">Faculty</option>
                        <option value="parent">Parent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <input
                        value={currentDraft.program}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.id]: { ...currentDraft, program: event.target.value.slice(0, 60) },
                          }))
                        }
                        className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-blue-400"
                        placeholder="Program"
                      />
                    </div>
                    <input
                      value={currentDraft.passwordHint ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [user.id]: { ...currentDraft, passwordHint: event.target.value.slice(0, 24) },
                        }))
                      }
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-blue-400"
                      placeholder="Password"
                    />
                    <div className="flex flex-wrap gap-3 mt-2">
                      <button type="button" onClick={() => handleSave(user.id)} className="btn-action btn-sm">
                        Update Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="btn-surface btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-[var(--color-heading)]" title={user.name}>
                          {user.name}
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-[var(--color-muted)]" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                      <span className="pill bg-blue-50 text-blue-700 border-blue-100">{user.role}</span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider w-16">Program</span>
                        <span className="font-semibold text-[var(--color-heading)]">{user.program}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider w-16">Status</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-100 uppercase">
                          <span className="h-1 w-1 rounded-full bg-green-500" />
                          {user.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider w-16">Secret</span>
                        <code className="bg-white px-2 py-0.5 rounded border border-[var(--color-border)] text-xs font-mono text-blue-600">
                          {user.passwordHint ?? "••••••••"}
                        </code>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(user.id);
                        setDrafts((current) => ({ ...current, [user.id]: user }));
                      }}
                      className="btn-action btn-sm mt-6 w-full sm:w-auto"
                    >
                      Edit User Profile
                    </button>
                  </div>
                )}
              </div>
              );
              })}
              </div>
              </div>
              )}    </section>
  );
}
