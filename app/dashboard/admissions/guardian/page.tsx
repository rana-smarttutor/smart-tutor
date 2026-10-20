"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Admission = Record<string, unknown> & { applicationId: string; status: string; name?: string };
const fields = ["name", "dateOfBirth", "email", "mobile", "course", "exam", "programme", "session", "studyMode", "medium", "batchTime", "qualification", "currentStatus", "flat", "street", "city", "state", "pin", "fatherName", "fatherMobile", "fatherEmail", "motherName", "motherMobile", "motherEmail", "emergencyName", "emergencyRelation", "emergencyMobile", "academics", "achievements"];

export default function GuardianAdmissionPage() {
  const [application, setApplication] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admission/guardian", { cache: "no-store" });
        const body = await res.json() as { application?: Admission; error?: string };
        if (!res.ok) throw new Error(body.error || "Unable to load application");
        setApplication(body.application ?? null);
      } catch (e) { setError(e instanceof Error ? e.message : "Unable to load application"); }
      finally { setLoading(false); }
    })();
  }, []);
  async function approve() {
    if (!application || saving || !confirm || !privacy || !terms) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admission/guardian", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.applicationId, confirmDetails: true, acceptPrivacy: true, acceptTerms: true }),
      });
      const body = await res.json() as { error?: string; status?: string };
      if (!res.ok) throw new Error(body.error || "Approval failed");
      setApplication({ ...application, status: "approved" });
    } catch (e) { setError(e instanceof Error ? e.message : "Approval failed"); }
    finally { setSaving(false); }
  }
  return (
    <main className="min-h-screen bg-[#F6F8FC] p-5 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link href="/dashboard" className="text-sm font-bold text-blue-700">Back to parent dashboard</Link>
        <h1 className="text-3xl font-black">Guardian Admission Approval</h1>
        {loading && <p>Loading linked student's application...</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {application && <>
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{application.applicationId}</p>
            <h2 className="text-xl font-bold">{application.name || "Student"}</h2>
            <p className="mt-2 font-semibold">Status: {application.status.replaceAll("_", " ")}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {fields.map(key => <div key={key} className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">{key.replace(/([A-Z])/g, " $1")}</div>
                <div className="mt-1 break-words text-sm">{typeof application[key] === "object" ? JSON.stringify(application[key]) : String(application[key] ?? "Not provided")}</div>
              </div>)}
            </div>
          </section>
          {application.status === "pending_guardian_approval" && <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Review and consent</h2>
            <p className="text-sm">The student has submitted documents and accepted the required policies. As the linked guardian, review the admission details before you approve.</p>
            <label className="flex gap-2"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/> I have reviewed and confirm the admission details.</label>
            <label className="flex gap-2"><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)}/> I accept the <Link className="text-blue-700 underline" href="/privacy" target="_blank">Privacy Policy</Link>.</label>
            <label className="flex gap-2"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/> I accept the <Link className="text-blue-700 underline" href="/terms" target="_blank">Terms and Conditions</Link>.</label>
            <button type="button" onClick={approve} disabled={!confirm || !privacy || !terms || saving} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "Approving..." : "Approve Student Admission"}</button>
          </section>}
          {application.status === "approved" && <p className="rounded-xl bg-green-50 p-5 font-bold text-green-800">Admission approved successfully.</p>}
          {application.status === "pending_student_approval" && <p className="rounded-xl bg-amber-50 p-5 text-amber-800">Waiting for the student to upload documents and confirm their details.</p>}
        </>}
      </div>
    </main>
  );
}
