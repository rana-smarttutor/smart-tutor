"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  PlacementApplication,
  PlacementApplicationQuestion,
  PlacementApplicationStatus,
  PlacementJob,
  PlacementJobStatus,
  PlacementJobType,
} from "@/lib/types";

type JobDraft = {
  company: string;
  role: string;
  location: string;
  salary: string;
  eligibility: string;
  jobType: PlacementJobType;
  deadline: string;
  description: string;
  skillsText: string;
  status: PlacementJobStatus;
  applicationQuestions: PlacementApplicationQuestion[];
};

const JOB_TYPES: { value: PlacementJobType; label: string }[] = [
  { value: "full-time", label: "Full Time" },
  { value: "internship", label: "Internship" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
];

const APPLICATION_STATUSES: PlacementApplicationStatus[] = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 14);

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function createEmptyDraft(): JobDraft {
  return {
    company: "",
    role: "",
    location: "",
    salary: "",
    eligibility: "",
    jobType: "full-time",
    deadline: getDefaultDeadline(),
    description: "",
    skillsText: "",
    status: "draft",
    applicationQuestions: [],
  };
}

function formatDate(value: string) {
  const parsedDate = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function jobStatusClass(status: PlacementJobStatus) {
  const classes: Record<PlacementJobStatus, string> = {
    draft: "border-amber-300/40 bg-amber-500/10 text-amber-700",
    published: "border-emerald-300/40 bg-emerald-500/10 text-emerald-700",
    closed: "border-slate-300/50 bg-slate-500/10 text-slate-600",
  };

  return classes[status];
}

function applicationStatusClass(status: PlacementApplicationStatus) {
  const classes: Record<PlacementApplicationStatus, string> = {
    applied: "border-blue-300/40 bg-blue-500/10 text-blue-700",
    shortlisted: "border-violet-300/40 bg-violet-500/10 text-violet-700",
    interview: "border-amber-300/40 bg-amber-500/10 text-amber-700",
    selected: "border-emerald-300/40 bg-emerald-500/10 text-emerald-700",
    rejected: "border-rose-300/40 bg-rose-500/10 text-rose-700",
  };

  return classes[status];
}

export function PlacementJobsManager() {
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");

  const [jobs, setJobs] = useState<PlacementJob[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);

  const [draft, setDraft] = useState<JobDraft>(createEmptyDraft());
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    string | null
  >(null);

  const [applicationNotes, setApplicationNotes] = useState<
    Record<string, string>
  >({});

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const publishedJobs = useMemo(
    () => jobs.filter((job) => job.status === "published").length,
    [jobs],
  );

  const pendingApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === "applied" ||
          application.status === "shortlisted",
      ).length,
    [applications],
  );

  useEffect(() => {
    void refreshWorkspace();
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  async function refreshWorkspace() {
    setIsLoading(true);

    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        fetch("/api/placement-jobs?scope=admin", {
          cache: "no-store",
          credentials: "same-origin",
        }),
        fetch("/api/placement-applications", {
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);

      const jobsPayload = (await jobsResponse.json()) as {
        jobs?: PlacementJob[];
        error?: string;
      };

      const applicationsPayload = (await applicationsResponse.json()) as {
        applications?: PlacementApplication[];
        error?: string;
      };

      if (!jobsResponse.ok) {
        throw new Error(jobsPayload.error || "Unable to load placement jobs.");
      }

      if (!applicationsResponse.ok) {
        throw new Error(
          applicationsPayload.error || "Unable to load applications.",
        );
      }

      setJobs(jobsPayload.jobs || []);
      setApplications(applicationsPayload.applications || []);
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to load placement workspace.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function openNewJobForm() {
    setEditingJobId(null);
    setDraft(createEmptyDraft());
    setIsFormOpen(true);
  }

  function openEditJobForm(job: PlacementJob) {
    setEditingJobId(job.id);

    setDraft({
      company: job.company,
      role: job.role,
      location: job.location,
      salary: job.salary || "",
      eligibility: job.eligibility || "",
      jobType: job.jobType,
      deadline: job.deadline,
      description: job.description,
      skillsText: job.skills.join(", "),
      status: job.status,
      applicationQuestions: job.applicationQuestions || [],
    });

    setIsFormOpen(true);
  }

  function closeJobForm() {
    setEditingJobId(null);
    setDraft(createEmptyDraft());
    setIsFormOpen(false);
  }

  function updateDraft<K extends keyof JobDraft>(
    key: K,
    value: JobDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function addApplicationQuestion() {
    updateDraft("applicationQuestions", [
      ...draft.applicationQuestions,
      {
        id: `new-question-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        label: "",
        required: false,
      },
    ]);
  }

  function updateApplicationQuestion(
    questionId: string,
    updates: Partial<PlacementApplicationQuestion>,
  ) {
    updateDraft(
      "applicationQuestions",
      draft.applicationQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              ...updates,
            }
          : question,
      ),
    );
  }

  function removeApplicationQuestion(questionId: string) {
    updateDraft(
      "applicationQuestions",
      draft.applicationQuestions.filter(
        (question) => question.id !== questionId,
      ),
    );
  }

  async function saveJob() {
    if (
      !draft.company.trim() ||
      !draft.role.trim() ||
      !draft.location.trim() ||
      !draft.deadline ||
      !draft.description.trim()
    ) {
      showMessage(
        "error",
        "Company, role, location, deadline, and description are required.",
      );
      return;
    }

    const payload = {
      company: draft.company,
      role: draft.role,
      location: draft.location,
      salary: draft.salary,
      eligibility: draft.eligibility,
      jobType: draft.jobType,
      deadline: draft.deadline,
      description: draft.description,
      skills: draft.skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      status: draft.status,
      applicationQuestions: draft.applicationQuestions
        .filter((question) => question.label.trim())
        .map((question) => ({
          ...question,
          label: question.label.trim(),
        })),
    };

    setIsSaving(true);

    try {
      const response = await fetch(
        editingJobId
          ? `/api/placement-jobs/${editingJobId}`
          : "/api/placement-jobs",
        {
          method: editingJobId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json()) as {
        job?: PlacementJob;
        error?: string;
      };

      if (!response.ok || !result.job) {
        throw new Error(result.error || "Unable to save placement job.");
      }

      await refreshWorkspace();
      closeJobForm();

      showMessage(
        "success",
        editingJobId
          ? "Placement job updated."
          : result.job.status === "published"
            ? "Placement job published."
            : "Placement job saved as draft.",
      );
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to save placement job.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function changeJobStatus(
    job: PlacementJob,
    status: PlacementJobStatus,
  ) {
    try {
      const response = await fetch(`/api/placement-jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = (await response.json()) as {
        job?: PlacementJob;
        error?: string;
      };

      if (!response.ok || !result.job) {
        throw new Error(result.error || "Unable to update placement job.");
      }

      setJobs((current) =>
        current.map((currentJob) =>
          currentJob.id === result.job?.id ? result.job : currentJob,
        ),
      );

      showMessage("success", `Job marked ${status}.`);
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to update placement job.",
      );
    }
  }

  async function deleteJob(job: PlacementJob) {
    const shouldDelete = window.confirm(
      `Delete ${job.role} at ${job.company}? All related student applications will also be deleted.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/placement-jobs/${job.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete placement job.");
      }

      setJobs((current) => current.filter((item) => item.id !== job.id));
      setApplications((current) =>
        current.filter((application) => application.jobId !== job.id),
      );

      showMessage("success", "Placement job deleted.");
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to delete placement job.",
      );
    }
  }

  async function updateApplicationStatus(
    application: PlacementApplication,
    status: PlacementApplicationStatus,
  ) {
    setUpdatingApplicationId(application.id);

    try {
      const response = await fetch(
        `/api/placement-applications/${application.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            statusNote: applicationNotes[application.id] || "",
          }),
        },
      );

      const result = (await response.json()) as {
        application?: PlacementApplication;
        error?: string;
      };

      if (!response.ok || !result.application) {
        throw new Error(
          result.error || "Unable to update placement application.",
        );
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === result.application?.id ? result.application : item,
        ),
      );

      showMessage(
        "success",
        `${application.studentName}'s application was updated.`,
      );
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to update placement application.",
      );
    } finally {
      setUpdatingApplicationId(null);
    }
  }

  return (
    <section className="space-y-6">
      {message ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
            message.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700"
              : "border-rose-400/30 bg-rose-500/10 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <article className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">Career Operations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
              Placement Jobs
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
              Publish job opportunities, receive student applications, and
              manage every placement stage from one workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewJobForm}
            className="action-button shrink-0 px-5 py-3"
          >
            + New Placement Job
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="surface-soft rounded-3xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Total jobs
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-heading)]">
              {jobs.length}
            </p>
          </div>

          <div className="surface-soft rounded-3xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Published
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-600">
              {publishedJobs}
            </p>
          </div>

          <div className="surface-soft rounded-3xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Pending applications
            </p>
            <p className="mt-3 text-3xl font-semibold text-blue-600">
              {pendingApplications}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
              activeTab === "jobs"
                ? "bg-[var(--color-accent)] text-white"
                : "surface-soft text-[var(--color-heading)]"
            }`}
          >
            Jobs ({jobs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
              activeTab === "applications"
                ? "bg-[var(--color-accent)] text-white"
                : "surface-soft text-[var(--color-heading)]"
            }`}
          >
            Applications ({applications.length})
          </button>
        </div>
      </article>

      {isFormOpen ? (
        <article className="surface rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-label">
                {editingJobId ? "Edit Job" : "New Job"}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--color-heading)]">
                {editingJobId
                  ? "Update placement opportunity"
                  : "Create placement opportunity"}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeJobForm}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Company *
              </span>
              <input
                value={draft.company}
                onChange={(event) =>
                  updateDraft("company", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="TCS"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Job Role *
              </span>
              <input
                value={draft.role}
                onChange={(event) => updateDraft("role", event.target.value)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Graduate Engineer Trainee"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Location *
              </span>
              <input
                value={draft.location}
                onChange={(event) =>
                  updateDraft("location", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Mumbai / Hybrid"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Job Type *
              </span>
              <select
                value={draft.jobType}
                onChange={(event) =>
                  updateDraft("jobType", event.target.value as PlacementJobType)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {JOB_TYPES.map((jobType) => (
                  <option key={jobType.value} value={jobType.value}>
                    {jobType.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Salary / Stipend
              </span>
              <input
                value={draft.salary}
                onChange={(event) =>
                  updateDraft("salary", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="₹4.5–6 LPA"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Application Deadline *
              </span>
              <input
                type="date"
                value={draft.deadline}
                onChange={(event) =>
                  updateDraft("deadline", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </label>

            <label className="grid gap-2 md:col-span-2 xl:col-span-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Eligibility
              </span>
              <textarea
                value={draft.eligibility}
                onChange={(event) =>
                  updateDraft("eligibility", event.target.value)
                }
                className="min-h-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="B.Tech / BCA / MCA students, minimum 60%, no active backlogs..."
              />
            </label>

            <label className="grid gap-2 md:col-span-2 xl:col-span-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Job Description *
              </span>
              <textarea
                value={draft.description}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                className="min-h-36 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Describe the role, responsibilities, hiring process, and what the company expects..."
              />
            </label>

            <label className="grid gap-2 md:col-span-2 xl:col-span-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Skills
              </span>
              <input
                value={draft.skillsText}
                onChange={(event) =>
                  updateDraft("skillsText", event.target.value)
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Java, Python, Communication, SQL"
              />
            </label>
          </div>

          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-heading)]">
                  Application Questions
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Add questions students must answer before applying.
                </p>
              </div>

              <button
                type="button"
                onClick={addApplicationQuestion}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
              >
                + Add Question
              </button>
            </div>

            {draft.applicationQuestions.length ? (
              <div className="mt-5 space-y-3">
                {draft.applicationQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="surface-soft flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center"
                  >
                    <span className="text-sm font-bold text-[var(--color-muted)]">
                      {index + 1}.
                    </span>

                    <input
                      value={question.label}
                      onChange={(event) =>
                        updateApplicationQuestion(question.id, {
                          label: event.target.value,
                        })
                      }
                      className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none focus:border-blue-500"
                      placeholder="Example: Why are you suitable for this role?"
                    />

                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) =>
                          updateApplicationQuestion(question.id, {
                            required: event.target.checked,
                          })
                        }
                      />
                      Required
                    </label>

                    <button
                      type="button"
                      onClick={() => removeApplicationQuestion(question.id)}
                      className="text-sm font-semibold text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                updateDraft("status", "draft");
                window.setTimeout(() => void saveJob(), 0);
              }}
              disabled={isSaving}
              className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-bold text-[var(--color-heading)] disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => {
                updateDraft("status", "published");
                window.setTimeout(() => void saveJob(), 0);
              }}
              disabled={isSaving}
              className="action-button px-5 py-3 disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : editingJobId
                  ? "Save & Publish"
                  : "Publish Job"}
            </button>
          </div>
        </article>
      ) : null}

      {activeTab === "jobs" ? (
        <section className="space-y-4">
          {isLoading ? (
            <div className="surface rounded-[2rem] p-8 text-sm text-[var(--color-muted)]">
              Loading placement jobs...
            </div>
          ) : jobs.length ? (
            jobs.map((job) => (
              <article
                key={job.id}
                className="surface rounded-[2rem] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${jobStatusClass(
                          job.status,
                        )}`}
                      >
                        {job.status}
                      </span>

                      <span className="text-sm text-[var(--color-muted)]">
                        Deadline: {formatDate(job.deadline)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold text-[var(--color-heading)]">
                      {job.role}
                    </h3>

                    <p className="mt-1 text-base font-medium text-blue-600">
                      {job.company} · {job.location}
                    </p>

                    <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-[var(--color-muted)]">
                      {job.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="pill">{job.jobType}</span>

                      {job.salary ? <span className="pill">{job.salary}</span> : null}

                      {job.skills.map((skill) => (
                        <span key={skill} className="pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-56 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => openEditJobForm(job)}
                      className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
                    >
                      Edit
                    </button>

                    {job.status !== "published" ? (
                      <button
                        type="button"
                        onClick={() => void changeJobStatus(job, "published")}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Publish
                      </button>
                    ) : null}

                    {job.status === "published" ? (
                      <button
                        type="button"
                        onClick={() => void changeJobStatus(job, "closed")}
                        className="rounded-full border border-amber-300 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700"
                      >
                        Close
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void deleteJob(job)}
                      className="rounded-full border border-rose-300 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="surface rounded-[2rem] p-10 text-center">
              <h3 className="text-xl font-semibold text-[var(--color-heading)]">
                No placement jobs yet
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Create a placement job and publish it for students.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "applications" ? (
        <section className="space-y-4">
          {isLoading ? (
            <div className="surface rounded-[2rem] p-8 text-sm text-[var(--color-muted)]">
              Loading student applications...
            </div>
          ) : applications.length ? (
            applications.map((application) => (
              <article
                key={application.id}
                className="surface rounded-[2rem] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${applicationStatusClass(
                          application.status,
                        )}`}
                      >
                        {application.status}
                      </span>

                      <span className="text-sm text-[var(--color-muted)]">
                        Applied {formatDate(application.createdAt.slice(0, 10))}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-[var(--color-heading)]">
                      {application.studentName}
                    </h3>

                    <p className="mt-1 text-sm text-blue-600">
                      Applied for {application.jobRole} at {application.company}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="surface-soft rounded-2xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                          Contact
                        </p>
                        <p className="mt-2 break-words text-sm font-medium text-[var(--color-heading)]">
                          {application.phone}
                        </p>
                        <p className="mt-1 break-words text-sm text-[var(--color-muted)]">
                          {application.studentEmail}
                        </p>
                      </div>

                      <div className="surface-soft rounded-2xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                          Programme
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--color-heading)]">
                          {application.programme}
                        </p>
                      </div>

                      <div className="surface-soft rounded-2xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                          Skills
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--color-heading)]">
                          {application.skills.length
                            ? application.skills.join(", ")
                            : "Not provided"}
                        </p>
                      </div>
                    </div>

                    {application.resumeUrl ? (
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex text-sm font-semibold text-blue-600 underline underline-offset-4"
                      >
                        Open Resume
                      </a>
                    ) : null}

                    {application.experience ? (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                          Experience
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--color-heading)]">
                          {application.experience}
                        </p>
                      </div>
                    ) : null}

                    {application.message ? (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                          Student Message
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--color-heading)]">
                          {application.message}
                        </p>
                      </div>
                    ) : null}

                    {application.answers.length ? (
                      <div className="mt-5 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                          Application Answers
                        </p>

                        {application.answers.map((answer) => (
                          <div
                            key={answer.questionId}
                            className="surface-soft rounded-2xl p-4"
                          >
                            <p className="text-sm font-semibold text-[var(--color-heading)]">
                              {answer.questionLabel}
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-muted)]">
                              {answer.answer || "No answer submitted"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full shrink-0 space-y-3 xl:w-64">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                        Application Status
                      </span>

                      <select
                        value={application.status}
                        onChange={(event) =>
                          void updateApplicationStatus(
                            application,
                            event.target.value as PlacementApplicationStatus,
                          )
                        }
                        disabled={updatingApplicationId === application.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none"
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <textarea
                      value={applicationNotes[application.id] || ""}
                      onChange={(event) =>
                        setApplicationNotes((current) => ({
                          ...current,
                          [application.id]: event.target.value,
                        }))
                      }
                      className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Optional status note for student"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void updateApplicationStatus(
                          application,
                          application.status,
                        )
                      }
                      disabled={updatingApplicationId === application.id}
                      className="action-button w-full px-4 py-3 disabled:opacity-50"
                    >
                      {updatingApplicationId === application.id
                        ? "Updating..."
                        : "Save Status Note"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="surface rounded-[2rem] p-10 text-center">
              <h3 className="text-xl font-semibold text-[var(--color-heading)]">
                No student applications yet
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Applications will appear here after students apply for a job.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}