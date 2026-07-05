"use client";

import Link from "next/link";
import {
  BellRing,
  BriefcaseBusiness,
  FileText,
  FileUp,
  GraduationCap,
  IndianRupee,
  MapPin,
  Search,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

const studentFeatures = [
  {
    icon: BriefcaseBusiness,
    title: "Job Opportunities",
    description: "Explore jobs from verified companies.",
  },
  {
    icon: GraduationCap,
    title: "Fresher Jobs",
    description: "Find roles built for fresh graduates.",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Create a professional placement resume.",
  },
  {
    icon: BellRing,
    title: "Job Alerts",
    description: "Get notified about matching openings.",
  },
];

const sampleJobs = [
  {
    company: "TCS",
    role: "Graduate Engineer Trainee",
    location: "Mumbai / Hybrid",
    salary: "₹3.6 – ₹7 LPA",
  },
  {
    company: "Infosys",
    role: "Business Analyst Intern",
    location: "Pune / Bengaluru",
    salary: "₹20,000 / month",
  },
];

export function StudentJobPortalHero() {
  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_38%),linear-gradient(to_bottom,_rgba(16,185,129,0.03),_transparent)]" />

      <div className="container mx-auto px-4">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_50px_rgba(15,23,42,0.05)] backdrop-blur md:p-6 lg:p-7">
          <div className="rounded-[1.8rem] border border-emerald-100 bg-[#f5fff8] p-6 md:p-8">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  <GraduationCap className="h-4 w-4 stroke-[2.4]" />
                  For Students
                </span>

                <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                  Find Your{" "}
                  <span className="text-emerald-600">Dream Job</span>
                </h2>

                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                  Explore internships, part-time roles, fresher opportunities,
                  and full-time jobs from verified hiring partners.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/placements#find-jobs"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    <Search className="h-4 w-4" />
                    Find Jobs
                  </Link>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <FileUp className="h-4 w-4 stroke-[2.4]" />
                    Upload Resume
                  </Link>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {studentFeatures.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-emerald-100 bg-white px-3 py-4 text-center shadow-sm"
                      >
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <Icon className="h-4 w-4 stroke-[2.4]" />
                        </div>

                        <p className="text-sm font-black text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[460px]">
                <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-emerald-200/50 blur-3xl" />

                <div className="relative rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_20px_45px_rgba(16,185,129,0.12)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                        Smart Tutors Jobs
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">
                        Opportunities for you
                      </h3>
                    </div>

                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Search className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Search roles, companies, locations...
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {sampleJobs.map((job) => (
                      <article
                        key={`${job.company}-${job.role}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                                {job.company.slice(0, 1)}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-950">
                                  {job.role}
                                </p>
                                <p className="text-xs font-semibold text-emerald-700">
                                  {job.company}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {job.salary}
                              </span>
                            </div>
                          </div>

                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                            New
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl bg-emerald-600 p-4 text-white">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <UserRoundCheck className="h-5 w-5" />
                      </span>

                      <div>
                        <p className="text-sm font-black">
                          Your profile can get shortlisted
                        </p>
                        <p className="mt-1 text-xs leading-5 text-emerald-50">
                          Add your resume, skills, and preferred roles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}