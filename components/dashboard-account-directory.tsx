"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Enquiry, ManagedUser, Role } from "@/lib/types";

type DashboardAccountDirectoryProps = {
  initialUsers: ManagedUser[];
  onUsersChange?: (users: ManagedUser[]) => void;
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
  designation: string;
  department: string;
  branch: string;
  employmentType: string;
  joiningDate: string;
};

export function DashboardAccountDirectory({
  initialUsers,
  onUsersChange,
}: DashboardAccountDirectoryProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ManagedUser>>({});
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<
    "register" | "directory" | "verification" | null
  >(null);
  const [pendingRequests, setPendingRequests] = useState<ManagedUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
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
    designation: "",
    department: "",
    branch: "",
    employmentType: "full_time",
    joiningDate: "",
  });

  const [mainTab, setMainTab] = useState<
    "students" | "staff" | "parents" | "other"
  >("students");

  const [employeeSubTab, setEmployeeSubTab] = useState<
    "faculty" | "staff"
  >("faculty");

  const accountCounts = useMemo(
    () => ({
      students: users.filter((item) => item.role === "student").length,
      educators: users.filter((item) => item.role === "educator").length,
      staff: users.filter((item) => item.role === "staff").length,
      admins: users.filter((item) => item.role === "admin").length,
      parents: users.filter((item) => item.role === "parent").length,
      counsellors: users.filter((item) => item.role === "counsellor").length,
      total: users.length,
    }),
    [users],
  );

  const studentOptions = useMemo(
    () =>
      users
        .filter((item) => item.role === "student")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const educatorOptions = useMemo(
    () =>
      users
        .filter((item) => item.role === "educator")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const sortedUsers = useMemo(() => {
    const roleOrder: Record<Role, number> = {
      admin: 0,
      counsellor: 1,
      educator: 2,
      staff: 3,
      student: 4,
      parent: 5,
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

  const tabStudents = useMemo(() => {
    let list = users.filter((u) => u.role === "student");
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
  }, [users, searchQuery]);

  const tabEducators = useMemo(() => {
    let list = users.filter((u) => u.role === "educator");
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
list = list.filter(
  (u) =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.program.toLowerCase().includes(q) ||
    (u.employeeCode ?? u.facultyCode)?.toLowerCase().includes(q),
);
    }
    return list;
  }, [users, searchQuery]);


  const tabStaff = useMemo(() => {
    let list = users.filter((u) => u.role === "staff");

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();

      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.program.toLowerCase().includes(q) ||
          (u.employeeCode ?? u.facultyCode)
            ?.toLowerCase()
            .includes(q) ||
          u.profile?.designation
            ?.toLowerCase()
            .includes(q) ||
          u.profile?.department
            ?.toLowerCase()
            .includes(q) ||
          u.profile?.branch
            ?.toLowerCase()
            .includes(q),
      );
    }

    return list;
  }, [users, searchQuery]);
  const tabParents = useMemo(() => {
    let list = users.filter((u) => u.role === "parent");
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
  }, [users, searchQuery]);

  const tabOther = useMemo(() => {
    let list = users.filter(
      (u) =>
        u.role !== "student" &&
        u.role !== "educator" &&
        u.role !== "staff" &&
        u.role !== "parent",
    );
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
  }, [users, searchQuery]);

  useEffect(() => {
    if (activeTab !== "verification") return;
    fetch("/api/admin/user-requests", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.requests))
          setPendingRequests(data.requests);
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
    const payload = (await response.json()) as {
      user?: ManagedUser;
      error?: string;
    };
    if (!response.ok || !payload.user) {
      setStatus(payload.error ?? "New account could not be created.");
      return;
    }
    const updatedUsers = [payload.user as ManagedUser, ...users];
    setUsers(updatedUsers);
    onUsersChange?.(updatedUsers);
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
    designation: "",
    department: "",
    branch: "",
    employmentType: "full_time",
    joiningDate: "",
    });
    setActiveTab(null);
    setMainTab("students");
    setStatus("New registered account draft created.");
  }

  async function handleSave(userId: string) {
    const draft = drafts[userId];
    if (!draft) return;
    const payloadData: Record<string, unknown> = {
      id: draft.id,
      name: draft.name,
      email: draft.email,
      role: draft.role,
      program: draft.program,
      status: draft.status,
      verified: draft.verified,
      assignedFacultyIds: draft.assignedFacultyIds ?? null,
    };
    if (draft.passwordHint && draft.passwordHint.trim()) {
      payloadData.password = draft.passwordHint;
    }
    if (draft.profilePhoto !== undefined) {
      payloadData.profilePhoto = draft.profilePhoto;
    }
    if (draft.profile?.chatDisabled !== undefined) {
      payloadData.profile = { chatDisabled: draft.profile.chatDisabled };
    }
    const response = await fetch("/api/users", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadData),
    });
    const payload = (await response.json()) as {
      user?: ManagedUser;
      error?: string;
    };
    if (!response.ok || !payload.user) {
      setStatus(payload.error ?? "Account update could not be prepared.");
      return;
    }
    const updatedUsers = (prev: ManagedUser[]) =>
      prev.map((item) =>
        item.id === userId ? { ...item, ...payload.user } : item,
      );
    setUsers(updatedUsers);
    onUsersChange?.(updatedUsers(users));
    setEditingUserId(null);
    setStatus("Editable account draft prepared.");
  }

  async function handleDelete(userId: string) {
    if (
      !confirm("Delete this account permanently? This action cannot be undone.")
    )
      return;
    setDeletingId(userId);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, mode: "delete" }),
      });
      if (res.ok) {
        const updatedUsers = users.filter((u) => u.id !== userId);
        setUsers(updatedUsers);
        onUsersChange?.(updatedUsers);
        setStatus("Account deleted.");
      } else {
        const data = await res.json();
        setStatus(data.error ?? "Delete failed.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const statusStyles: Record<
    string,
    { bg: string; color: string; border: string }
  > = {
    active: { bg: "#DCFCE7", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
    rejected: { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  };

  function getStatusStyle(status: string) {
    return (
      statusStyles[status] ?? {
        bg: "#F1F5F9",
        color: "#64748B",
        border: "#E2E8F0",
      }
    );
  }

  function getRoleIcon(role: Role) {
    switch (role) {
      case "admin":
        return "bi-shield-fill-check";
      case "educator":
        return "bi-person-workspace";
      case "staff":
        return "bi-person-badge-fill";
      case "student":
        return "bi-mortarboard-fill";
      case "parent":
        return "bi-people-fill";
      case "counsellor":
        return "bi-chat-dots-fill";
      default:
        return "bi-person-fill";
    }
  }
function getRoleColor(role: Role): { bg: string; color: string } {
    switch (role) {
      case "admin":
        return { bg: "#EEF2FF", color: "#4F46E5" };
      case "educator":
        return { bg: "#F0F9FF", color: "#0284C7" };
      case "staff":
        return { bg: "#F8FAFC", color: "#475569" };
      case "student":
        return { bg: "#F0FDF4", color: "#16A34A" };
      case "parent":
        return { bg: "#FFF7ED", color: "#D97706" };
      case "counsellor":
        return { bg: "#F5F3FF", color: "#7C3AED" };
      default:
        return { bg: "#F1F5F9", color: "#64748B" };
    }
  }
const isEditing = (userId: string) => editingUserId === userId;

  const renderUserGrid = (userList: ManagedUser[]) =>
    userList.length === 0 ? (
      <div className="rounded-xl border border-[var(--color-border)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
        No accounts found.
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {userList.map((user) => {
          const rc = getRoleColor(user.role);
          const ss = getStatusStyle(user.status);
          const p = user.profile;
          return (
            <div
              key={user.id}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="h-2" style={{ background: rc.color }} />
              <div className="p-5 pb-3">
                <div className="flex items-start gap-4">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white shadow-sm"
                      style={{ background: rc.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-[var(--color-heading)] truncate">
                      {user.name}
                    </p>
  <p className="text-[10px] font-mono font-semibold text-[var(--color-muted)] mt-0.5">
  {user.role === "educator" || user.role === "staff"
                        ? `Employee ID: ${
                            user.employeeCode ??
                            user.facultyCode ??
                            "Not assigned"
                          }`
                        : `ID: ${user.id.slice(0, 8).toUpperCase()}`}
</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: rc.bg, color: rc.color }}
                      >
                        <i className={`bi ${getRoleIcon(user.role)}`} />
                        {user.role === "educator"
                          ? "Faculty"
                          : user.role === "staff"
                            ? "Staff"
                            : user.role === "counsellor"
                              ? "Counsellor"
                              : user.role === "admin"
                                ? "Admin"
                                : user.role === "parent"
                                  ? "Parent"
                                  : "Student"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{
                          background: ss.bg,
                          color: ss.color,
                          border: `1px solid ${ss.border}`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: ss.color }}
                        />
                        {user.status}
                      </span>
                      {user.verified ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                          <i className="bi bi-patch-check-fill" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-500">
                          <i className="bi bi-exclamation-triangle-fill" />
                          Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] px-5 py-3">
                <div className="grid gap-1.5 text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-muted)]">
                    <i className="bi bi-envelope w-3.5" />
                    <span className="truncate text-[var(--color-body)]">
                      {user.email}
                    </span>
                  </div>
                  {user.mobile && (
                    <div className="flex items-center gap-2 text-[var(--color-muted)]">
                      <i className="bi bi-telephone w-3.5" />
                      <span className="text-[var(--color-body)]">
                        {user.mobile}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] px-5 py-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {user.program ? (
                    <div className="col-span-2">
                      <span className="font-semibold text-[var(--color-muted)]">
                        Program
                      </span>
                      <p className="text-[var(--color-heading)] font-medium">
                        {user.program}
                      </p>
                    </div>
                  ) : null}
                  {user.role === "staff" ? (
                    <>
                      {(p?.designation ||
                        p?.department ||
                        p?.branch ||
                        p?.employmentType ||
                        p?.joiningDate) && (
                        <div className="col-span-2 rounded-lg bg-[var(--color-panel)] p-3">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                            Staff Details
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            {p?.designation ? (
                              <div>
                                <span className="font-semibold text-[var(--color-muted)]">
                                  Designation
                                </span>
                                <p className="text-[var(--color-heading)]">
                                  {p.designation}
                                </p>
                              </div>
                            ) : null}

                            {p?.department ? (
                              <div>
                                <span className="font-semibold text-[var(--color-muted)]">
                                  Department
                                </span>
                                <p className="text-[var(--color-heading)]">
                                  {p.department}
                                </p>
                              </div>
                            ) : null}

                            {p?.branch ? (
                              <div>
                                <span className="font-semibold text-[var(--color-muted)]">
                                  Branch
                                </span>
                                <p className="text-[var(--color-heading)]">
                                  {p.branch}
                                </p>
                              </div>
                            ) : null}

                            {p?.employmentType ? (
                              <div>
                                <span className="font-semibold text-[var(--color-muted)]">
                                  Employment
                                </span>
                                <p className="text-[var(--color-heading)]">
                                  {p.employmentType
                                    .replaceAll("_", " ")
                                    .replace(/\b\w/g, (c) =>
                                      c.toUpperCase(),
                                    )}
                                </p>
                              </div>
                            ) : null}

                            {p?.joiningDate ? (
                              <div className="col-span-2">
                                <span className="font-semibold text-[var(--color-muted)]">
                                  Joining Date
                                </span>
                                <p className="text-[var(--color-heading)]">
                                  {p.joiningDate}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                  {p?.dob && (
                    <div>
                      <span className="font-semibold text-[var(--color-muted)]">
                        DOB
                      </span>
                      <p className="text-[var(--color-heading)]">{p.dob}</p>
                    </div>
                  )}
                  {p?.gender && (
                    <div>
                      <span className="font-semibold text-[var(--color-muted)]">
                        Gender
                      </span>
                      <p className="text-[var(--color-heading)]">{p.gender}</p>
                    </div>
                  )}
                  {(p?.addressLine1 || p?.city || p?.state) && (
                    <div className="col-span-2">
                      <span className="font-semibold text-[var(--color-muted)]">
                        Address
                      </span>
                      <p className="text-[var(--color-heading)]">
                        {[p.addressLine1, p.addressLine2]
                          .filter(Boolean)
                          .join(", ")}
                        {p.city ? `, ${p.city}` : ""}
                        {p.state ? `, ${p.state}` : ""}
                        {p.pincode ? ` - ${p.pincode}` : ""}
                      </p>
                    </div>
                  )}
                  {user.role === "student" && (
                    <>
                      {p?.parentName && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Parent
                          </span>
                          <p className="text-[var(--color-heading)]">
                            {p.parentName}
                          </p>
                          {p.parentMobile && (
                            <p className="text-[var(--color-body)]">
                              {p.parentMobile}
                            </p>
                          )}
                          {p.parentEmail && (
                            <p className="text-[var(--color-body)] truncate">
                              {p.parentEmail}
                            </p>
                          )}
                        </div>
                      )}
                      {p?.courseWantedTitle && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Course
                          </span>
                          <p className="text-[var(--color-heading)]">
                            {p.courseWantedTitle}
                          </p>
                        </div>
                      )}
                      {p?.studentType && (
                        <div>
                          <span className="font-semibold text-[var(--color-muted)]">
                            Type
                          </span>
                          <p className="text-[var(--color-heading)]">
                            {p.studentType}
                          </p>
                        </div>
                      )}
                      {p?.latestQualification && (
                        <div>
                          <span className="font-semibold text-[var(--color-muted)]">
                            Qualification
                          </span>
                          <p className="text-[var(--color-heading)]">
                            {p.latestQualification}
                            {p.latestAcademicScore
                              ? ` - ${p.latestAcademicScore}`
                              : ""}
                          </p>
                        </div>
                      )}
                      {(p?.weakSubjects?.length ?? 0) > 0 && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Weak Subjects
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p!.weakSubjects!.map((s, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(p?.strongSubjects?.length ?? 0) > 0 && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Strong Subjects
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p!.strongSubjects!.map((s, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {user.role === "educator" && (
                    <>
                      {p?.qualification && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Qualification
                          </span>
                          <p className="text-[var(--color-heading)]">
                            {p.qualification}
                          </p>
                        </div>
                      )}
                      {p?.experience && (
                        <div>
                          <span className="font-semibold text-[var(--color-muted)]">
                            Experience
                          </span>
                          <p className="text-[var(--color-heading)]">
                            {p.experience}
                          </p>
                        </div>
                      )}
                      {(p?.subjects?.length ?? 0) > 0 && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Subjects
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p!.subjects!.map((s, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {p?.cvUrl && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Resume / CV
                          </span>
                          <div className="mt-1">
                            <a
                              href={p.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <i className="bi bi-file-earmark-text" />
                              View Resume
                            </a>
                          </div>
                        </div>
                      )}
                      {(p?.examQualifications?.length ?? 0) > 0 && (
                        <div className="col-span-2">
                          <span className="font-semibold text-[var(--color-muted)]">
                            Exam Qualifications
                          </span>
                          <div className="mt-0.5 space-y-1">
                            {p!.examQualifications!.map((eq, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5 text-[11px]"
                              >
                                <span className="font-semibold text-[var(--color-heading)]">
                                  {eq.examName}
                                </span>
                                {eq.score && (
                                  <span className="ml-2 text-[var(--color-body)]">
                                    Score: {eq.score}
                                  </span>
                                )}
                                {eq.year && (
                                  <span className="ml-2 text-[var(--color-muted)]">
                                    ({eq.year})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] px-5 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditingUserId(isEditing(user.id) ? null : user.id)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)] transition-colors"
                  >
                    <i className="bi bi-pencil" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-400/30 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <i className="bi bi-trash" />
                    {deletingId === user.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

  const editModal = editingUserId ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-white shadow-2xl">
        <div
          className="flex-shrink-0 rounded-t-[1.5rem] px-6 py-4 text-white"
          style={{
            background:
              "linear-gradient(135deg,#1E1B4B,var(--color-primary),#6D28D9)",
          }}
        >
          <h3 className="text-lg font-black">
            <i className="bi bi-pencil-square me-2" />
            Edit Account
          </h3>
          {users.find((u) => u.id === editingUserId) && (
            <p className="mt-0.5 text-sm text-white/70">
              {users.find((u) => u.id === editingUserId)!.name}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {users
            .filter((u) => u.id === editingUserId)
            .map((user) => {
              const d = drafts[user.id] ?? user;
              async function handlePhotoUpload(
                e: React.ChangeEvent<HTMLInputElement>,
              ) {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingPhoto(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("field", "photo");
                  const res = await fetch("/api/upload/signup", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.success) {
                    setDrafts((c) => ({
                      ...c,
                      [user.id]: { ...d, profilePhoto: data.url },
                    }));
                  }
                } catch {
                  // ignore
                } finally {
                  setUploadingPhoto(false);
                }
              }
              return (
                <div key={user.id} className="grid gap-3">
                  <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                    {d.profilePhoto || user.profilePhoto ? (
                      <img
                        src={d.profilePhoto || user.profilePhoto}
                        alt={user.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
                        style={{ background: getRoleColor(user.role).color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[var(--color-heading)]">
                        {user.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {user.email}
                      </p>
                      {user.mobile && (
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                          <i className="bi bi-telephone me-1" />
                          {user.mobile}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                      >
                        <i className="bi bi-camera" />
                        {uploadingPhoto ? "Uploading..." : "Change Photo"}
                      </button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  </div>
                  <input
                    value={d.name}
                    onChange={(e) =>
                      setDrafts((c) => ({
                        ...c,
                        [user.id]: { ...d, name: e.target.value.slice(0, 48) },
                      }))
                    }
                    placeholder="e.g. Supriya"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />

                  <input
                    value={d.email}
                    onChange={(e) =>
                      setDrafts((c) => ({
                        ...c,
                        [user.id]: { ...d, email: e.target.value.slice(0, 60) },
                      }))
                    }
                    placeholder="Email"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={d.role}
                      onChange={(e) =>
                        setDrafts((c) => ({
                          ...c,
                          [user.id]: { ...d, role: e.target.value as Role },
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="student">Student</option>
                      <option value="educator">Faculty</option>
                      <option value="staff">Staff</option>
                      <option value="counsellor">Counsellor</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input
                      value={d.program}
                      onChange={(e) =>
                        setDrafts((c) => ({
                          ...c,
                          [user.id]: {
                            ...d,
                            program: e.target.value.slice(0, 60),
                          },
                        }))
                      }
                      placeholder="Program"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={d.status}
                      onChange={(e) =>
                        setDrafts((c) => ({
                          ...c,
                          [user.id]: { ...d, status: e.target.value as any },
                        }))
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
                        setDrafts((c) => ({
                          ...c,
                          [user.id]: {
                            ...d,
                            passwordHint: e.target.value.slice(0, 24),
                          },
                        }))
                      }
                      placeholder="New Password (blank = keep current)"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--color-heading)]">
                    <input
                      type="checkbox"
                      checked={d.verified ?? false}
                      onChange={(e) =>
                        setDrafts((c) => ({
                          ...c,
                          [user.id]: { ...d, verified: e.target.checked },
                        }))
                      }
                      className="h-5 w-5 text-[var(--color-primary)]"
                    />
                    Verified Badge
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--color-heading)]">
                    <input
                      type="checkbox"
                      checked={d.profile?.chatDisabled ?? false}
                      onChange={(e) =>
                        setDrafts((c) => ({
                          ...c,
                          [user.id]: {
                            ...d,
                            profile: {
                              ...(d.profile || {}),
                              chatDisabled: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="h-5 w-5 text-[var(--color-primary)]"
                    />
                    Disable Chat
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
                              checked={(d.assignedFacultyIds ?? []).includes(
                                edu.id,
                              )}
                              onChange={(e) =>
                                setDrafts((c) => ({
                                  ...c,
                                  [user.id]: {
                                    ...d,
                                    assignedFacultyIds: e.target.checked
                                      ? [
                                          ...(d.assignedFacultyIds ?? []),
                                          edu.id,
                                        ]
                                      : (d.assignedFacultyIds ?? []).filter(
                                          (id) => id !== edu.id,
                                        ),
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
  ) : null;

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* â”€â”€ Clean CoachSutra-style Header â”€â”€ */}
      <div
        style={{
          padding: "24px 28px 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              color: "#1A2035",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Accounts
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>
            Manage all registered users across the institute
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "#4F46E5",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <i className="bi bi-people-fill" />
          {accountCounts.total} accounts
        </span>
      </div>

      {status ? (
        <div className="mx-6 mt-4 rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-[var(--color-border)]">
          {status}
        </div>
      ) : null}

      {/* â”€â”€ Main Tab Bar (CoachSutra-style) â”€â”€ */}
      <div className="flex flex-wrap gap-2 px-6 pt-5">
        {[
          {
            id: "students" as const,
            label: "Students",
            count: accountCounts.students,
          },
          {
            id: "staff" as const,
            label: "Staff",
            count: accountCounts.educators + accountCounts.staff,
          },
          {
            id: "parents" as const,
            label: "Parents",
            count: accountCounts.parents,
          },
          {
            id: "other" as const,
            label: "Other Accounts",
            count: users.filter(
              (u) =>
                u.role !== "student" &&
                u.role !== "educator" &&
                u.role !== "parent",
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setMainTab(tab.id);
              setActiveTab(null);
              setSearchQuery("");
              setRoleFilter("all");
            }}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: mainTab === tab.id ? "#4F46E5" : "#F1F5F9",
              color: mainTab === tab.id ? "#fff" : "#1A2035",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* â”€â”€ Secondary Tab Pills (Register / Directory / Verification) â”€â”€ */}
      <div className="flex flex-wrap gap-1.5 px-6 pt-3">
        {[
          {
            id: "register" as const,
            label: "Register Account",
            icon: "bi-person-plus-fill",
          },
          {
            id: "directory" as const,
            label: "Directory",
            icon: "bi-people-fill",
          },
          {
            id: "verification" as const,
            label: "Verification Requests",
            icon: "bi-shield-check",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
              activeTab === tab.id
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
            }`}
          >
            <i className={`bi ${tab.icon} text-[10px]`} />
            {tab.label}
          </button>
        ))}
        {activeTab !== null ? (
          <button
            onClick={() => setActiveTab(null)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-heading)]"
          >
            <i className="bi bi-arrow-left" />
            Back
          </button>
        ) : null}
      </div>

      <div className="p-6">
        {activeTab !== null ? (
          activeTab === "register" ? (
            /* â”€â”€ REGISTER TAB (preserved) â”€â”€ */
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                <p className="mb-4 text-sm font-bold text-[var(--color-heading)]">
                  <i className="bi bi-person-plus-fill me-2 text-[var(--color-primary)]" />
                  Add a new registered person
                </p>
                <div className="grid gap-3">

                  {mainTab === "staff" ? (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                        Employee Type
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEmployeeSubTab("faculty");

                            setCreateForm((c) => ({
                              ...c,
                              role: "educator",
                              program: "Faculty",
                              password: "Educator@123",
                              confirm: false,
                            }));
                          }}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            createForm.role === "educator"
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                              : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <i className="bi bi-person-workspace" />
                            <span className="font-bold">
                              Faculty
                            </span>
                          </div>

                          <p
                            className={`mt-1 text-xs ${
                              createForm.role === "educator"
                                ? "text-white/75"
                                : "text-[var(--color-muted)]"
                            }`}
                          >
                            Teaching employee
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEmployeeSubTab("staff");

                            setCreateForm((c) => ({
                              ...c,
                              role: "staff",
                              program: "Staff",
                              password: "Staff@123",
                              designation: "",
                              department: "",
                              branch: "",
                              employmentType: "full_time",
                              joiningDate: "",
                              confirm: false,
                            }));
                          }}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            createForm.role === "staff"
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                              : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <i className="bi bi-person-badge-fill" />
                            <span className="font-bold">
                              Staff
                            </span>
                          </div>

                          <p
                            className={`mt-1 text-xs ${
                              createForm.role === "staff"
                                ? "text-white/75"
                                : "text-[var(--color-muted)]"
                            }`}
                          >
                            Non-teaching employee
                          </p>
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <input
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((c) => ({
                        ...c,
                        name: e.target.value.slice(0, 48),
                      }))
                    }
                    placeholder="e.g. Tanish"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <input
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((c) => ({
                        ...c,
                        email: e.target.value.slice(0, 60),
                      }))
                    }
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
                            e.target.value === "admin"
                              ? "Admin@123"
                              : e.target.value === "educator"
                                ? "Educator@123"
                                : e.target.value === "staff"
                                  ? "Staff@123"
                                  : e.target.value === "parent"
                                  ? "Parent@123"
                                  : "Student@123",
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="student">Student</option>
                      <option value="educator">Faculty</option>
                      <option value="staff">Staff</option>
                      <option value="counsellor">Counsellor</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </select>
                    {createForm.role !== "parent" ? (
                      <input
                        value={createForm.program}
                        onChange={(e) =>
                          setCreateForm((c) => ({
                            ...c,
                            program: e.target.value.slice(0, 60),
                          }))
                        }
                        placeholder="Program / responsibility"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    ) : null}
                  </div>

                  {createForm.role === "staff" ? (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                        Staff Employment Details
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          value={createForm.designation}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              designation: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        >
                          <option value="">Select designation</option>
                          <option value="Receptionist">Receptionist</option>
                          <option value="Office Admin">Office Admin</option>
                          <option value="Branch Manager">Branch Manager</option>
                          <option value="Accountant">Accountant</option>
                          <option value="HR">HR</option>
                          <option value="Counsellor">Counsellor</option>
                          <option value="Operations">Operations</option>
                          <option value="Support">Support</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Sales">Sales</option>
                          <option value="IT Support">IT Support</option>
                          <option value="Other">Other</option>
                        </select>

                        <input
                          value={createForm.department}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              department: e.target.value.slice(0, 80),
                            }))
                          }
                          placeholder="Department"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />

                        <input
                          value={createForm.branch}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              branch: e.target.value.slice(0, 80),
                            }))
                          }
                          placeholder="Branch"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />

                        <select
                          value={createForm.employmentType}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              employmentType: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        >
                          <option value="full_time">Full Time</option>
                          <option value="part_time">Part Time</option>
                          <option value="contractual">Contractual</option>
                          <option value="hourly">Hourly</option>
                        </select>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold text-[var(--color-muted)]">
                            Joining Date
                          </label>

                          <input
                            type="date"
                            value={createForm.joiningDate}
                            onChange={(e) =>
                              setCreateForm((c) => ({
                                ...c,
                                joiningDate: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {createForm.role === "parent" ? (
                    <select
                      value={createForm.linkedStudentId}
                      onChange={(e) =>
                        setCreateForm((c) => ({
                          ...c,
                          linkedStudentId: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">Select student to link...</option>
                      {studentOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} â€” {s.email}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {createForm.role === "student" ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          value={createForm.parentName}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              parentName: e.target.value.slice(0, 60),
                            }))
                          }
                          placeholder="e.g. Supriya"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <input
                          value={createForm.parentEmail}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              parentEmail: e.target.value.slice(0, 60),
                            }))
                          }
                          placeholder="Parent email"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <input
                          value={createForm.parentMobile}
                          onChange={(e) =>
                            setCreateForm((c) => ({
                              ...c,
                              parentMobile: e.target.value.slice(0, 15),
                            }))
                          }
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
                                  checked={createForm.assignedFacultyIds.includes(
                                    edu.id,
                                  )}
                                  onChange={(e) =>
                                    setCreateForm((c) => ({
                                      ...c,
                                      assignedFacultyIds: e.target.checked
                                        ? [...c.assignedFacultyIds, edu.id]
                                        : c.assignedFacultyIds.filter(
                                            (id) => id !== edu.id,
                                          ),
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
                    onChange={(e) =>
                      setCreateForm((c) => ({
                        ...c,
                        password: e.target.value.slice(0, 24),
                      }))
                    }
                    placeholder="Temporary password"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-panel)]">
                    <input
                      type="checkbox"
                      checked={createForm.confirm}
                      onChange={(e) =>
                        setCreateForm((c) => ({
                          ...c,
                          confirm: e.target.checked,
                        }))
                      }
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
                      {
                        label: "Students",
                        value: accountCounts.students,
                        icon: "bi-mortarboard-fill",
                        color: "#16A34A",
                      },
                      {
                        label: "Faculty",
                        value: accountCounts.educators,
                        icon: "bi-person-workspace",
                        color: "#0284C7",
                      },
                      {
                        label: "Parents",
                        value: accountCounts.parents,
                        icon: "bi-people-fill",
                        color: "#D97706",
                      },
                      {
                        label: "Admins",
                        value: accountCounts.admins,
                        icon: "bi-shield-fill-check",
                        color: "#4F46E5",
                      },
                      {
                        label: "Counsellors",
                        value: accountCounts.counsellors,
                        icon: "bi-chat-dots-fill",
                        color: "#7C3AED",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center"
                      >
                        <i
                          className={`bi ${item.icon} text-xl`}
                          style={{ color: item.color }}
                        />
                        <p className="mt-1 text-2xl font-black text-[var(--color-heading)]">
                          {item.value}
                        </p>
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
                      <div
                        key={item}
                        className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "directory" ? (
            /* â”€â”€ DIRECTORY TAB (preserved) â”€â”€ */
            <>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  {
                    label: "Total",
                    value: accountCounts.total,
                    icon: "bi-people-fill",
                    color: "var(--color-primary)",
                  },
                  {
                    label: "Active",
                    value: users.filter((u) => u.status === "active").length,
                    icon: "bi-person-check-fill",
                    color: "#10B981",
                  },
                  {
                    label: "Faculty",
                    value: accountCounts.educators,
                    icon: "bi-person-workspace",
                    color: "#0EA5E9",
                  },
                  {
                    label: "Students",
                    value: accountCounts.students,
                    icon: "bi-mortarboard-fill",
                    color: "#8B5CF6",
                  },
                  {
                    label: "Pending",
                    value: users.filter((u) => u.status === "pending").length,
                    icon: "bi-hourglass-split",
                    color: "#F59E0B",
                  },
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
                        <i
                          className={`bi ${stat.icon}`}
                          style={{ color: stat.color, fontSize: 16 }}
                        />
                      </div>
                      <div>
                        <div className="text-xl font-black text-[var(--color-heading)]">
                          {stat.value}
                        </div>
                        <div className="text-xs font-semibold text-[var(--color-muted)]">
                          {stat.label}
                        </div>
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
                    placeholder="Search name, email, programâ€¦"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as "all" | Role)
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  style={{ minWidth: 140 }}
                >
                  <option value="all">All Roles ({accountCounts.total})</option>
                  <option value="student">
                    Students ({accountCounts.students})
                  </option>
                  <option value="educator">
                    Faculty ({accountCounts.educators})
                  </option>
                  <option value="admin">Admins ({accountCounts.admins})</option>
                  <option value="parent">
                    Parents ({accountCounts.parents})
                  </option>
                  <option value="counsellor">
                    Counsellors ({accountCounts.counsellors})
                  </option>
                </select>
                {roleFilter !== "all" || searchQuery ? (
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setSearchQuery("");
                    }}
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {renderUserGrid(filteredUsers)}
            </>
          ) : (
            /* â”€â”€ VERIFICATION TAB (preserved) â”€â”€ */
            <div>
              <p className="mb-4 text-sm font-bold text-[var(--color-heading)]">
                <i className="bi bi-shield-check me-2 text-[var(--color-primary)]" />
                Pending Approval Requests
              </p>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  No pending requests.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/10"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-[var(--color-heading)]">
                            {req.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {req.email}
                          </p>
                          {req.mobile && (
                            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                              <i className="bi bi-telephone me-1" />
                              {req.mobile}
                            </p>
                          )}
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
                              const res = await fetch(
                                "/api/admin/user-requests/approve",
                                {
                                  method: "POST",
                                  credentials: "same-origin",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ userId: req.id }),
                                },
                              );
                              const data = await res.json();
                              if (data.ok) {
                                setPendingRequests((prev) =>
                                  prev.filter((r) => r.id !== req.id),
                                );
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
                              const res = await fetch(
                                "/api/admin/user-requests/reject",
                                {
                                  method: "POST",
                                  credentials: "same-origin",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ userId: req.id }),
                                },
                              );
                              const data = await res.json();
                              if (data.ok) {
                                setPendingRequests((prev) =>
                                  prev.filter((r) => r.id !== req.id),
                                );
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

                      {req.role === "educator" && req.profile && (
                        <div className="mt-3 border-t border-amber-200/60 pt-3">
                          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-amber-700">
                            <i className="bi bi-file-earmark-person me-1" />
                            Faculty Verification Documents
                          </p>

                          {req.profile.qualification && (
                            <p className="mb-1 text-xs text-[var(--color-heading)]">
                              <span className="font-semibold text-[var(--color-muted)]">
                                Qualification:
                              </span>{" "}
                              {req.profile.qualification}
                            </p>
                          )}
                          {req.profile.experience && (
                            <p className="mb-1 text-xs text-[var(--color-heading)]">
                              <span className="font-semibold text-[var(--color-muted)]">
                                Experience:
                              </span>{" "}
                              {req.profile.experience}
                            </p>
                          )}
                          {(req.profile.subjects?.length ?? 0) > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-[var(--color-muted)]">
                                Subjects:{" "}
                              </span>
                              {req.profile.subjects!.map((s, i) => (
                                <span
                                  key={i}
                                  className="mr-1 inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/20"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-2">
                            {req.profile.cvUrl && (
                              <a
                                href={req.profile.cvUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              >
                                <i className="bi bi-file-earmark-text" />
                                View Resume / CV
                              </a>
                            )}
                            {req.profile.photoIdFrontUrl && (
                              <a
                                href={req.profile.photoIdFrontUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              >
                                <i className="bi bi-card-image" />
                                Photo ID â€” Front
                              </a>
                            )}
                            {req.profile.photoIdBackUrl && (
                              <a
                                href={req.profile.photoIdBackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              >
                                <i className="bi bi-card-image" />
                                Photo ID â€” Back
                              </a>
                            )}
                          </div>

                          {(req.profile.photoIdFrontUrl ||
                            req.profile.photoIdBackUrl) && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {req.profile.photoIdFrontUrl && (
                                <div className="rounded-lg border border-[var(--color-border)] bg-white p-1.5 dark:bg-[var(--color-card)]">
                                  <p className="mb-1 text-[10px] font-bold text-[var(--color-muted)]">
                                    ID Front
                                  </p>
                                  <img
                                    src={req.profile.photoIdFrontUrl}
                                    alt="Photo ID Front"
                                    className="h-28 w-auto rounded-md object-contain"
                                  />
                                </div>
                              )}
                              {req.profile.photoIdBackUrl && (
                                <div className="rounded-lg border border-[var(--color-border)] bg-white p-1.5 dark:bg-[var(--color-card)]">
                                  <p className="mb-1 text-[10px] font-bold text-[var(--color-muted)]">
                                    ID Back
                                  </p>
                                  <img
                                    src={req.profile.photoIdBackUrl}
                                    alt="Photo ID Back"
                                    className="h-28 w-auto rounded-md object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : mainTab === "students" ? (
          /* â”€â”€ STUDENTS TAB â”€â”€ */
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1" style={{ minWidth: 200 }}>
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]" />
                <input
                  type="text"
                  placeholder="Search students by name, email, programâ€¦"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                onClick={() => {
                  setCreateForm((c) => ({ ...c, role: "student" }));
                  setActiveTab("register");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                <i className="bi bi-person-plus-fill" />
                Admit Student
              </button>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {renderUserGrid(tabStudents)}
          </>
        ) : mainTab === "staff" ? (
          /* ── STAFF TAB: FACULTY + NON-TEACHING STAFF ── */
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmployeeSubTab("faculty");
                  setSearchQuery("");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  employeeSubTab === "faculty"
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                }`}
              >
                <i className="bi bi-person-workspace me-2" />
                Faculty ({accountCounts.educators})
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmployeeSubTab("staff");
                  setSearchQuery("");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  employeeSubTab === "staff"
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                }`}
              >
                <i className="bi bi-person-badge-fill me-2" />
                Staff ({accountCounts.staff})
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div
                className="relative flex-1"
                style={{ minWidth: 200 }}
              >
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]" />

                <input
                  type="text"
                  placeholder={
                    employeeSubTab === "faculty"
                      ? "Search faculty by name, email, Employee ID…"
                      : "Search staff by name, email, Employee ID, designation…"
                  }
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <button
                onClick={() => {
                  const role =
                    employeeSubTab === "faculty"
                      ? "educator"
                      : "staff";

                  setCreateForm((c) => ({
                    ...c,
                    role,
                    program:
                      role === "educator"
                        ? "Faculty"
                        : "Staff",
                    password:
                      role === "educator"
                        ? "Educator@123"
                        : "Staff@123",
                    confirm: false,
                  }));

                  setActiveTab("register");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                <i className="bi bi-person-plus-fill" />
                Add Employee
              </button>

              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {renderUserGrid(
              employeeSubTab === "faculty"
                ? tabEducators
                : tabStaff,
            )}
          </>
        ) : mainTab === "parents" ? (
          /* â”€â”€ PARENTS TAB â”€â”€ */
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1" style={{ minWidth: 200 }}>
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]" />
                <input
                  type="text"
                  placeholder="Search parents by name, emailâ€¦"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                onClick={() => {
                  setCreateForm((c) => ({ ...c, role: "parent" }));
                  setActiveTab("register");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                <i className="bi bi-person-plus-fill" />
                Add Parent
              </button>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {renderUserGrid(tabParents)}
          </>
        ) : (
          /* â”€â”€ OTHER ACCOUNTS TAB (admin, counsellor, etc.) â”€â”€ */
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1" style={{ minWidth: 200 }}>
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, email, roleâ€¦"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                onClick={() => {
                  setCreateForm((c) => ({ ...c, role: "admin" }));
                  setActiveTab("register");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                <i className="bi bi-person-plus-fill" />
                Add Account
              </button>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {renderUserGrid(tabOther)}
          </>
        )}
      </div>

      {editModal}
    </section>
  );
}






