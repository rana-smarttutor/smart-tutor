"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Pencil,
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
  linkedStudentId?: string | null;
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
  correctionRequest?: { reason?: string; requestedAt?: string };
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
  switch (status) {
    case "pending_student_approval":
      return "Pending Student Approval";
    case "approved":
      return "Approved";
    case "pending_guardian_approval":
      return "Pending Guardian Approval";
    case "correction_requested":
      return "Correction Requested";
    case "submitted":
      return "Submitted";
    case "in-review":
    case "under-review":
    case "in_progress":
      return "In Review";
    case "completed":
    case "admitted":
      return "Completed";
    default:
      return status || "Unknown";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "pending_student_approval":
      return "bg-amber-100 text-amber-800";
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "pending_guardian_approval":
      return "bg-violet-100 text-violet-800";
    case "correction_requested":
      return "bg-orange-100 text-orange-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
const CORRECTABLE_FIELDS = [
  ["flat", "Flat / Building"],
  ["street", "Street / Area"],
  ["city", "City"],
  ["state", "State"],
  ["pin", "PIN code"],
  ["fatherName", "Father's name"],
  ["fatherMobile", "Father's mobile"],
  ["fatherEmail", "Father's email"],
  ["motherName", "Mother's name"],
  ["motherMobile", "Mother's mobile"],
  ["motherEmail", "Mother's email"],
  ["emergencyName", "Emergency contact name"],
  ["emergencyRelation", "Emergency relationship"],
  ["emergencyMobile", "Emergency mobile"],
  ["otherQualification", "Other qualification"],
] as const;

const EDIT_FIELDS = [
  ["programme", "Programme"], ["session", "Session"], ["studyMode", "Mode of study"],
  ["medium", "Medium"], ["batchTime", "Preferred batch time"], ["heardFrom", "How they heard about SmartIQ"],
  ["name", "Student full name"], ["email", "Student email"], ["mobile", "Student mobile"], ["flat", "Flat / building"], ["street", "Street / area"],
  ["city", "City"], ["state", "State"], ["pin", "PIN code"],
  ["fatherName", "Father's name"], ["fatherOccupation", "Father's occupation"],
  ["fatherMobile", "Father's mobile"], ["fatherEmail", "Father's email"],
  ["motherName", "Mother's name"], ["motherOccupation", "Mother's occupation"],
  ["motherMobile", "Mother's mobile"], ["motherEmail", "Mother's email"],
  ["contactPreference", "Primary contact"], ["emergencyName", "Emergency contact name"],
  ["emergencyRelation", "Emergency relationship"], ["emergencyMobile", "Emergency mobile"],
] as const;

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [correctionChanges, setCorrectionChanges] = useState<Record<string, string>>({});
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState("");
  const [correctionNotice, setCorrectionNotice] = useState("");
  const [canLink, setCanLink] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editingUnlinked, setEditingUnlinked] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [editNotice, setEditNotice] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkCandidate, setLinkCandidate] = useState<{ id: string; name: string; email: string } | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkNotice, setLinkNotice] = useState("");

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

        // Correction reasons live in the separate authorized correction API.
        // Do not hide the main admissions list if that secondary call fails.
        let correctionMap = new Map<string, Application["correctionRequest"]>();
        try {
          const correctionResponse = await fetch("/api/admission/corrections/resolve", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          });
          if (correctionResponse.ok) {
            const correctionResult = (await correctionResponse.json()) as {
              applications?: Application[];
            };
            correctionMap = new Map(
              (correctionResult.applications ?? []).map((item) => [
                item.applicationId,
                item.correctionRequest,
              ]),
            );
          }
        } catch (secondaryError) {
          if (controller.signal.aborted) return;
          console.error("Unable to fetch admission correction reasons", secondaryError);
        }

        if (controller.signal.aborted) return;

        setApplications(
          (result.applications ?? []).map((item) => ({
            ...item,
            correctionRequest: correctionMap.get(item.applicationId),
          })),
        );
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

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admission/link-student/candidates?probe=1", {
      cache: "no-store", credentials: "same-origin", signal: controller.signal,
    }).then((response) => {
      if (!controller.signal.aborted) setCanLink(response.ok);
    }).catch(() => {
      if (!controller.signal.aborted) setCanLink(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admission/edit", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then((response) => { if (!controller.signal.aborted) setCanEdit(response.ok); })
      .catch(() => { if (!controller.signal.aborted) setCanEdit(false); });
    return () => controller.abort();
  }, []);

  async function beginEdit(applicationId: string) {
    setEditError("");
    setEditNotice("");
    setEditBusy(true);
    try {
      const response = await fetch(`/api/admission/edit?applicationId=${encodeURIComponent(applicationId)}`, {
        cache: "no-store", credentials: "same-origin",
      });
      const result = (await response.json()) as { application?: Record<string, unknown>; error?: string };
      if (!response.ok || !result.application) throw new Error(result.error || "Unable to load editable details.");
      setEditValues(Object.fromEntries(EDIT_FIELDS.map(([key]) => [key, String(result.application?.[key] ?? "")])));
      setEditingUnlinked(!result.application?.linkedStudentId);
      setEditId(applicationId);
      setExpandedId(applicationId);
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : "Unable to load editable details.");
    } finally { setEditBusy(false); }
  }

  async function saveEdit(applicationId: string) {
    if (editBusy) return;
    setEditBusy(true);
    setEditError("");
    try {
      const response = await fetch("/api/admission/edit", {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, changes: editingUnlinked ? editValues : Object.fromEntries(Object.entries(editValues).filter(([key]) => key !== "name" && key !== "email")) }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save admission changes.");
      setEditId(null);
      setEditNotice("Application updated. The student must review the latest details before approval.");
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : "Unable to save admission changes.");
    } finally { setEditBusy(false); }
  }

  async function findLinkCandidate(applicationId: string) {
    setLinkingId(applicationId);
    setLinkCandidate(null);
    setLinkError("");
    setLinkNotice("");
    setLinkBusy(true);
    try {
      const response = await fetch(
        `/api/admission/link-student/candidates?applicationId=${encodeURIComponent(applicationId)}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      const result = (await response.json()) as {
        candidate?: { id: string; name: string; email: string } | null;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Unable to find student account.");
      if (!result.candidate) throw new Error("No uniquely matching active student account. Check the student's name, email/mobile and account status in Admin Users.");
      setLinkCandidate(result.candidate);
    } catch (cause) {
      setLinkError(cause instanceof Error ? cause.message : "Student lookup failed.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function confirmStudentLink(applicationId: string, studentId: string) {
    if (linkBusy) return;
    setLinkBusy(true);
    setLinkError("");
    try {
      const response = await fetch("/api/admission/link-student", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, studentId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to link admission.");
      setLinkingId(null);
      setLinkCandidate(null);
      setLinkNotice("Student account linked. Ask the student to refresh My Admission.");
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setLinkError(cause instanceof Error ? cause.message : "Unable to link admission.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function submitCorrection(applicationId: string) {
    if (savingCorrection) return;
    const changes = Object.fromEntries(
      Object.entries(correctionChanges)
        .filter(([field, value]) =>
          CORRECTABLE_FIELDS.some(([name]) => name === field) && value.trim().length > 0,
        )
        .map(([field, value]) => [field, value.trim()]),
    );
    if (Object.keys(changes).length === 0) {
      setCorrectionError("Enter at least one corrected value.");
      return;
    }
    setSavingCorrection(true);
    setCorrectionError("");
    setCorrectionNotice("");
    try {
      const response = await fetch("/api/admission/corrections/resolve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ applicationId, changes }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save corrections.");
      setEditingId(null);
      setCorrectionChanges({});
      setCorrectionNotice("Corrections saved. The application is pending student approval again.");
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setCorrectionError(cause instanceof Error ? cause.message : "Unable to save corrections.");
    } finally {
      setSavingCorrection(false);
    }
  }

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

  const pendingCount = applications.filter(
    (a) =>
      a.status === "pending_student_approval" ||
      a.status === "submitted"
  ).length;

  const approvedCount = applications.filter(
    (a) => a.status === "approved"
  ).length;

  const correctionCount = applications.filter(
    (a) => a.status === "correction_requested"
  ).length;

  const summary = [
    {
      label: "Total Applications",
      value: stats.total,
      color: "text-blue-700",
    },
    {
      label: "Pending Student Approval",
      value: pendingCount,
      color: "text-amber-700",
    },
    {
      label: "Correction Requested",
      value: correctionCount,
      color: "text-orange-700",
    },
    {
      label: "Approved",
      value: approvedCount,
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

          {linkNotice && (
            <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{linkNotice}</p>
          )}

          {editNotice && (
            <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{editNotice}</p>
          )}
          {editError && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{editError}</p>
          )}
          {correctionNotice && (
            <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {correctionNotice}
            </p>
          )}

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
                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusColor(application.status)}`}>
                          {statusLabel(application.status)}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatDate(application.submittedAt)}
                        </span>

                        {canEdit && ["pending_student_approval", "correction_requested", "submitted"].includes(application.status) && (
                          <button type="button" disabled={editBusy}
                            onClick={() => void beginEdit(application.applicationId)}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                            <Pencil size={15} /> Edit Application
                          </button>
                        )}
                        {application.status === "approved" && (
                          <a
                            href={`/api/admission/pdf?applicationId=${encodeURIComponent(application.applicationId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                          >
                            <FileText size={15} /> View Admission PDF
                          </a>
                        )}
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

                         <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                           <p className="text-xs font-semibold text-slate-700">Student account link</p>
                           {application.linkedStudentId ? (
                             <p className="mt-2 text-sm font-bold text-emerald-700">Linked to student account</p>
                           ) : (
                             <>
                               <p className="mt-2 text-sm text-amber-700">Not linked — student cannot view this admission yet.</p>
                               {canLink && (
                                 <button type="button" disabled={linkBusy} onClick={() => void findLinkCandidate(application.applicationId)}
                                   className="mt-3 rounded-lg bg-[#0B40A1] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                                   Find &amp; Link Student
                                 </button>
                               )}
                             </>
                           )}
                           {linkingId === application.applicationId && !application.linkedStudentId && (
                             <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                               {linkBusy && <p className="text-sm">Checking registered student account...</p>}
                               {linkError && <p role="alert" className="text-sm text-red-700">{linkError}</p>}
                               {linkCandidate && (
                                 <div className="space-y-2">
                                   <p className="text-sm font-semibold">Confirm this is the correct account:</p>
                                   <p className="break-words text-sm">{linkCandidate.name} · {linkCandidate.email}</p>
                                   <button type="button" disabled={linkBusy}
                                     onClick={() => void confirmStudentLink(application.applicationId, linkCandidate.id)}
                                     className="rounded-lg bg-[#0B40A1] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                                     Confirm Link
                                   </button>
                                 </div>
                               )}
                               <button type="button" disabled={linkBusy} onClick={() => { setLinkingId(null); setLinkCandidate(null); setLinkError(""); }}
                                 className="ml-3 text-sm text-slate-600 underline disabled:opacity-50">Cancel</button>
                             </div>
                           )}
                         </div>

                        {application.status === "correction_requested" && (
                          <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                            <h4 className="text-sm font-black text-orange-900">Student correction request</h4>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-orange-900">
                              {application.correctionRequest?.reason || "Correction details unavailable. Refresh or contact the student."}
                            </p>
                            {application.correctionRequest?.requestedAt && (
                              <p className="mt-1 text-xs text-orange-700">
                                Requested {formatDate(application.correctionRequest.requestedAt)}
                              </p>
                            )}
                            {editingId !== application.applicationId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(application.applicationId);
                                  setCorrectionChanges({});
                                  setCorrectionError("");
                                }}
                                className="mt-4 rounded-lg bg-[#0B40A1] px-4 py-2 text-sm font-bold text-white hover:bg-[#082F79]"
                              >
                                Edit Correction
                              </button>
                            ) : (
                              <div className="mt-4 rounded-xl border border-orange-200 bg-white p-4">
                                <p className="text-sm text-slate-600">
                                  Fill in only the fields that need changing. Leave all other fields blank.
                                  Name, registered email and student ID cannot be changed here.
                                </p>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  {CORRECTABLE_FIELDS.map(([field, label]) => (
                                    <label key={field} className="block text-xs font-semibold text-slate-700">
                                      {label}
                                      <input
                                        type="text"
                                        value={correctionChanges[field] ?? ""}
                                        onChange={(event) => {
                                          setCorrectionChanges((current) => ({ ...current, [field]: event.target.value }));
                                          setCorrectionError("");
                                        }}
                                        maxLength={500}
                                        placeholder={`New ${label.toLowerCase()}`}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      />
                                    </label>
                                  ))}
                                </div>
                                {correctionError && (
                                  <p role="alert" className="mt-3 text-sm font-medium text-red-700">{correctionError}</p>
                                )}
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={savingCorrection}
                                    onClick={() => void submitCorrection(application.applicationId)}
                                    className="rounded-lg bg-[#0B40A1] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                                  >
                                    {savingCorrection ? "Saving..." : "Save Corrections & Return to Student"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingCorrection}
                                    onClick={() => { setEditingId(null); setCorrectionChanges({}); setCorrectionError(""); }}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {editId === application.applicationId && (
                          <section className="mt-5 rounded-xl border border-blue-200 bg-white p-5">
                            <h4 className="text-base font-black text-slate-900">Edit admission details</h4>
                            <p className="mt-2 text-xs text-slate-600">Changes will return the application to student approval. Name and email can be corrected only while unlinked. Date of birth and academic history cannot be changed here. After correcting identity details, Admin must verify and link the real student account.</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {EDIT_FIELDS.map(([key, label]) => (
                                <label key={key} className="block text-xs font-semibold text-slate-700">
                                  {label}{(key === "name" || key === "email") && !editingUnlinked ? " (locked after linking)" : ""}
                                  <input type="text" disabled={(key === "name" || key === "email") && !editingUnlinked} value={editValues[key] ?? ""}
                                    onChange={(event) => setEditValues((old) => ({ ...old, [key]: event.target.value }))}
                                    maxLength={key === "flat" || key === "street" ? 500 : 250}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                </label>
                              ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button type="button" disabled={editBusy} onClick={() => void saveEdit(application.applicationId)}
                                className="rounded-lg bg-[#0B40A1] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{editBusy ? "Saving..." : "Save Changes"}</button>
                              <button type="button" disabled={editBusy} onClick={() => { setEditId(null); setEditError(""); }}
                                className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button>
                            </div>
                          </section>
                        )}

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
