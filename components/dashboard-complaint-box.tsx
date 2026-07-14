"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileWarning,
  Inbox,
  Loader2,
  LockKeyhole,
  MessageSquareWarning,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  ComplaintCategory,
  ComplaintItem,
  ComplaintPriority,
  ComplaintStatus,
  Role,
  SessionUser,
} from "@/lib/types";

type DashboardComplaintBoxProps = {
  session: SessionUser | null;
  role: Role;
};

type ComplaintFormState = {
  category: ComplaintCategory;
  subject: string;
  description: string;
  priority: ComplaintPriority;
};

const EMPTY_FORM: ComplaintFormState = {
  category: "academic",
  subject: "",
  description: "",
  priority: "medium",
};

const CATEGORY_OPTIONS: Array<{
  value: ComplaintCategory;
  label: string;
}> = [
  {
    value: "academic",
    label: "Academic",
  },
  {
    value: "faculty",
    label: "Faculty",
  },
  {
    value: "fees",
    label: "Fees & Payments",
  },
  {
    value: "attendance",
    label: "Attendance",
  },
  {
    value: "technical",
    label: "Technical Issue",
  },
  {
    value: "facilities",
    label: "Facilities",
  },
  {
    value: "safety",
    label: "Safety",
  },
  {
    value: "other",
    label: "Other",
  },
];

const PRIORITY_OPTIONS: Array<{
  value: ComplaintPriority;
  label: string;
  description: string;
}> = [
  {
    value: "low",
    label: "Low",
    description:
      "General concern with no immediate impact",
  },
  {
    value: "medium",
    label: "Medium",
    description:
      "Needs attention in the normal review cycle",
  },
  {
    value: "high",
    label: "High",
    description:
      "Important issue requiring prompt attention",
  },
  {
    value: "urgent",
    label: "Urgent",
    description:
      "Serious or time-sensitive concern",
  },
];

const STATUS_OPTIONS: Array<{
  value: ComplaintStatus;
  label: string;
}> = [
  {
    value: "submitted",
    label: "Submitted",
  },
  {
    value: "under-review",
    label: "Under Review",
  },
  {
    value: "resolved",
    label: "Resolved",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

function formatComplaintDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}

function getCategoryLabel(
  category: ComplaintCategory,
) {
  return (
    CATEGORY_OPTIONS.find(
      (option) =>
        option.value ===
        category,
    )?.label ??
    "Other"
  );
}

function getPriorityLabel(
  priority: ComplaintPriority,
) {
  return (
    PRIORITY_OPTIONS.find(
      (option) =>
        option.value ===
        priority,
    )?.label ??
    "Medium"
  );
}

function getStatusLabel(
  status: ComplaintStatus,
) {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value ===
        status,
    )?.label ??
    "Submitted"
  );
}

function getRoleLabel(
  role:
    ComplaintItem["submittedByRole"],
) {
  if (
    role ===
    "educator"
  ) {
    return "Faculty";
  }

  if (
    role ===
    "parent"
  ) {
    return "Parent";
  }

  return "Student";
}

