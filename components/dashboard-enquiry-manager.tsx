"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, User, Calendar, BookOpen, Clock, CheckCircle, XCircle, Sparkles } from "@/components/ui-icons";
import { Enquiry } from "@/lib/types";

export function DashboardEnquiryManager() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEnquiries();
  }, []);

  async function fetchEnquiries() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/enquiries");
      if (response.ok) {
        const data = await response.json();
        setEnquiries(data.enquiries);
      } else {
        setError("Failed to fetch enquiries");
      }
    } catch (err) {
      setError("An error occurred while fetching enquiries");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface rounded-[2rem] p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <p className="mt-4 text-[var(--color-heading)] font-semibold">{error}</p>
        <button 
          onClick={fetchEnquiries}
          className="mt-4 btn-action btn-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <p className="section-label">Course Submissions</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Student Enquiries
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Manage course inquiries submitted via the website forms.
          </p>
        </div>
        <span className="pill">{enquiries.length} submissions</span>
      </div>

      <div className="grid gap-4">
        {enquiries.length === 0 ? (
          <div className="surface-soft rounded-3xl p-12 text-center">
            <p className="text-[var(--color-muted)]">No enquiries submitted yet.</p>
          </div>
        ) : (
          enquiries.map((enquiry, index) => {
            const hasSuggestions = enquiry.suggestedCourses && enquiry.suggestedCourses.length > 0;
            return (
            <div key={index} className="surface-soft rounded-3xl p-5 border border-[var(--color-border)] hover:border-blue-400 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-heading)]">{enquiry.name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--color-muted)] font-medium">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {enquiry.role}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {enquiry.contact}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(enquiry.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-2xl p-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Course Interest</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--color-heading)] mb-2">{enquiry.courseTitle}</p>
                    <p className="text-sm text-[var(--color-muted)] italic leading-relaxed">"{enquiry.message}"</p>
                  </div>

                  {hasSuggestions && (
                    <div className="bg-purple-50/50 rounded-2xl p-3 border border-purple-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Also Interested In</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {enquiry.suggestedCourses!.map((s) => (
                          <span
                            key={s.standardKey}
                            className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200/50"
                          >
                            {s.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 shrink-0 lg:w-48">
                  <div className="surface bg-white rounded-2xl p-3 text-center border border-[var(--color-border)]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      enquiry.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {enquiry.status}
                    </span>
                  </div>
                  <button className="btn-action btn-sm w-full font-bold flex items-center justify-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Contacted
                  </button>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </section>
  );
}