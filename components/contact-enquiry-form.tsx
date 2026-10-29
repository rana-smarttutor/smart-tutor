
"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function ContactEnquiryForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    role: "student",
    courseTitle: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const submissionId = useRef("");

  function update(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || success) return;

    setError("");

    if (!form.name.trim() || !form.contact.trim()) {
      setError("Please enter your name and contact number.");
      return;
    }

    const digits = form.contact.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setError("Please enter a valid contact number.");
      return;
    }

    if (!form.courseTitle.trim()) {
      setError("Please select or enter a course.");
      return;
    }

    if (!submissionId.current) {
      submissionId.current = crypto.randomUUID();
    }

    setLoading(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          contact: form.contact.trim(),
          email: form.email.trim(),
          courseTitle: form.courseTitle.trim(),
          message: form.message.trim(),
          requestType: "general",
          source: "contact-page",
          submissionId: submissionId.current,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to send enquiry.");
      }

      setSuccess(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  const labelStyle =
    "mb-2 block text-sm font-semibold text-slate-700";

  if (success) {
    return (
      <div
        role="status"
        className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-green-100 bg-green-50 p-8 text-center"
      >
        <CheckCircle2 className="mb-5 h-14 w-14 text-green-600" />

        <h3 className="mb-3 text-2xl font-bold text-slate-900">
          Enquiry Submitted Successfully!
        </h3>

        <p className="max-w-md text-sm leading-7 text-slate-600">
          Thank you for contacting SmartIQ Institute. Our admissions
          team will contact you regarding your enquiry.
        </p>

        <button
          type="button"
          onClick={() => {
            submissionId.current = "";
            setSuccess(false);
            setForm({
              name: "",
              contact: "",
              email: "",
              role: "student",
              courseTitle: "",
              message: "",
            });
          }}
          className="mt-7 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10"
    >
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
          Admissions & Support
        </p>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Send Us an Enquiry
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Have questions about courses, admissions or counselling?
          Complete the form and our team will get in touch.
        </p>
      </div>

      <div>
        <label className={labelStyle} htmlFor="enquiry-role">
          I am a
        </label>
        <select
          id="enquiry-role"
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
          className={inputStyle}
        >
          <option value="student">Student</option>
          <option value="parent">Parent / Guardian</option>
        </select>
      </div>

      <div>
        <label className={labelStyle} htmlFor="enquiry-name">
          Full Name *
        </label>
        <input
          id="enquiry-name"
          required
          maxLength={100}
          autoComplete="name"
          className={inputStyle}
          placeholder="Enter your full name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelStyle} htmlFor="enquiry-contact">
            Mobile Number *
          </label>
          <input
            id="enquiry-contact"
            required
            type="tel"
            maxLength={20}
            autoComplete="tel"
            className={inputStyle}
            placeholder="Mobile number"
            value={form.contact}
            onChange={(e) => update("contact", e.target.value)}
          />
        </div>

        <div>
          <label className={labelStyle} htmlFor="enquiry-email">
            Email Address
          </label>
          <input
            id="enquiry-email"
            type="email"
            maxLength={150}
            autoComplete="email"
            className={inputStyle}
            placeholder="Email (optional)"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelStyle} htmlFor="enquiry-course">
          Course / Programme Interested In *
        </label>
        <input
          id="enquiry-course"
          required
          maxLength={200}
          className={inputStyle}
          placeholder="e.g. Class 10, NEET, JEE, SSC CGL"
          value={form.courseTitle}
          onChange={(e) => update("courseTitle", e.target.value)}
        />
      </div>

      <div>
        <label className={labelStyle} htmlFor="enquiry-message">
          Your Message
        </label>
        <textarea
          id="enquiry-message"
          rows={4}
          maxLength={500}
          className={`${inputStyle} resize-y`}
          placeholder="Tell us how we can help you..."
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </div>

      <p className="text-xs leading-5 text-slate-500">
        By submitting, you agree to be contacted regarding your
        enquiry. Read our{" "}
        <Link href="/privacy" className="font-semibold text-blue-700 underline">
          Privacy Policy
        </Link>.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit Enquiry
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );
}