function getStatusClasses(
  status: ComplaintStatus,
) {
  if (
    status ===
    "under-review"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status ===
    "resolved"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status ===
    "closed"
  ) {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getPriorityClasses(
  priority: ComplaintPriority,
) {
  if (
    priority ===
    "urgent"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    priority ===
    "high"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (
    priority ===
    "low"
  ) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-violet-200 bg-violet-50 text-violet-700";
}

export function DashboardComplaintBox({
  session,
  role,
}: DashboardComplaintBoxProps) {
  const isAdmin =
    role === "admin";

  const canSubmit =
    role === "student" ||
    role === "parent" ||
    role === "educator";

  const [
    complaints,
    setComplaints,
  ] = useState<
    ComplaintItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(
    isAdmin,
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    savingReview,
    setSavingReview,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    complaintReference,
    setComplaintReference,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState<
    ComplaintFormState
  >({
    ...EMPTY_FORM,
  });

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    ComplaintStatus |
    "all"
  >("all");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState<
    ComplaintPriority |
    "all"
  >("all");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<
    ComplaintCategory |
    "all"
  >("all");

  const [
    selectedComplaint,
    setSelectedComplaint,
  ] = useState<
    ComplaintItem | null
  >(null);

  const [
    reviewStatus,
    setReviewStatus,
  ] = useState<
    ComplaintStatus
  >("submitted");

  const [
    adminNote,
    setAdminNote,
  ] = useState("");

  useEffect(() => {
    if (
      isAdmin
    ) {
      void loadComplaints();
    }
  }, [isAdmin]);

  async function loadComplaints() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/complaints",
          {
            method:
              "GET",

            credentials:
              "same-origin",

            cache:
              "no-store",
          },
        );

      const data =
        (await response.json()) as {
          complaints?:
            ComplaintItem[];

          error?:
            string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
            "Unable to load complaints.",
        );
      }

      setComplaints(
        data.complaints ??
          [],
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to load complaints.",
      );
    } finally {
      setLoading(false);
    }
  }

  const complaintStats =
    useMemo(() => {
      return {
        total:
          complaints.length,

        submitted:
          complaints.filter(
            (complaint) =>
              complaint.status ===
              "submitted",
          ).length,

        underReview:
          complaints.filter(
            (complaint) =>
              complaint.status ===
              "under-review",
          ).length,

        resolved:
          complaints.filter(
            (complaint) =>
              complaint.status ===
              "resolved",
          ).length,

        urgent:
          complaints.filter(
            (complaint) =>
              complaint.priority ===
                "urgent" &&
              complaint.status !==
                "closed",
          ).length,
      };
    }, [complaints]);

  const filteredComplaints =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return complaints.filter(
        (complaint) => {
          const matchesSearch =
            !normalizedSearch ||
            complaint.subject
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            complaint.description
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            complaint.submittedByName
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            complaint.status ===
              statusFilter;

          const matchesPriority =
            priorityFilter ===
              "all" ||
            complaint.priority ===
              priorityFilter;

          const matchesCategory =
            categoryFilter ===
              "all" ||
            complaint.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesCategory
          );
        },
      );
    }, [
      complaints,
      searchTerm,
      statusFilter,
      priorityFilter,
      categoryFilter,
    ]);

  function updateForm<
    Key extends keyof ComplaintFormState,
  >(
    key: Key,
    value:
      ComplaintFormState[Key],
  ) {
    setForm(
      (current) => ({
        ...current,

        [key]:
          value,
      }),
    );
  }

  async function handleSubmitComplaint(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setComplaintReference("");

    if (
      !form.subject.trim()
    ) {
      setError(
        "Enter a complaint subject.",
      );

      return;
    }

    if (
      form.subject.trim()
        .length > 150
    ) {
      setError(
        "Complaint subject cannot exceed 150 characters.",
      );

      return;
    }

    if (
      form.description
        .trim().length <
      10
    ) {
      setError(
        "Please provide at least 10 characters in the complaint details.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/complaints",
          {
            method:
              "POST",

            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                category:
                  form.category,

                subject:
                  form.subject.trim(),

                description:
                  form.description.trim(),

                priority:
                  form.priority,
              }),
          },
        );

      const data =
        (await response.json()) as {
          submitted?:
            boolean;

          complaintId?:
            string;

          message?:
            string;

          error?:
            string;
        };

      if (
        !response.ok ||
        !data.submitted
      ) {
        throw new Error(
          data.error ??
            "Unable to submit complaint.",
        );
      }

      setForm({
        ...EMPTY_FORM,
      });

      setComplaintReference(
        data.complaintId ??
          "",
      );

      setSuccess(
        data.message ??
          "Your complaint has been submitted privately to the administration.",
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to submit complaint.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openComplaint(
    complaint:
      ComplaintItem,
  ) {
    setSelectedComplaint(
      complaint,
    );

    setReviewStatus(
      complaint.status,
    );

    setAdminNote(
      complaint.adminNote ??
        "",
    );

    setError("");
    setSuccess("");
  }

  function closeComplaint() {
    if (
      savingReview
    ) {
      return;
    }

    setSelectedComplaint(
      null,
    );

    setAdminNote("");
  }

  async function saveComplaintReview() {
    if (
      !selectedComplaint
    ) {
      return;
    }

    setSavingReview(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/complaints/${selectedComplaint.id}`,
          {
            method:
              "PUT",

            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  reviewStatus,

                adminNote:
                  adminNote.trim(),
              }),
          },
        );

      const data =
        (await response.json()) as {
          complaint?:
            ComplaintItem;

          error?:
            string;
        };

      if (
        !response.ok ||
        !data.complaint
      ) {
        throw new Error(
          data.error ??
            "Unable to update complaint.",
        );
      }

      setComplaints(
        (current) =>
          current.map(
            (complaint) =>
              complaint.id ===
              data.complaint!.id
                ? data.complaint!
                : complaint,
          ),
      );

      setSelectedComplaint(
        data.complaint,
      );

      setReviewStatus(
        data.complaint.status,
      );

      setAdminNote(
        data.complaint.adminNote ??
          "",
      );

      setSuccess(
        "Complaint updated successfully.",
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to update complaint.",
      );
    } finally {
      setSavingReview(false);
    }
  }

  async function deleteComplaint(
    complaint:
      ComplaintItem,
  ) {
    const confirmed =
      window.confirm(
        `Delete the complaint "${complaint.subject}" permanently?`,
      );

    if (
      !confirmed
    ) {
      return;
    }

    setDeletingId(
      complaint.id,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/complaints/${complaint.id}`,
          {
            method:
              "DELETE",

            credentials:
              "same-origin",
          },
        );

      const data =
        (await response.json()) as {
          deleted?:
            boolean;

          error?:
            string;
        };

      if (
        !response.ok ||
        !data.deleted
      ) {
        throw new Error(
          data.error ??
            "Unable to delete complaint.",
        );
      }

      setComplaints(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              complaint.id,
          ),
      );

      if (
        selectedComplaint?.id ===
        complaint.id
      ) {
        setSelectedComplaint(
          null,
        );
      }

      setSuccess(
        "Complaint deleted successfully.",
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to delete complaint.",
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  if (
    isAdmin
  ) {
    return (
      <section className="grid gap-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071A45] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-[0_20px_55px_rgba(11,64,161,0.22)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                <MessageSquareWarning
                  size={28}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  Private Administration
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                  Complaint Box
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                  Review confidential complaints submitted by students, parents, and faculty.
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <ShieldCheck
                size={24}
              />

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-100">
                  Access
                </p>

                <p className="mt-1 text-sm font-black">
                  Admin Only
                </p>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {[
            {
              label:
                "Total",
              value:
                complaintStats.total,
              icon:
                Inbox,
              classes:
                "bg-blue-100 text-blue-700",
            },

            {
              label:
                "Submitted",
              value:
                complaintStats.submitted,
              icon:
                FileWarning,
              classes:
                "bg-violet-100 text-violet-700",
            },

            {
              label:
                "Under Review",
              value:
                complaintStats.underReview,
              icon:
                Clock3,
              classes:
                "bg-amber-100 text-amber-700",
            },

            {
              label:
                "Resolved",
              value:
                complaintStats.resolved,
              icon:
                CheckCircle2,
              classes:
                "bg-emerald-100 text-emerald-700",
            },

            {
              label:
                "Urgent",
              value:
                complaintStats.urgent,
              icon:
                AlertTriangle,
              classes:
                "bg-red-100 text-red-700",
            },
          ].map(
            (stat) => {
              const Icon =
                stat.icon;

              return (
                <article
                  key={
                    stat.label
                  }
                  className="surface rounded-[1.5rem] border border-[var(--color-border)] p-5"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.classes}`}
                  >
                    <Icon
                      size={20}
                    />
                  </div>

                  <p className="mt-5 text-3xl font-black text-[var(--color-heading)]">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {stat.label}
                  </p>
                </article>
              );
            },
          )}
        </div>

        <section className="surface overflow-hidden rounded-[2rem]">
          <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="section-label">
                  Confidential Records
                </p>

                <h3 className="mt-2 text-2xl font-black text-[var(--color-heading)]">
                  Submitted Complaints
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={
                      searchTerm
                    }
                    onChange={(
                      event,
                    ) =>
                      setSearchTerm(
                        event.target.value,
                      )
                    }
                    placeholder="Search complaints..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setStatusFilter(
                      event.target
                        .value as
                        | ComplaintStatus
                        | "all",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="all">
                    All statuses
                  </option>

                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    priorityFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setPriorityFilter(
                      event.target
                        .value as
                        | ComplaintPriority
                        | "all",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="all">
                    All priorities
                  </option>

                  {PRIORITY_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    categoryFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setCategoryFilter(
                      event.target
                        .value as
                        | ComplaintCategory
                        | "all",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="all">
                    All categories
                  </option>

                  {CATEGORY_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center">
                <Loader2 className="h-9 w-9 animate-spin text-[#0B40A1]" />

                <p className="mt-4 text-sm font-semibold text-[var(--color-muted)]">
                  Loading complaints...
                </p>
              </div>
            ) : filteredComplaints.length ===
              0 ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-blue-200 bg-blue-50/40 px-6 text-center">
                <Inbox className="h-12 w-12 text-blue-300" />

                <h4 className="mt-5 text-xl font-black text-[var(--color-heading)]">
                  No complaints found
                </h4>

                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
                  New complaint submissions will appear here for private administrative review.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredComplaints.map(
                  (
                    complaint,
                  ) => (
                    <article
                      key={
                        complaint.id
                      }
                      className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getPriorityClasses(
                                complaint.priority,
                              )}`}
                            >
                              {getPriorityLabel(
                                complaint.priority,
                              )}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusClasses(
                                complaint.status,
                              )}`}
                            >
                              {getStatusLabel(
                                complaint.status,
                              )}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                              {getCategoryLabel(
                                complaint.category,
                              )}
                            </span>
                          </div>

                          <h4 className="mt-4 text-xl font-black text-[var(--color-heading)]">
                            {complaint.subject}
                          </h4>

                          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-muted)]">
                            {complaint.description}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound
                                size={14}
                              />

                              {
                                complaint.submittedByName
                              }

                              {" · "}

                              {getRoleLabel(
                                complaint.submittedByRole,
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3
                                size={14}
                              />

                              {formatComplaintDate(
                                complaint.createdAt,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openComplaint(
                                complaint,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082F79]"
                          >
                            Review

                            <ChevronDown
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              complaint.id
                            }
                            onClick={() =>
                              void deleteComplaint(
                                complaint,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50"
                          >
                            {deletingId ===
                            complaint.id ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={15}
                              />
                            )}

                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {selectedComplaint ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B40A1]">
                    Private Complaint Review
                  </p>

                  <h3 className="mt-1 text-xl font-black text-slate-900">
                    {selectedComplaint.subject}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={
                    closeComplaint
                  }
                  disabled={
                    savingReview
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Submitted By
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-800">
                      {
                        selectedComplaint.submittedByName
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {getRoleLabel(
                        selectedComplaint.submittedByRole,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Category
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-800">
                      {getCategoryLabel(
                        selectedComplaint.category,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Submitted
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-800">
                      {formatComplaintDate(
                        selectedComplaint.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Complaint Details
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Complaint Status
                  </label>

                  <select
                    value={
                      reviewStatus
                    }
                    onChange={(
                      event,
                    ) =>
                      setReviewStatus(
                        event.target
                          .value as ComplaintStatus,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Internal Admin Note
                  </label>

                  <textarea
                    value={
                      adminNote
                    }
                    onChange={(
                      event,
                    ) =>
                      setAdminNote(
                        event.target.value,
                      )
                    }
                    rows={6}
                    maxLength={
                      3000
                    }
                    placeholder="Add investigation details, action taken, or resolution notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    This note is visible only to administrators.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeComplaint
                    }
                    disabled={
                      savingReview
                    }
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveComplaintReview()
                    }
                    disabled={
                      savingReview
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {savingReview ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <ShieldCheck
                        size={17}
                      />
                    )}

                    {savingReview
                      ? "Saving..."
                      : "Save Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  if (
    !canSubmit
  ) {
    return (
      <section className="surface flex min-h-[28rem] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
        <LockKeyhole className="h-12 w-12 text-slate-300" />

        <h2 className="mt-5 text-2xl font-black text-[var(--color-heading)]">
          Complaint Box Unavailable
        </h2>

        <p className="mt-3 max-w-md text-sm leading-7 text-[var(--color-muted)]">
          Complaint submission is available to students, parents, and faculty.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071A45] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-[0_20px_55px_rgba(11,64,161,0.22)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
            <MessageSquareWarning
              size={28}
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
              Private & Confidential
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Complaint Box
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
              Submit a concern directly to the administration. Your complaint will not be shown to students, parents, faculty members, or other users.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2
                size={32}
              />
            </div>

            <h3 className="mt-5 text-2xl font-black text-emerald-900">
              Complaint Submitted
            </h3>

            <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-800">
              {success}
            </p>

            {complaintReference ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-white px-5 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Complaint Reference
                </p>

                <p className="mt-1 break-all text-sm font-black text-emerald-900">
                  {complaintReference}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setSuccess("");
                setComplaintReference("");
              }}
              className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
            >
              Submit Another Complaint
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <form
            onSubmit={
              handleSubmitComplaint
            }
            className="surface rounded-[2rem] p-5 sm:p-7"
          >
            <div>
              <p className="section-label">
                New Complaint
              </p>

              <h3 className="mt-2 text-2xl font-black text-[var(--color-heading)]">
                Tell the administration what happened
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Logged in as{" "}
                <strong>
                  {session?.name ??
                    "User"}
                </strong>
                . Please provide clear and factual details.
              </p>
            </div>

            <div className="mt-7 grid gap-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Complaint Category *
                </label>

                <select
                  value={
                    form.category
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "category",
                      event.target
                        .value as ComplaintCategory,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                >
                  {CATEGORY_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Subject *
                </label>

                <input
                  type="text"
                  value={
                    form.subject
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "subject",
                      event.target.value,
                    )
                  }
                  maxLength={
                    150
                  }
                  placeholder="Write a short title for your complaint"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />

                <p className="mt-2 text-right text-xs text-slate-400">
                  {
                    form.subject
                      .length
                  }
                  /150
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Complaint Details *
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "description",
                      event.target.value,
                    )
                  }
                  rows={
                    8
                  }
                  maxLength={
                    3000
                  }
                  placeholder="Explain the issue, when it happened, who was involved, and any other details that may help the administration review it."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-blue-400"
                />

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Minimum 10 characters
                  </span>

                  <span>
                    {
                      form.description
                        .length
                    }
                    /3000
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Priority *
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {PRIORITY_OPTIONS.map(
                    (option) => (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          updateForm(
                            "priority",
                            option.value,
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          form.priority ===
                          option.value
                            ? "border-[#0B40A1] bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-black text-slate-800">
                          {option.label}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {
                            option.description
                          }
                        </p>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#082F79] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={18}
                  />
                )}

                {submitting
                  ? "Submitting..."
                  : "Submit Complaint Privately"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#0B40A1]">
                <LockKeyhole
                  size={21}
                />
              </div>

              <h4 className="mt-4 text-lg font-black text-blue-950">
                Private Submission
              </h4>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Your complaint is sent directly to the administration and is visible only to admin accounts.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle
                  size={21}
                />
              </div>

              <h4 className="mt-4 text-lg font-black text-amber-950">
                Be Clear and Factual
              </h4>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Include dates, events, and relevant details. Avoid sharing passwords or sensitive banking information.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck
                  size={21}
                />
              </div>

              <h4 className="mt-4 text-lg font-black text-emerald-950">
                Secure Review
              </h4>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                The administration can privately review, investigate, and record action taken.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
