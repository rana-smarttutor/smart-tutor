"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User2,
} from "lucide-react";

type AdmissionStatus =
  | "submitted"
  | "pending_student_approval"
  | "pending_guardian_approval"
  | "correction_requested"
  | "approved"
  | string;

type AdmissionDocument = {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
};

type AdmissionApplication = {
  applicationId: string;
  status?: AdmissionStatus;
  name?: string;
  email?: string;
  mobile?: string;
  course?: string;
  exam?: string;
  programme?: string;
  qualification?: string;
  academicSession?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  fatherName?: string;
  motherName?: string;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  documents?: Partial<
    Record<
      "photo" | "signatureImage" | "photoId" | "marksheet",
      AdmissionDocument
    >
  >;
};

type AdmissionApiResponse = {
  application?: AdmissionApplication;
  error?: string;
};

const CARD_CLASS =
  "rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]";

function formatDate(value?: string | null) {
  if (!value) return "Ã¢â‚¬â€";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status?: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "pending_student_approval":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "pending_guardian_approval":
      return "bg-sky-100 text-sky-800 border border-sky-200";
    case "correction_requested":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function statusLabel(status?: string) {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending_student_approval":
      return "Pending Student Approval";
    case "pending_guardian_approval":
      return "Pending Guardian Approval";
    case "correction_requested":
      return "Correction Requested";
    case "submitted":
      return "Submitted";
    default:
      return status ? status.replaceAll("_", " ") : "Pending";
  }
}

function InfoBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-slate-900">
        {value && String(value).trim() ? value : "Ã¢â‚¬â€"}
      </div>
    </div>
  );
}

export default function StudentAdmissionReview() {
  const [application, setApplication] = useState<AdmissionApplication | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAdmission() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admission/student", {
          cache: "no-store",
          credentials: "same-origin",
        });

        const data = (await response.json()) as AdmissionApiResponse;

        if (!response.ok) {
          throw new Error(data.error || "Unable to load your admission.");
        }

        if (!active) return;

        setApplication(data.application ?? null);
      } catch (cause) {
        if (!active) return;
        setApplication(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load your admission record.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAdmission();

    return () => {
      active = false;
    };
  }, []);

  const pdfHref = useMemo(() => {
    if (!application?.applicationId) return "";
    return `/api/admission/pdf?applicationId=${encodeURIComponent(application.applicationId)}`;
  }, [application?.applicationId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`${CARD_CLASS} p-6`}>
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">
              Loading your admission record...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className={`${CARD_CLASS} p-6`}>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <div className={`${CARD_CLASS} p-6`}>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-800">
            No admission record is available right now. Please contact the
            admissions team.
          </div>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="space-y-6">
        <section className={`${CARD_CLASS} overflow-hidden`}>
          <div className="bg-[linear-gradient(135deg,#0B1F5E_0%,#153B9A_55%,#2E6BFF_100%)] px-7 py-7 text-white sm:px-8">
            <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.28em] text-blue-100">
              SmartIQ Institute
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              My Admission
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-blue-50 sm:text-base">
              View your admission record, approval status, and official
              admission form in one place.
            </p>
          </div>
        </section>

        <section className={`${CARD_CLASS} p-6 sm:p-7`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-black text-slate-900">
                {application.name || "Student"}
              </div>
              <div className="mt-2 text-base text-slate-600">
                {[application.course, application.exam]
                  .filter(Boolean)
                  .join(" Ã‚Â· ") || "Admission Application"}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {application.applicationId}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold ${statusTone(application.status)}`}
              >
                {statusLabel(application.status)}
              </span>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1457C8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0D47A1]"
              >
                <FileText size={18} />
                View Form
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Application ID
              </div>
              <div className="mt-2 text-base font-bold text-slate-900">
                {application.applicationId}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Status
              </div>
              <div className="mt-2 text-base font-bold text-slate-900">
                {statusLabel(application.status)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Approval Date
              </div>
              <div className="mt-2 text-base font-bold text-slate-900">
                {formatDate(
                  application.approvedAt ||
                    application.reviewedAt ||
                    application.submittedAt,
                )}
              </div>
            </div>
          </div>

          {application.status === "approved" ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              Your admission has been approved. You can now open your full form
              and download the official admission PDF.
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              Your admission is currently in progress. Open the form to review
              the current details and status.
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${CARD_CLASS} p-6 sm:p-7`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#0A54B7]">
              SmartIQ Institute
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              My Admission Application
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Review your admission details and current approval status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#1457C8] transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
      </section>

      <section className={`${CARD_CLASS} p-6 sm:p-7`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">Application ID</div>
            <div className="mt-1 text-2xl font-black text-slate-900">
              {application.applicationId}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold ${statusTone(application.status)}`}
            >
              {statusLabel(application.status)}
            </span>

            {application.status === "approved" ? (
              <a
                href={`/admission-form/${encodeURIComponent(application.applicationId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                <Download size={18} />
                View Admission PDF
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className={`${CARD_CLASS} p-6 sm:p-7`}>
        <div className="mb-5">
          <h2 className="text-2xl font-black text-slate-900">
            Admission Details
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            These details are part of your admission record.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock
            label="Full Name"
            value={application.name}
            icon={<User2 size={14} />}
          />
          <InfoBlock
            label="Date of Birth"
            value={application.dateOfBirth}
            icon={<CalendarDays size={14} />}
          />
          <InfoBlock
            label="Email"
            value={application.email}
            icon={<Mail size={14} />}
          />
          <InfoBlock
            label="Mobile"
            value={application.mobile}
            icon={<Phone size={14} />}
          />
          <InfoBlock
            label="Course Category"
            value={application.course}
            icon={<GraduationCap size={14} />}
          />
          <InfoBlock label="Class / Examination" value={application.exam} />
          <InfoBlock label="Programme" value={application.programme} />
          <InfoBlock
            label="Academic Session"
            value={application.academicSession}
          />
          <InfoBlock label="Qualification" value={application.qualification} />
          <InfoBlock
            label="City"
            value={application.city}
            icon={<MapPin size={14} />}
          />
          <InfoBlock label="State" value={application.state} />
          <InfoBlock label="Father's Name" value={application.fatherName} />
          <InfoBlock label="Mother's Name" value={application.motherName} />
          <InfoBlock
            label="Approval Date"
            value={formatDate(application.approvedAt || application.reviewedAt)}
            icon={<ShieldCheck size={14} />}
          />
        </div>
      </section>
    </div>
  );
}
