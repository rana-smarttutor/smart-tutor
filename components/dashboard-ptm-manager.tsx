"use client";

import {
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  PtmMode,
  PtmSession,
  PtmStatus,
  Role,
  SessionUser,
} from "@/lib/types";

type DashboardPtmManagerProps = {
  session: SessionUser | null;
  role: Role;
};

type PtmStudent = {
  id: string;
  name: string;
  email: string;
  program?: string;
  profilePhoto?: string;
};

type PtmFormState = {
  title: string;
  studentId: string;
  startsAt: string;
  endsAt: string;
  mode: PtmMode;
  meetingLink: string;
  location: string;
  agenda: string;
  notes: string;
  status: PtmStatus;
};

const EMPTY_FORM: PtmFormState = {
  title: "Parent-Teacher Meeting",
  studentId: "",
  startsAt: "",
  endsAt: "",
  mode: "online",
  meetingLink: "",
  location: "",
  agenda: "",
  notes: "",
  status: "scheduled",
};

function formatPtmDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function getStatusLabel(status: PtmStatus) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Scheduled";
}

function getStatusClasses(status: PtmStatus) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function DashboardPtmManager({
  session,
  role,
}: DashboardPtmManagerProps) {
  const isFaculty = role === "admin" || role === "educator";

  const [ptmSessions, setPtmSessions] = useState<PtmSession[]>([]);
  const [students, setStudents] = useState<PtmStudent[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingPtmId, setEditingPtmId] = useState<string | null>(null);

  const [form, setForm] = useState<PtmFormState>({
    ...EMPTY_FORM,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadPtmSessions();
  }, []);

  async function loadPtmSessions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ptm", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        ptmSessions?: PtmSession[];
        students?: PtmStudent[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to load PTM sessions.",
        );
      }

      setPtmSessions(data.ptmSessions ?? []);
      setStudents(data.students ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load PTM sessions.",
      );
    } finally {
      setLoading(false);
    }
  }

  const sortedSessions = useMemo(() => {
    return [...ptmSessions].sort((left, right) => {
      if (
        left.status === "scheduled" &&
        right.status !== "scheduled"
      ) {
        return -1;
      }

      if (
        left.status !== "scheduled" &&
        right.status === "scheduled"
      ) {
        return 1;
      }

      return (
        new Date(left.startsAt).getTime() -
        new Date(right.startsAt).getTime()
      );
    });
  }, [ptmSessions]);

  const upcomingCount = ptmSessions.filter(
    (ptm) =>
      ptm.status === "scheduled" &&
      new Date(ptm.startsAt).getTime() >= Date.now(),
  ).length;

  const scheduledCount = ptmSessions.filter(
    (ptm) => ptm.status === "scheduled",
  ).length;

  const completedCount = ptmSessions.filter(
    (ptm) => ptm.status === "completed",
  ).length;

  const cancelledCount = ptmSessions.filter(
    (ptm) => ptm.status === "cancelled",
  ).length;

  const stats = [
    {
      label: isFaculty ? "Total Sessions" : "My Sessions",
      value: ptmSessions.length,
      icon: Calendar,
      iconClass: "bg-teal-50 text-teal-600",
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      icon: Clock3,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Scheduled",
      value: scheduledCount,
      icon: UsersRound,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      icon: X,
      iconClass: "bg-red-50 text-red-600",
    },
  ];

  function updateForm<Key extends keyof PtmFormState>(
    key: Key,
    value: PtmFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateForm() {
    setEditingPtmId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(ptm: PtmSession) {
    setEditingPtmId(ptm.id);

    setForm({
      title: ptm.title,
      studentId: ptm.studentId,
      startsAt: toDateTimeLocal(ptm.startsAt),
      endsAt: toDateTimeLocal(ptm.endsAt),
      mode: ptm.mode,
      meetingLink: ptm.meetingLink ?? "",
      location: ptm.location ?? "",
      agenda: ptm.agenda ?? "",
      notes: ptm.notes ?? "",
      status: ptm.status,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingPtmId(null);

    setForm({
      ...EMPTY_FORM,
    });
  }

  async function handleSavePtm(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Enter a PTM title.");
      return;
    }

    if (!editingPtmId && !form.studentId) {
      setError("Select a student.");
      return;
    }

    const startsAt = toIsoDate(form.startsAt);

    if (!startsAt) {
      setError("Select a valid PTM date and time.");
      return;
    }

    if (
      form.mode === "online" &&
      !form.meetingLink.trim()
    ) {
      setError("Enter the online meeting link.");
      return;
    }

    if (
      form.mode === "offline" &&
      !form.location.trim()
    ) {
      setError("Enter the meeting location.");
      return;
    }

    setSaving(true);

    try {
      const endpoint = editingPtmId
        ? `/api/ptm/${editingPtmId}`
        : "/api/ptm";

      const response = await fetch(endpoint, {
        method: editingPtmId ? "PUT" : "POST",

        credentials: "same-origin",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: form.title.trim(),

          studentId: form.studentId,

          startsAt,

          endsAt: toIsoDate(form.endsAt),

          mode: form.mode,

          meetingLink:
            form.mode === "online"
              ? form.meetingLink.trim()
              : "",

          location:
            form.mode === "offline"
              ? form.location.trim()
              : "",

          agenda: form.agenda.trim(),

          notes: form.notes.trim(),

          status: form.status,
        }),
      });

      const data = (await response.json()) as {
        ptm?: PtmSession;
        error?: string;
      };

      if (!response.ok || !data.ptm) {
        throw new Error(
          data.error ?? "Unable to save PTM.",
        );
      }

      if (editingPtmId) {
        setPtmSessions((current) =>
          current.map((ptm) =>
            ptm.id === editingPtmId
              ? data.ptm!
              : ptm,
          ),
        );

        setSuccess("PTM updated successfully.");
      } else {
        setPtmSessions((current) => [
          data.ptm!,
          ...current,
        ]);

        setSuccess(
          "PTM scheduled successfully. The student and linked parent were notified.",
        );
      }

      setShowForm(false);
      setEditingPtmId(null);

      setForm({
        ...EMPTY_FORM,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save PTM.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePtmStatus(
    ptm: PtmSession,
    status: PtmStatus,
  ) {
    setUpdatingId(ptm.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/ptm/${ptm.id}`,
        {
          method: "PUT",

          credentials: "same-origin",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        },
      );

      const data = (await response.json()) as {
        ptm?: PtmSession;
        error?: string;
      };

      if (!response.ok || !data.ptm) {
        throw new Error(
          data.error ??
            "Unable to update PTM status.",
        );
      }

      setPtmSessions((current) =>
        current.map((item) =>
          item.id === ptm.id
            ? data.ptm!
            : item,
        ),
      );

      if (status === "completed") {
        setSuccess(
          "PTM marked as completed.",
        );
      } else if (status === "cancelled") {
        setSuccess(
          "PTM cancelled. The student and linked parent were notified.",
        );
      } else {
        setSuccess(
          "PTM restored to scheduled.",
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update PTM status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deletePtm(
    ptm: PtmSession,
  ) {
    const confirmed = window.confirm(
      `Delete "${ptm.title}" permanently?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(ptm.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/ptm/${ptm.id}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      const data = (await response.json()) as {
        deleted?: boolean;
        error?: string;
      };

      if (!response.ok || !data.deleted) {
        throw new Error(
          data.error ??
            "Unable to delete PTM.",
        );
      }

      setPtmSessions((current) =>
        current.filter(
          (item) => item.id !== ptm.id,
        ),
      );

      setSuccess(
        "PTM deleted successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete PTM.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">
            Communication
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Parent-Teacher Meetings
          </h2>

          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {isFaculty
              ? "Schedule PTM sessions and notify students and linked parents."
              : `View PTM schedules and meeting details${
                  session?.name
                    ? ` for ${session.name}`
                    : ""
                }.`}
          </p>
        </div>

        {isFaculty ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="btn-action btn-md inline-flex items-center justify-center font-bold"
          >
            <Plus
              size={16}
              className="mr-2"
            />

            New PTM Session
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                <Icon size={20} />
              </div>

              <div className="min-w-0">
                <div className="text-xl font-black text-[var(--color-heading)]">
                  {stat.value}
                </div>

                <div className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[1.75rem] bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B40A1]" />

          <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
            Loading PTM sessions...
          </p>
        </div>
      ) : sortedSessions.length === 0 ? (
        <div className="rounded-[1.75rem] bg-slate-50 py-16 text-center">
          <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-blue-100 text-[#0B40A1]">
            <Calendar size={32} />
          </div>

          <h3 className="text-lg font-bold text-[var(--color-heading)]">
            No PTM sessions yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
            {isFaculty
              ? "Schedule a PTM for a student. The student and linked parent will be notified."
              : "No PTM has been scheduled yet. New meetings will appear here."}
          </p>

          {isFaculty ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="btn-action btn-md mt-6 inline-flex items-center justify-center font-bold"
            >
              <Plus
                size={16}
                className="mr-2"
              />

              Schedule First PTM
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedSessions.map((ptm) => {
            const isUpdating =
              updatingId === ptm.id;

            const isDeleting =
              deletingId === ptm.id;

            return (
              <article
                key={ptm.id}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[var(--color-heading)]">
                        {ptm.title}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusClasses(
                          ptm.status,
                        )}`}
                      >
                        {getStatusLabel(
                          ptm.status,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Calendar size={15} />

                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Date & Time
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {formatPtmDate(
                            ptm.startsAt,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-violet-600">
                          <UserRound size={15} />

                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Student
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {ptm.studentName}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <UsersRound size={15} />

                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Teacher
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {ptm.teacherName}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-orange-600">
                          {ptm.mode === "online" ? (
                            <Video size={15} />
                          ) : (
                            <MapPin size={15} />
                          )}

                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Mode
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold capitalize text-slate-700">
                          {ptm.mode}
                        </p>
                      </div>
                    </div>

                    {ptm.agenda ? (
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Agenda
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {ptm.agenda}
                        </p>
                      </div>
                    ) : null}

                    {ptm.notes ? (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                          Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                          {ptm.notes}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4">
                      {ptm.mode === "online" &&
                      ptm.meetingLink ? (
                        <a
                          href={ptm.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082F79]"
                        >
                          <Video size={16} />

                          Join PTM

                          <ExternalLink size={14} />
                        </a>
                      ) : null}

                      {ptm.mode === "offline" &&
                      ptm.location ? (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700">
                          <MapPin size={16} />

                          {ptm.location}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isFaculty ? (
                    <div className="flex flex-wrap gap-2 xl:max-w-[17rem] xl:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(ptm)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        <Pencil size={14} />

                        Edit
                      </button>

                      {ptm.status !== "completed" ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            void updatePtmStatus(
                              ptm,
                              "completed",
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />

                          Complete
                        </button>
                      ) : null}

                      {ptm.status !== "cancelled" ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            void updatePtmStatus(
                              ptm,
                              "cancelled",
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-50"
                        >
                          <X size={14} />

                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            void updatePtmStatus(
                              ptm,
                              "scheduled",
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50"
                        >
                          <Calendar size={14} />

                          Restore
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() =>
                          void deletePtm(ptm)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}

                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && isFaculty ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#0B40A1]">
                  PTM Management
                </p>

                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {editingPtmId
                    ? "Edit PTM Session"
                    : "Schedule New PTM"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSavePtm}
              className="space-y-5 p-5 sm:p-6"
            >
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  PTM Title *
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {!editingPtmId ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select Student *
                  </label>

                  <select
                    value={form.studentId}
                    onChange={(event) =>
                      updateForm(
                        "studentId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Select a student
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {student.name}
                        {student.program
                          ? ` — ${student.program}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Start Date & Time *
                  </label>

                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) =>
                      updateForm(
                        "startsAt",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    End Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) =>
                      updateForm(
                        "endsAt",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Meeting Mode *
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "mode",
                        "online",
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                      form.mode === "online"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Online
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "mode",
                        "offline",
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                      form.mode === "offline"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>

              {form.mode === "online" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Meeting Link *
                  </label>

                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={(event) =>
                      updateForm(
                        "meetingLink",
                        event.target.value,
                      )
                    }
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Meeting Location *
                  </label>

                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      updateForm(
                        "location",
                        event.target.value,
                      )
                    }
                    placeholder="Smart Tutors, Room 2"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Agenda
                </label>

                <textarea
                  value={form.agenda}
                  onChange={(event) =>
                    updateForm(
                      "agenda",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Additional Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateForm(
                      "notes",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              {editingPtmId ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target
                          .value as PtmStatus,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <option value="scheduled">
                      Scheduled
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (!editingPtmId &&
                      students.length === 0)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Calendar size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingPtmId
                      ? "Save Changes"
                      : "Schedule PTM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}