"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Mail,
  Phone,
  User,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
} from "@/components/ui-icons";

import type { Enquiry, EnquiryStatus } from "@/lib/types";

const STATUS_OPTIONS: {
  value: EnquiryStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "enrolled", label: "Enrolled" },
  { value: "closed", label: "Closed" },
];

function requestTypeLabel(enquiry: Enquiry) {
  switch (enquiry.requestType) {
    case "consultation":
      return "Consultation";
    case "demo":
      return "Demo";
    default:
      return "General Enquiry";
  }
}

function requestTypeClasses(enquiry: Enquiry) {
  switch (enquiry.requestType) {
    case "consultation":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "demo":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function statusClasses(status: EnquiryStatus) {
  switch (status) {
    case "new":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "contacted":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "enrolled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPreferredDate(value?: string) {
  if (!value) return "Not set";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatPreferredTime(value?: string) {
  if (!value) return "Not set";

  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = match[2];

  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;
}

type EnquiriesResponse = {
  enquiries?: Enquiry[];
  canDelete?: boolean;
  error?: string;
};

type MutationResponse = {
  success?: boolean;
  error?: string;
};

export function DashboardEnquiryManager() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [canDelete, setCanDelete] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchEnquiries = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = (await response.json()) as EnquiriesResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch enquiries.");
      }

      setEnquiries(Array.isArray(data.enquiries) ? data.enquiries : []);

      setCanDelete(data.canDelete === true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load enquiries.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnquiries(true);
  }, [fetchEnquiries]);

  async function updateStatus(enquiry: Enquiry, status: EnquiryStatus) {
    if (!enquiry.id || updatingId || deletingId) {
      return;
    }

    if (status === enquiry.status) {
      return;
    }

    setUpdatingId(enquiry.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: enquiry.id,
          status,
        }),
      });

      const data = (await response.json()) as MutationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update enquiry.");
      }

      setEnquiries((current) =>
        current.map((item) =>
          item.id === enquiry.id ? { ...item, status } : item,
        ),
      );

      setSuccess(`${enquiry.name}'s enquiry was marked as ${status}.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update enquiry.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteEnquiryItem(enquiry: Enquiry) {
    if (!canDelete || !enquiry.id || deletingId || updatingId) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete the enquiry from ${enquiry.name}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(enquiry.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: enquiry.id,
        }),
      });

      const data = (await response.json()) as MutationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete enquiry.");
      }

      setEnquiries((current) =>
        current.filter((item) => item.id !== enquiry.id),
      );

      setSuccess(`The enquiry from ${enquiry.name} was deleted.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete enquiry.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesStatus =
      statusFilter === "all" || enquiry.status === statusFilter;

    const matchesSearch =
      !normalizedSearch ||
      [
        enquiry.name,
        enquiry.contact,
        enquiry.email,
        enquiry.courseTitle,
        enquiry.branch,
        enquiry.source,
        enquiry.requestType,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedSearch),
      );

    return matchesStatus && matchesSearch;
  });

  const totalNew = enquiries.filter((item) => item.status === "new").length;

  const totalContacted = enquiries.filter(
    (item) => item.status === "contacted",
  ).length;

  const totalEnrolled = enquiries.filter(
    (item) => item.status === "enrolled",
  ).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
        <div className="text-center">
          <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Loading enquiries...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-blue-50/70 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">
              Website Leads
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Student Enquiries
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Manage consultation, demo and course enquiries submitted through
              the website.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccess("");
              void fetchEnquiries();
            }}
            disabled={
              isRefreshing || Boolean(updatingId) || Boolean(deletingId)
            }
            className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Enquiries"}
          </button>
        </div>

        {/* STATS */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Total Submissions",
              value: enquiries.length,
            },
            {
              label: "New",
              value: totalNew,
            },
            {
              label: "Contacted",
              value: totalContacted,
            },
            {
              label: "Enrolled",
              value: totalEnrolled,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-6">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                void fetchEnquiries();
              }}
              className="font-black underline"
            >
              Retry
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
          >
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-xs font-black"
              aria-label="Dismiss success message"
            >
              Close
            </button>
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_200px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, mobile, email, course or branch..."
            aria-label="Search enquiries"
            className="min-h-12 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter enquiries by status"
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {filteredEnquiries.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <Mail className="mx-auto h-10 w-10 text-blue-600" />
            <h3 className="mt-4 text-lg font-black text-slate-900">
              {enquiries.length === 0
                ? "No enquiries yet"
                : "No matching enquiries"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {enquiries.length === 0
                ? "New website enquiries will appear here."
                : "Try changing the search or status filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredEnquiries.map((enquiry, index) => {
              const id = enquiry.id ?? `${enquiry.contact}-${index}`;

              const isUpdating = updatingId === enquiry.id;
              const isDeleting = deletingId === enquiry.id;
              const isBusy = isUpdating || isDeleting;

              return (
                <article
                  key={id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

                  <div className="p-5 sm:p-6">
                    {/* PERSON AND STATUS */}
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-black text-blue-700">
                          {enquiry.name?.charAt(0).toUpperCase() || "?"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-xl font-black text-slate-900">
                              {enquiry.name}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${requestTypeClasses(
                                enquiry,
                              )}`}
                            >
                              {requestTypeLabel(enquiry)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {enquiry.role || "student"}
                            </span>

                            <a
                              href={`tel:${enquiry.contact}`}
                              className="inline-flex items-center gap-2 hover:text-blue-700"
                            >
                              <Phone className="h-4 w-4" />
                              {enquiry.contact}
                            </a>

                            {enquiry.email && (
                              <a
                                href={`mailto:${enquiry.email}`}
                                className="inline-flex min-w-0 items-center gap-2 break-all hover:text-blue-700"
                              >
                                <Mail className="h-4 w-4 shrink-0" />
                                {enquiry.email}
                              </a>
                            )}

                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatCreatedAt(enquiry.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* STATUS MANAGEMENT */}
                      <div className="w-full shrink-0 xl:w-[240px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Current Status
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-black capitalize ${statusClasses(
                              enquiry.status,
                            )}`}
                          >
                            {enquiry.status}
                          </span>

                          <label className="mt-4 block">
                            <span className="mb-2 block text-xs font-bold text-slate-600">
                              Update Status
                            </span>

                            <select
                              value={enquiry.status}
                              disabled={
                                isBusy ||
                                Boolean(updatingId) ||
                                Boolean(deletingId)
                              }
                              onChange={(event) =>
                                void updateStatus(
                                  enquiry,
                                  event.target.value as EnquiryStatus,
                                )
                              }
                              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          {isUpdating && (
                            <p className="mt-2 text-xs font-semibold text-blue-600">
                              Updating status...
                            </p>
                          )}
                        </div>

                        {/* ADMIN ONLY */}
                        {canDelete && (
                          <button
                            type="button"
                            disabled={
                              isBusy ||
                              Boolean(updatingId) ||
                              Boolean(deletingId)
                            }
                            onClick={() => void deleteEnquiryItem(enquiry)}
                            className="mt-3 min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Delete Enquiry"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* COURSE INTEREST */}
                    <div className="mt-5 rounded-[22px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5">
                      <div className="flex items-center gap-2 text-blue-700">
                        <BookOpen className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-wider">
                          Course Interest
                        </p>
                      </div>

                      <p className="mt-3 text-lg font-black text-slate-900">
                        {enquiry.courseTitle || "Not specified"}
                      </p>

                      {enquiry.message && (
                        <p className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                          {enquiry.message}
                        </p>
                      )}
                    </div>

                    {/* ADDITIONAL DETAILS */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Branch
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {enquiry.branch || "Not selected"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Preferred Date
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {formatPreferredDate(enquiry.preferredDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Preferred Time
                        </p>
                        <p className="mt-2 flex items-center gap-2 font-bold text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatPreferredTime(enquiry.preferredTime)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Source
                        </p>
                        <p className="mt-2 break-words font-bold capitalize text-slate-900">
                          {enquiry.source
                            ? enquiry.source.replace(/-/g, " ")
                            : "Website"}
                        </p>
                      </div>
                    </div>

                    {/* COURSE SUGGESTIONS */}
                    {Boolean(enquiry.suggestedCourses?.length) && (
                      <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                        <div className="flex items-center gap-2 text-purple-700">
                          <Sparkles className="h-4 w-4" />
                          <p className="text-[10px] font-black uppercase tracking-wider">
                            Also Interested In
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {enquiry.suggestedCourses?.map((suggestion) => (
                            <span
                              key={suggestion.standardKey}
                              className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-700"
                            >
                              {suggestion.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
