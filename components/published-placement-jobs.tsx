"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Wallet,
} from "lucide-react";

import type {
  PlacementApplication,
  PlacementApplicationStatus,
  PlacementJob,
} from "@/lib/types";

type ApplicationDraft = {
  phone: string;
  email: string;
  programme: string;
  skillsText: string;
  resumeUrl: string;
  experience: string;
  message: string;
  answers: Record<string, string>;
};

function createApplicationDraft(job: PlacementJob): ApplicationDraft {
  return {
    phone: "",
    email: "",
    programme: "",
    skillsText: "",
    resumeUrl: "",
    experience: "",
    message: "",
    answers: Object.fromEntries(
      job.applicationQuestions.map((question) => [question.id, ""]),
    ),
  };
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatJobType(value: PlacementJob["jobType"]) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatApplicationStatus(status: PlacementApplicationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function isDeadlinePassed(deadline: string) {
  const deadlineDate = new Date(`${deadline}T23:59:59`);

  return (
    !Number.isNaN(deadlineDate.getTime()) &&
    deadlineDate.getTime() < Date.now()
  );
}

function applicationStatusClass(status: PlacementApplicationStatus) {
  const classes: Record<PlacementApplicationStatus, string> = {
    applied: "bg-blue-50 text-blue-700 ring-blue-200",
    shortlisted: "bg-violet-50 text-violet-700 ring-violet-200",
    interview: "bg-amber-50 text-amber-700 ring-amber-200",
    selected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return classes[status];
}

type PlacementJobSort = "newest" | "deadline" | "role" | "company";

const JOB_PAGE_SIZE = 5;

function getPageList(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | "start" | "end")[] = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    pages.push("start");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < total - 1) {
    pages.push("end");
  }

  pages.push(total);

  return pages;
}

export function PublishedPlacementJobs() {
  const [jobs, setJobs] = useState<PlacementJob[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [viewerRole, setViewerRole] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PlacementJob | null>(null);
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<PlacementJobSort>("newest");
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);

  const applicationsByJobId = useMemo(
    () =>
      new Map(
        applications.map((application) => [application.jobId, application]),
      ),
    [applications],
  );

  const visibleJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = query
      ? jobs.filter((job) => {
          const haystack = [
            job.role,
            job.company,
            job.location,
            formatJobType(job.jobType),
            job.description,
            job.eligibility ?? "",
            ...job.skills,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(query);
        })
      : [...jobs];

    filtered.sort((a, b) => {
      if (sortBy === "deadline") {
        return a.deadline.localeCompare(b.deadline);
      }

      if (sortBy === "role") {
        return a.role.localeCompare(b.role);
      }

      if (sortBy === "company") {
        return a.company.localeCompare(b.company);
      }

      return (b.publishedAt ?? b.createdAt).localeCompare(
        a.publishedAt ?? a.createdAt,
      );
    });

    return filtered;
  }, [jobs, searchTerm, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleJobs.length / JOB_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageJobs = visibleJobs.slice(
    (safeCurrentPage - 1) * JOB_PAGE_SIZE,
    safeCurrentPage * JOB_PAGE_SIZE,
  );

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function handleSortChange(value: PlacementJobSort) {
    setSortBy(value);
    setCurrentPage(1);
  }

  function toggleJobExpanded(jobId: string) {
    setExpandedJobIds((current) => {
      const next = new Set(current);

      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }

      return next;
    });
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 5000);
  }

  async function loadJobs() {
    setIsLoading(true);

    try {
      const jobsResponse = await fetch("/api/placement-jobs", {
        cache: "no-store",
        credentials: "same-origin",
      });

      const jobsPayload = (await jobsResponse.json()) as {
        jobs?: PlacementJob[];
        viewerRole?: string | null;
        error?: string;
      };

      if (!jobsResponse.ok) {
        throw new Error(jobsPayload.error || "Unable to load placement jobs.");
      }

      const nextJobs = jobsPayload.jobs || [];
      const nextViewerRole = jobsPayload.viewerRole || null;

      setJobs(nextJobs);
      setViewerRole(nextViewerRole);

      if (nextViewerRole !== "student") {
        setApplications([]);
        return;
      }

      const applicationsResponse = await fetch("/api/placement-applications", {
        cache: "no-store",
        credentials: "same-origin",
      });

      const applicationsPayload = (await applicationsResponse.json()) as {
        applications?: PlacementApplication[];
      };

      if (applicationsResponse.ok) {
        setApplications(applicationsPayload.applications || []);
      }
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to load placement jobs.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function openApplication(job: PlacementJob) {
    if (viewerRole !== "student") {
      return;
    }

    if (applicationsByJobId.has(job.id)) {
      showMessage("error", "You have already applied for this job.");
      return;
    }

    if (isDeadlinePassed(job.deadline)) {
      showMessage("error", "The deadline for this job has passed.");
      return;
    }

    setSelectedJob(job);
    setDraft(createApplicationDraft(job));
  }

  function closeApplication() {
    setSelectedJob(null);
    setDraft(null);
  }

  function updateDraft<K extends keyof ApplicationDraft>(
    key: K,
    value: ApplicationDraft[K],
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  }

  function updateAnswer(questionId: string, answer: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            answers: {
              ...current.answers,
              [questionId]: answer,
            },
          }
        : current,
    );
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedJob || !draft) {
      return;
    }

    if (!draft.phone.trim() || !draft.email.trim() || !draft.programme.trim()) {
      showMessage(
        "error",
        "Phone number, email address, and course/programme are required.",
      );
      return;
    }

    const missingRequiredQuestion = selectedJob.applicationQuestions.find(
      (question) => question.required && !draft.answers[question.id]?.trim(),
    );

    if (missingRequiredQuestion) {
      showMessage(
        "error",
        `Please answer: ${missingRequiredQuestion.label}`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/placement-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          jobId: selectedJob.id,
          phone: draft.phone,
          email: draft.email,
          programme: draft.programme,
          skills: draft.skillsText
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          resumeUrl: draft.resumeUrl,
          experience: draft.experience,
          message: draft.message,
          answers: selectedJob.applicationQuestions.map((question) => ({
            questionId: question.id,
            answer: draft.answers[question.id] || "",
          })),
        }),
      });

      const payload = (await response.json()) as {
        application?: PlacementApplication;
        error?: string;
      };

      if (!response.ok || !payload.application) {
        throw new Error(payload.error || "Unable to submit application.");
      }

      setApplications((current) => [payload.application!, ...current]);
      closeApplication();

      showMessage(
        "success",
        `Application submitted for ${selectedJob.role} at ${selectedJob.company}.`,
      );
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to submit placement application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="find-jobs"
      className="scroll-mt-24 bg-transparent py-16 sm:py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Student Job Portal
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Find your next opportunity.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Explore verified placement opportunities, check eligibility, and
            apply directly through Smart IQ Institute.
          </p>
        </div>

        {message ? (
          <div
            className={`mx-auto mt-8 max-w-4xl rounded-2xl border px-5 py-4 text-sm font-bold ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {viewerRole === "student" && applications.length ? (
          <div className="mx-auto mt-10 max-w-6xl rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  My applications
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Track your placement progress
                </h3>
              </div>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                {applications.length} application
                {applications.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">
                        {application.jobRole}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {application.company}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${applicationStatusClass(
                        application.status,
                      )}`}
                    >
                      {formatApplicationStatus(application.status)}
                    </span>
                  </div>

                  {application.statusNote ? (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {application.statusNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto mt-12 max-w-6xl">
          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
              Loading placement opportunities...
            </div>
          ) : null}

          {!isLoading && !jobs.length ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-950">
                New opportunities are coming soon.
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Check back shortly for published placement openings.
              </p>
            </div>
          ) : null}

          {!isLoading && jobs.length ? (
            <div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block w-full max-w-md">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Search by role, company, location, skill..."
                    className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    Sort by
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        handleSortChange(event.target.value as PlacementJobSort)
                      }
                      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-400"
                    >
                      <option value="newest">Newest first</option>
                      <option value="deadline">Deadline soonest</option>
                      <option value="role">Role A–Z</option>
                      <option value="company">Company A–Z</option>
                    </select>
                  </label>

                  <span className="rounded-full bg-blue-50 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-blue-700">
                    {visibleJobs.length}{" "}
                    {visibleJobs.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                </div>
              </div>

              {visibleJobs.length ? (
                <div className="mt-8 space-y-4">
                  {pageJobs.map((job) => {
                    const existingApplication = applicationsByJobId.get(job.id);
                    const deadlinePassed = isDeadlinePassed(job.deadline);
                    const isExpanded = expandedJobIds.has(job.id);

                    return (
                      <article
                        key={job.id}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => toggleJobExpanded(job.id)}
                          aria-expanded={isExpanded}
                          className="flex w-full items-start justify-between gap-4 p-5 text-left"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                                {formatJobType(job.jobType)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-black ${
                                  deadlinePassed
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {deadlinePassed
                                  ? "Closed"
                                  : `Apply by ${formatDate(job.deadline)}`}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                              {job.role}
                            </h3>

                            <p className="mt-1 text-sm font-bold text-slate-600">
                              {job.company}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {job.location}
                              </span>

                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                                {job.salary || "As per company policy"}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 ${
                              isExpanded
                                ? "rotate-180 border-blue-200 bg-blue-50 text-blue-600"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </button>

                        {!isExpanded ? (
                          <p className="line-clamp-2 whitespace-pre-line px-5 pb-2 text-sm leading-6 text-slate-600">
                            {job.description}
                          </p>
                        ) : (
                          <div className="px-5 pb-4">
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                              {job.description}
                            </p>

                            {job.eligibility ? (
                              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                                  Eligibility
                                </p>
                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                                  {job.eligibility}
                                </p>
                              </div>
                            ) : null}

                            {job.skills.length ? (
                              <div className="mt-4">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                  Required Skills
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {job.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {job.applicationQuestions.length ? (
                              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                                This application includes{" "}
                                {job.applicationQuestions.length} additional{" "}
                                {job.applicationQuestions.length === 1
                                  ? "question"
                                  : "questions"}{" "}
                                to answer.
                              </p>
                            ) : null}
                          </div>
                        )}

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={() => toggleJobExpanded(job.id)}
                            className="inline-flex items-center gap-1.5 self-start text-sm font-black text-blue-600 transition hover:text-blue-700"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                            {isExpanded ? "Hide details" : "View details"}
                          </button>

                          <div className="w-full sm:w-auto">
                            {viewerRole === "student" && existingApplication ? (
                              <div
                                className={`flex items-center justify-between rounded-full px-4 py-2.5 ring-1 ${applicationStatusClass(
                                  existingApplication.status,
                                )}`}
                              >
                                <span className="text-sm font-black">
                                  Application submitted
                                </span>
                                <span className="text-xs font-black">
                                  {formatApplicationStatus(
                                    existingApplication.status,
                                  )}
                                </span>
                              </div>
                            ) : null}

                            {viewerRole === "student" &&
                            !existingApplication &&
                            !deadlinePassed ? (
                              <button
                                type="button"
                                onClick={() => openApplication(job)}
                                className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] sm:w-auto"
                              >
                                Apply Now
                              </button>
                            ) : null}

                            {viewerRole === "student" &&
                            !existingApplication &&
                            deadlinePassed ? (
                              <button
                                type="button"
                                disabled
                                className="w-full cursor-not-allowed rounded-full bg-slate-200 px-6 py-3 text-sm font-black text-slate-500 sm:w-auto"
                              >
                                Application Closed
                              </button>
                            ) : null}

                            {viewerRole && viewerRole !== "student" ? (
                              <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-600">
                                Students can apply through their student account.
                              </div>
                            ) : null}

                            {!viewerRole ? (
                              <Link
                                href="/login?next=%2Fplacements%23find-jobs"
                                className="block w-full rounded-full bg-blue-600 px-6 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] sm:w-auto"
                              >
                                Login as Student to Apply
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    No matching opportunities.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Try a different search term or clear your filters.
                  </p>
                </div>
              )}

              {totalPages > 1 ? (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-2"
                  aria-label="Placement job pages"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((value) => Math.max(1, value - 1))
                    }
                    disabled={safeCurrentPage === 1}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {getPageList(safeCurrentPage, totalPages).map((page) =>
                    page === "start" || page === "end" ? (
                      <span
                        key={page}
                        className="px-1 text-sm font-bold text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={safeCurrentPage === page ? "page" : undefined}
                        className={`h-10 w-10 rounded-full text-sm font-black transition ${
                          safeCurrentPage === page
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((value) => Math.min(totalPages, value + 1))
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {selectedJob && draft ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void submitApplication(event)}
            className="my-8 w-full max-w-3xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                  Apply for placement
                </p>

                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {selectedJob.role}
                </h3>

                <p className="mt-1 text-sm font-bold text-slate-600">
                  {selectedJob.company} · {selectedJob.location}
                </p>
              </div>

              <button
                type="button"
                onClick={closeApplication}
                disabled={isSubmitting}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-600 transition hover:bg-slate-200"
                aria-label="Close application form"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Phone Number *
                </span>
                <input
                  type="tel"
                  required
                  value={draft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                  placeholder="+91 9876543210"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Email Address *
                </span>
                <input
                  type="email"
                  required
                  value={draft.email}
                  onChange={(event) => updateDraft("email", event.target.value)}
                  placeholder="student@email.com"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Course / Programme *
                </span>
                <input
                  required
                  value={draft.programme}
                  onChange={(event) =>
                    updateDraft("programme", event.target.value)
                  }
                  placeholder="B.Tech Computer Science"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Skills
                </span>
                <input
                  value={draft.skillsText}
                  onChange={(event) =>
                    updateDraft("skillsText", event.target.value)
                  }
                  placeholder="Python, SQL, Communication"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Resume Link
                </span>
                <input
                  type="url"
                  value={draft.resumeUrl}
                  onChange={(event) =>
                    updateDraft("resumeUrl", event.target.value)
                  }
                  placeholder="https://drive.google.com/..."
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
                <span className="text-xs text-slate-500">
                  Paste a Google Drive, OneDrive, Dropbox, or portfolio resume
                  link.
                </span>
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Experience / Projects
                </span>
                <textarea
                  value={draft.experience}
                  onChange={(event) =>
                    updateDraft("experience", event.target.value)
                  }
                  placeholder="Internships, projects, certifications, achievements..."
                  className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Message to Recruiter
                </span>
                <textarea
                  value={draft.message}
                  onChange={(event) =>
                    updateDraft("message", event.target.value)
                  }
                  placeholder="Tell the employer why you are interested in this role..."
                  className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>
            </div>

            {selectedJob.applicationQuestions.length ? (
              <div className="mt-7 border-t border-slate-200 pt-6">
                <h4 className="text-lg font-black text-slate-950">
                  Application Questions
                </h4>

                <div className="mt-4 grid gap-4">
                  {selectedJob.applicationQuestions.map((question) => (
                    <label key={question.id} className="grid gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {question.label}
                        {question.required ? " *" : ""}
                      </span>

                      <textarea
                        required={question.required}
                        value={draft.answers[question.id] || ""}
                        onChange={(event) =>
                          updateAnswer(question.id, event.target.value)
                        }
                        className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                        placeholder="Write your answer..."
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeApplication}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}