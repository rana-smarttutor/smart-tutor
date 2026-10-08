
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

type Academic = {
  level?: string;
  institution?: string;
  board?: string;
  year?: string;
  marks?: string;
};

type Application = {
  applicationId: string;
  name: string;
  course: string;
  exam: string;
  programme: string;
  mobile: string;
  email: string;
  city: string;
  qualification: string;
  status: string;
  submittedAt: string;
  createdByName?: string;
  createdByRole?: string;
  academics?: Academic[];
};

type Stats = {
  total: number;
  submitted: number;
  inReview: number;
  completed: number;
};

const EMPTY_STATS: Stats = {
  total: 0,
  submitted: 0,
  inReview: 0,
  completed: 0,
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  if (status === "submitted") return "Submitted";

  if (
    ["in-review", "under-review", "in_progress"].includes(
      status,
    )
  ) {
    return "In Review";
  }

  if (
    ["completed", "approved", "admitted"].includes(status)
  ) {
    return "Completed";
  }

  return status || "Unknown";
}

export function AdmissionManagement() {
  const [applications, setApplications] = useState<
    Application[]
  >([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admission", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const result = (await response.json()) as {
          applications?: Application[];
          stats?: Stats;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to load applications.",
          );
        }

        if (controller.signal.aborted) return;

        setApplications(result.applications ?? []);
        setStats(result.stats ?? EMPTY_STATS);
      } catch (cause) {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load applications.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadApplications();

    return () => controller.abort();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return applications;

    return applications.filter((application) =>
      [
        application.applicationId,
        application.name,
        application.course,
        application.exam,
        application.mobile,
        application.email,
        application.city,
      ].some((value) =>
        (value || "").toLowerCase().includes(query),
      ),
    );
  }, [applications, search]);

  const summary = [
    {
      label: "Total Applications",
      value: stats.total,
      color: "text-blue-700",
    },
    {
      label: "New Applications",
      value: stats.submitted,
      color: "text-violet-700",
    },
    {
      label: "In Review",
      value: stats.inReview,
      color: "text-amber-700",
    },
    {
      label: "Completed",
      value: stats.completed,
      color: "text-emerald-700",
    },
  ];

  return (
    <div className="space-y-7 pb-8">
      {/* HERO — MATCHES CAREER COUNSELLING */}

      <section className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#07173B] via-[#1546A8] to-[#2863EB] px-7 py-9 text-white shadow-lg sm:px-10">
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-100">
              <Sparkles size={16} />
              SmartIQ Institute
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Admission Management
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">
              Manage student admission applications,
              track submitted records and create new
              admission forms for prospective students.
            </p>
          </div>

          <Link
            href="/dashboard/admissions/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#0B40A1] shadow-sm transition hover:bg-blue-50"
          >
            <Plus size={19} />
            New Form
          </Link>
        </div>
      </section>

      {/* FOUR SUMMARY CARDS */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>

            <p
              className={`mt-4 text-3xl font-black ${item.color}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* APPLICATION RECORDS */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Admission Applications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View student admission records submitted
              by the admissions team.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshKey((current) => current + 1)
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="p-5">
          {/* SEARCH */}

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <Search
              size={20}
              className="shrink-0 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student, application ID, course, mobile or email..."
              className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500">
              <RefreshCw
                size={20}
                className="animate-spin"
              />
              Loading admission applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ClipboardList size={32} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {search
                  ? "No matching applications"
                  : "No admission applications yet"}
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                {search
                  ? "Try a different student name, ID or course."
                  : "Create your first admission form to start building the admission register."}
              </p>

              {!search && (
                <Link
                  href="/dashboard/admissions/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white"
                >
                  <Plus size={17} />
                  New Form
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {filtered.map((application) => {
                const expanded =
                  expandedId === application.applicationId;

                return (
                  <article
                    key={application.applicationId}
                    className="overflow-hidden rounded-xl border border-slate-200"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <UserRound size={24} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-900">
                            {application.name || "Student"}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {application.course} ·{" "}
                            {application.exam}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-400">
                            {application.applicationId}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          {statusLabel(application.status)}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatDate(application.submittedAt)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expanded
                                ? null
                                : application.applicationId,
                            )
                          }
                          aria-expanded={expanded}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-xs font-bold text-white hover:bg-[#082F79]"
                        >
                          <FileText size={15} />
                          {expanded ? "Hide Details" : "View Details"}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-5">
                        <div className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          {[
                            ["Programme", application.programme],
                            ["Qualification", application.qualification],
                            ["Mobile", application.mobile],
                            ["Email", application.email],
                            ["City", application.city],
                            ["Submitted By", application.createdByName],
                            ["Employee Role", application.createdByRole],
                            ["Submitted On", formatDate(application.submittedAt)],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <p className="text-xs text-slate-500">
                                {label}
                              </p>

                              <p className="mt-1 break-words font-semibold text-slate-900">
                                {value || "—"}
                              </p>
                            </div>
                          ))}
                        </div>

                        {application.academics?.length ? (
                          <div className="mt-5 border-t border-slate-200 pt-4">
                            <h4 className="mb-3 text-sm font-black text-slate-900">
                              Academic Records
                            </h4>

                            <div className="space-y-2">
                              {application.academics.map(
                                (record, index) => (
                                  <div
                                    key={index}
                                    className="rounded-lg bg-white p-3 text-xs text-slate-700"
                                  >
                                    <strong>{record.level}</strong>
                                    {" · "}
                                    {record.institution}
                                    {" · "}
                                    {record.board}
                                    {" · "}
                                    {record.year}
                                    {record.marks
                                      ? ` · ${record.marks}`
                                      : ""}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!loading && applications.length > 0 && (
            <p className="mt-5 flex items-center gap-1 text-xs text-slate-400">
              <ArrowRight size={13} />
              Showing up to 200 latest applications.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
