"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ManagedUser } from "@/lib/types";

type AdmissionApplication = {
  applicationId: string;
  name?: string;
  email?: string;
  mobile?: string;
  course?: string;
  programme?: string;
  status?: string;
  linkedStudentId?: string | null;
  submittedAt?: string;
};

type Props = {
  studentDirectory: ManagedUser[];
};

function normalizeName(value?: string) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeEmail(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeMobile(value?: string) {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

function isVerifiedCandidate(
  application: AdmissionApplication,
  student: ManagedUser,
) {
  if (
    student.role !== "student" ||
    student.status !== "active" ||
    student.verified === false
  ) {
    return false;
  }

  if (
    !normalizeName(application.name) ||
    normalizeName(application.name) !== normalizeName(student.name)
  ) {
    return false;
  }

  const emailMatches =
    Boolean(normalizeEmail(application.email)) &&
    normalizeEmail(application.email) === normalizeEmail(student.email);

  const mobileMatches =
    normalizeMobile(application.mobile).length === 10 &&
    normalizeMobile(application.mobile) === normalizeMobile(student.mobile);

  return emailMatches || mobileMatches;
}

export function AdmissionStudentLinker({ studentDirectory }: Props) {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const students = useMemo(
    () => studentDirectory.filter((student) => student.role === "student"),
    [studentDirectory],
  );

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admission", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = (await response.json()) as {
        applications?: AdmissionApplication[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to load admissions.");
      }

      setApplications(Array.isArray(result.applications) ? result.applications : []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load admissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((application) => {
      if (!query) return true;
      return [
        application.applicationId,
        application.name,
        application.email,
        application.mobile,
      ].some((part) => (part ?? "").toLowerCase().includes(query));
    });
  }, [applications, search]);

  const linkedCount = applications.filter((app) => app.linkedStudentId).length;

  async function linkStudent(application: AdmissionApplication, studentId: string) {
    const student = students.find((entry) => entry.id === studentId);

    if (!student || !isVerifiedCandidate(application, student)) {
      setError("Choose a registered student whose name and email/mobile match the admission.");
      return;
    }

    const approved = window.confirm(
      `Confirm this permanent student-admission link?\n\nAdmission: ${application.name ?? ""} (${application.applicationId})\nStudent account: ${student.name} (${student.email})\n\nThis controls which signature appears on fee receipts.`,
    );

    if (!approved) return;

    setSavingId(application.applicationId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admission/link-student", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.applicationId,
          studentId,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to link the student.");
      }

      setApplications((current) =>
        current.map((entry) =>
          entry.applicationId === application.applicationId
            ? { ...entry, linkedStudentId: studentId }
            : entry,
        ),
      );
      setSuccess(`${application.name || "Student"} is linked. Their uploaded signature is now available to linked receipts.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to link the student.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="min-w-0 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
            Admissions &amp; billing
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Link Admission to Student Account
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Link an admission application to a registered student before printing
            their uploaded signature on a fee receipt. Names must match, along
            with the email or mobile number. No automatic name-only matching.
          </p>
        </div>
        <button
          type="button"
          disabled={loading || Boolean(savingId)}
          onClick={() => void loadApplications()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh Admissions
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          {linkedCount} linked / {applications.length} shown
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search student, email, mobile or Admission ID"
          aria-label="Search admission applications"
          className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading applications...</p>
      ) : visibleApplications.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No matching admission applications found.</p>
      ) : (
        <div className="mt-4 max-h-[500px] space-y-3 overflow-y-auto pr-1">
          {visibleApplications.map((application) => {
            const candidates = students.filter((student) =>
              isVerifiedCandidate(application, student),
            );
            const chosen = selections[application.applicationId] ||
              (candidates.length === 1 ? candidates[0].id : "");
            const linkedStudent = students.find((student) =>
              student.id === application.linkedStudentId,
            );

            return (
              <div
                key={application.applicationId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-extrabold text-slate-900">
                      {application.name || "Unnamed applicant"}
                    </p>
                    <p className="break-all text-xs text-slate-600">
                      {application.applicationId}
                    </p>
                    <p className="break-words text-xs text-slate-500">
                      {application.email || "No email"} · {application.mobile || "No mobile"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {application.programme || application.course || "Programme not recorded"}
                    </p>
                  </div>
                  {application.linkedStudentId ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      Linked
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      Needs linking
                    </span>
                  )}
                </div>

                {application.linkedStudentId ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-800">
                    Registered account: {linkedStudent?.name || application.linkedStudentId}
                  </p>
                ) : candidates.length ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Registered student for ${application.name || application.applicationId}`}
                      value={chosen}
                      onChange={(event) =>
                        setSelections((current) => ({
                          ...current,
                          [application.applicationId]: event.target.value,
                        }))
                      }
                      className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                    >
                      <option value="">Choose a verified student account</option>
                      {candidates.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} — {student.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!chosen || Boolean(savingId)}
                      onClick={() => void linkStudent(application, chosen)}
                      className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {savingId === application.applicationId ? "Linking..." : "Link Student"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-amber-800">
                    No verified student account matches. Check the student directory's name,
                    email and mobile before linking. Do not choose by name alone.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Showing up to 200 latest applications. Linked records cannot be changed here;
        correcting a wrong link requires Admin review.
      </p>
    </section>
  );
}
