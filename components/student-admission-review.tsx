"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck, UploadCloud } from "lucide-react";

type Admission = {
  applicationId: string;
  status: string;
  name?: string;
  dateOfBirth?: string;
  email?: string;
  mobile?: string;
  course?: string;
  exam?: string;
  programme?: string;
  session?: string;
  qualification?: string;
  city?: string;
  state?: string;
  fatherName?: string;
  motherName?: string;
  submittedAt?: string;
  approvedAt?: string | null;
};

type UploadKey = "photo" | "signatureImage" | "photoId" | "marksheet";
const uploadFields: { key: UploadKey; title: string; hint: string; accept: string }[] = [
  { key: "photo", title: "Student photograph", hint: "JPG or PNG, up to 1 MB", accept: "image/jpeg,image/png" },
  { key: "signatureImage", title: "Student signature", hint: "JPG or PNG, up to 1 MB", accept: "image/jpeg,image/png" },
  { key: "photoId", title: "Photo identity document", hint: "JPG, PNG or PDF, up to 1 MB", accept: "image/jpeg,image/png,application/pdf" },
  { key: "marksheet", title: "Latest marksheet", hint: "JPG, PNG or PDF, up to 1 MB", accept: "image/jpeg,image/png,application/pdf" },
];

const details: { key: keyof Admission; label: string }[] = [
  { key: "name", label: "Full name" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "course", label: "Course category" },
  { key: "exam", label: "Class / examination" },
  { key: "programme", label: "Programme" },
  { key: "session", label: "Academic session" },
  { key: "qualification", label: "Qualification" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "fatherName", label: "Father's name" },
  { key: "motherName", label: "Mother's name" },
];

export default function StudentAdmissionReview() {
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState<Partial<Record<UploadKey, File>>>({});
  const [confirmDetails, setConfirmDetails] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admission/student", { cache: "no-store" });
        const payload = (await response.json()) as { application?: Admission; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load admission.");
        if (active) setAdmission(payload.application ?? null);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load admission.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const isPending = admission?.status === "pending_student_approval";
  const isApproved = admission?.status === "approved";
  const waitingForGuardian = admission?.status === "pending_guardian_approval";
  const allDocuments = uploadFields.every(({ key }) => Boolean(files[key]));
  const ready = isPending && allDocuments && confirmDetails && acceptPrivacy && acceptTerms && !saving;

  function pickFile(key: UploadKey, event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    setError("");
    setFiles((current) => ({ ...current, [key]: selected }));
    if (selected && selected.size > 1024 * 1024) setError(`${selected.name} is larger than 1 MB.`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admission || !ready) return;
    if (uploadFields.some(({ key }) => (files[key]?.size ?? 0) > 1024 * 1024)) {
      setError("Each document must be at most 1 MB.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = new FormData();
      body.set("applicationId", admission.applicationId);
      body.set("confirmDetails", "true");
      body.set("acceptPrivacy", "true");
      body.set("acceptTerms", "true");
      for (const { key } of uploadFields) body.set(key, files[key]!);
      const response = await fetch("/api/admission/student", { method: "POST", body });
      const payload = (await response.json()) as { error?: string; status?: string; approvedAt?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to approve admission.");
      setAdmission((old) => old ? { ...old, status: payload.status ?? "approved", approvedAt: payload.approvedAt ?? null } : old);
      setSuccess(payload.status === "pending_guardian_approval" ? "Documents submitted. Your linked guardian must approve your admission next." : "Your admission has been approved successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Approval failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0A54B7]">SmartIQ Institute</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">My Admission Application</h1>
            <p className="mt-2 text-sm text-slate-500">Review your details and complete your personal verification.</p>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A54B7]">Back to dashboard</Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"><Loader2 className="animate-spin" size={18}/> Loading your application...</div>
        ) : error && !admission ? (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">{error}</div>
        ) : admission ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs text-slate-500">Application ID</p>
                <p className="font-bold">{admission.applicationId}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                {isApproved ? "Approved" : waitingForGuardian ? "Pending Guardian Approval" : isPending ? "Pending Student Approval" : admission.status.replaceAll("_", " ")}
              </span>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-lg font-bold">Step 1 — Review admission details</h2>
              <p className="mt-1 text-sm text-slate-500">These details were submitted by the admissions team. Contact them to correct anything before approving.</p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {details.map(({ key, label }) => (
                  <div key={key} className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs font-medium text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold">{admission[key] || "Not provided"}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-slate-500">Before approving, request the full admission record from the admissions team if any additional academic, address or guardian details need verification.</p>
            </section>

            {waitingForGuardian && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <h2 className="font-bold">Waiting for guardian approval</h2>
                <p className="mt-1 text-sm">Your documents and consent are saved. Ask your linked parent to open /dashboard/admissions/guardian from their account. Your admission signature will not appear on invoices until they approve.</p>
              </section>
            )}

            {isApproved ? (
              <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                <CheckCircle2 className="shrink-0" size={24}/>
                <div><h2 className="font-bold">Admission approved</h2><p className="mt-1 text-sm">Your verification and consent have been recorded. The institute can now use your approved signature for authorized admission documents.</p></div>
              </section>
            ) : isPending ? (
              <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                  <div className="flex items-center gap-2"><UploadCloud className="text-[#0A54B7]" size={21}/><h2 className="text-lg font-bold">Step 2 — Upload your documents</h2></div>
                  <p className="mt-1 text-sm text-slate-500">All four documents are required for this application. Files are uploaded securely upon approval.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {uploadFields.map(({ key, title, hint, accept }) => (
                      <label key={key} className="block rounded-xl border border-slate-200 p-4">
                        <span className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} className="text-[#0A54B7]"/>{title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
                        <input type="file" accept={accept} required onChange={(e) => pickFile(key, e)} className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-[#0A54B7]"/>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                  <div className="flex items-center gap-2"><ShieldCheck className="text-[#0A54B7]" size={21}/><h2 className="text-lg font-bold">Step 3 — Review policies and consent</h2></div>
                  <p className="mt-2 text-sm text-slate-600">Read the institute's <Link className="font-semibold text-[#0A54B7] underline" href="/privacy" target="_blank">Privacy Policy</Link> and <Link className="font-semibold text-[#0A54B7] underline" href="/terms" target="_blank">Terms &amp; Conditions</Link> before approving.</p>
                  <div className="mt-5 space-y-4 text-sm">
                    <label className="flex items-start gap-3"><input type="checkbox" checked={confirmDetails} onChange={(e) => setConfirmDetails(e.target.checked)} className="mt-1"/><span>I have reviewed my admission details and confirm they are correct.</span></label>
                    <label className="flex items-start gap-3"><input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-1"/><span>I have read the Privacy Policy and consent to processing my admission information and documents for enrollment purposes.</span></label>
                    <label className="flex items-start gap-3"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1"/><span>I have read and agree to the Terms &amp; Conditions.</span></label>
                  </div>
                </section>
                {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
                {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
                <button type="submit" disabled={!ready} className="w-full rounded-xl bg-[#0A54B7] px-6 py-4 text-sm font-bold text-white hover:bg-[#084899] disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? "Uploading and approving..." : "Approve & Submit Admission"}
                </button>
                <p className="text-center text-xs text-slate-500">If you are under 18, the system will require guardian approval before finalizing your application.</p>
              </form>
            ) : <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">This application cannot currently be approved. Contact the admissions team.</div>}
          </>
        ) : null}
      </div>
    </main>
  );
}