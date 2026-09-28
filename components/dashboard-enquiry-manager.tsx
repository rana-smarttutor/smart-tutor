"use client";

import { useEffect, useState } from "react";

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

function requestTypeLabel(enquiry: Enquiry) {
  if (enquiry.requestType === "consultation") {
    return "Consultation";
  }

  if (enquiry.requestType === "demo") {
    return "Demo";
  }

  return "General Enquiry";
}

function requestTypeClasses(enquiry: Enquiry) {
  if (enquiry.requestType === "demo") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (enquiry.requestType === "consultation") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function statusClasses(status: EnquiryStatus) {
  if (status === "new") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "contacted") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "enrolled") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function statusDotClasses(status: EnquiryStatus) {
  if (status === "new") {
    return "bg-blue-500";
  }

  if (status === "contacted") {
    return "bg-amber-500";
  }

  if (status === "enrolled") {
    return "bg-emerald-500";
  }

  return "bg-slate-400";
}

function formatCreatedAt(value: string) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPreferredDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPreferredTime(value?: string) {
  if (!value) {
    return "Not set";
  }

  const match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return value;
  }

  const hours = Number(match[1]);

  const minutes = match[2];

  const suffix = hours >= 12 ? "PM" : "AM";

  const normalizedHour = hours % 12 || 12;

  return `${normalizedHour}:${minutes} ${suffix}`;
}

export function DashboardEnquiryManager() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchEnquiries();
  }, []);

  async function fetchEnquiries() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch enquiries");
      }

      const data = (await response.json()) as {
        enquiries?: Enquiry[];
      };

      setEnquiries(Array.isArray(data.enquiries) ? data.enquiries : []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "An error occurred while fetching enquiries",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(enquiry: Enquiry, status: EnquiryStatus) {
    if (!enquiry.id) {
      setError(
        "This enquiry does not have a valid ID. Refresh the page and try again.",
      );

      return;
    }

    setUpdatingId(enquiry.id);

    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: enquiry.id,
          status,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to update enquiry.");
      }

      setEnquiries((current) =>
        current.map((item) =>
          item.id === enquiry.id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update enquiry.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteEnquiryItem(enquiry: Enquiry) {
    if (!enquiry.id) {
      setError("This enquiry does not have a valid ID.");

      return;
    }

    const confirmed = window.confirm(
      `Delete enquiry from ${enquiry.name}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(enquiry.id);

    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: enquiry.id,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to delete enquiry.");
      }

      setEnquiries((current) =>
        current.filter((item) => item.id !== enquiry.id),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete enquiry.",
      );
    } finally {
      setDeletingId(null);
    }
  }
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
      {/* =========================
          HEADER
      ========================= */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-blue-50/70 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">
              Website Leads
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
              Student Enquiries
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
              Manage consultation, demo and course enquiries submitted through
              the website.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Total Submissions
              </p>

              <p className="mt-1 text-2xl font-black leading-none text-slate-900">
                {enquiries.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          CONTENT
      ========================= */}
      <div className="p-4 sm:p-6">
        {error ? (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 sm:flex-row sm:items-center">
            <XCircle className="h-5 w-5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => void fetchEnquiries()}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
            >
              Refresh
            </button>
          </div>
        ) : null}

        {enquiries.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <Mail className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              No enquiries yet
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-500">
              New website enquiries will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {enquiries.map((enquiry, index) => {
              const hasSuggestions = Boolean(enquiry.suggestedCourses?.length);

              const id = enquiry.id ?? `${enquiry.contact}-${index}`;

              const initial = enquiry.name?.charAt(0).toUpperCase() || "?";

              const isUpdating = updatingId === enquiry.id;

              return (
                <article
                  key={id}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_45px_-24px_rgba(37,99,235,0.35)]"
                >
                  {/* TOP ACCENT */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

                  <div className="p-5 sm:p-6">
                    {/* =========================
                          PERSON + STATUS
                      ========================= */}
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-xl font-black text-blue-700 shadow-inner">
                          {initial}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="min-w-0 truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                              {enquiry.name}
                            </h3>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${requestTypeClasses(
                                enquiry,
                              )}`}
                            >
                              {requestTypeLabel(enquiry)}
                            </span>
                          </div>

                          {/* CONTACT META */}
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5 text-xs font-semibold text-slate-500 sm:text-sm">
                            <span className="inline-flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-400" />

                              {enquiry.role || "student"}
                            </span>

                            <span className="inline-flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />

                              {enquiry.contact}
                            </span>

                            {enquiry.email ? (
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                                <span className="truncate">
                                  {enquiry.email}
                                </span>
                              </span>
                            ) : null}

                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />

                              {formatCreatedAt(enquiry.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* STATUS ACTION */}
                      <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:w-[250px] xl:flex-col">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Status
                          </p>

                          <span
                            className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                              enquiry.status,
                            )}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${statusDotClasses(
                                enquiry.status,
                              )}`}
                            />

                            {enquiry.status}
                          </span>
                        </div>

                        {enquiry.status === "new" ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              void updateStatus(enquiry, "contacted")
                            }
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                          >
                            <CheckCircle className="h-4 w-4" />

                            {isUpdating ? "Updating..." : "Mark Contacted"}
                          </button>
                        ) : (
                          <div className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                            <CheckCircle className="h-4 w-4" />

                            {enquiry.status === "contacted"
                              ? "Contacted"
                              : enquiry.status === "enrolled"
                                ? "Enrolled"
                                : "Closed"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* =========================
                          COURSE INTEREST
                      ========================= */}
                    <div className="mt-5 rounded-[22px] border border-blue-100 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <BookOpen className="h-4 w-4" />
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                          Course Interest
                        </p>
                      </div>

                      <p className="mt-3 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                        {enquiry.courseTitle || "Not specified"}
                      </p>

                      {enquiry.message ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 shadow-sm">
                          <p className="text-sm font-medium italic leading-6 text-slate-600">
                            &ldquo;
                            {enquiry.message}
                            &rdquo;
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm font-medium text-slate-400">
                          No message provided.
                        </div>
                      )}
                    </div>

                    {/* =========================
                          DETAILS
                      ========================= */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
                          Branch
                        </p>

                        <p className="mt-2 text-base font-black text-slate-900">
                          {enquiry.branch || "Not selected"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
                          Preferred Date
                        </p>

                        <p className="mt-2 text-base font-black text-slate-900">
                          {formatPreferredDate(enquiry.preferredDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
                          Preferred Time
                        </p>

                        <p className="mt-2 inline-flex items-center gap-2 text-base font-black text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" />

                          {formatPreferredTime(enquiry.preferredTime)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
                          Source
                        </p>

                        <p className="mt-2 text-base font-black capitalize text-slate-900">
                          {enquiry.source
                            ? enquiry.source.replace(/-/g, " ")
                            : "Website"}
                        </p>
                      </div>
                    </div>

                    {/* =========================
                          SUGGESTED COURSES
                      ========================= */}
                    {hasSuggestions ? (
                      <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />

                          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-purple-700">
                            Also Interested In
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {enquiry.suggestedCourses!.map((suggestion) => (
                            <span
                              key={suggestion.standardKey}
                              className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-[10px] font-black text-purple-700 shadow-sm"
                            >
                              {suggestion.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
