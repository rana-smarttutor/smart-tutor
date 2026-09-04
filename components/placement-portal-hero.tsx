"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BellRing,
  BriefcaseBusiness,
  Building2,
  FileText,
  FileUp,
  GraduationCap,
  Search,
  UsersRound,
} from "lucide-react";

const companyFeatures = [
  {
    icon: FileUp,
    title: "Upload Jobs",
    description: "Post job openings in minutes",
  },
  {
    icon: FileText,
    title: "Manage Applications",
    description: "Track and manage applications",
  },
  {
    icon: UsersRound,
    title: "Campus Hiring",
    description: "Connect with skilled students",
  },
  {
    icon: BriefcaseBusiness,
    title: "Internship Hiring",
    description: "Hire interns for projects",
  },
];

const studentFeatures = [
  {
    icon: BriefcaseBusiness,
    title: "Job Opportunities",
    description: "Explore internships and jobs",
  },
  {
    icon: GraduationCap,
    title: "Fresher Jobs",
    description: "Find jobs for fresh graduates",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: " Comming soon ",
  },
  {
    icon: BellRing,
    title: "Job Alerts",
    description: "Get notified about new jobs",
  },
];

export function PlacementPortalHero() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="grid items-stretch lg:grid-cols-2">
          {/* COMPANY SIDE */}
          <div className="relative flex h-full flex-col border-b border-slate-200 bg-[#f7faff] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="grid min-h-[300px] items-center gap-5 sm:grid-cols-[1.15fr_0.85fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.17em] text-blue-700">
                  <Building2 className="h-3.5 w-3.5" />
                  For Companies
                </span>

                <h1 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-[38px]">
                  Hire Talent from{" "}
                  <span className="text-blue-600">SmartIQ Institute</span>
                </h1>

                <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-600">
                  Find skilled students, interns, and fresh graduates for your
                  organisation.
                </p>

                <div className="mt-5 flex min-h-[42px] flex-wrap items-start gap-2.5">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    Post a Vacancy
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-50"
                  >
                    <UsersRound className="h-3.5 w-3.5" />
                    Become a Hiring Partner
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Image
                  src="/hero-company.png"
                  alt="SmartIQ Institute hiring portal"
                  width={310}
                  height={310}
                  priority
                  className="h-auto w-full max-w-[245px] object-contain"
                />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 items-start gap-3 pt-7 sm:grid-cols-4">
              {companyFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border border-blue-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/15"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </div>

                    <p className="mt-3 flex min-h-[32px] items-center justify-center text-[11px] font-black leading-tight text-slate-900">
                      {feature.title}
                    </p>

                    <p className="mt-1 flex min-h-[48px] items-start justify-center text-[9px] leading-4 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STUDENT SIDE */}
          <div className="relative flex h-full flex-col bg-[#f7fff9] p-6 sm:p-8">
            <div className="grid min-h-[300px] items-center gap-5 sm:grid-cols-[1.15fr_0.85fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.17em] text-emerald-700">
                  <GraduationCap className="h-3.5 w-3.5" />
                  For Students
                </span>

                <h2 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-[38px]">
                  Find Your <span className="text-emerald-600">Dream Job</span>
                </h2>

                <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-600">
                  Explore internships, part-time jobs, fresher opportunities,
                  and full-time placements.
                </p>

                <div className="mt-5 flex min-h-[42px] flex-wrap items-start gap-2.5 sm:min-h-[94px]">
                  <a
                    href="#find-jobs"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Find Jobs
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Image
                  src="/hero-student.png"
                  alt="SmartIQ Institute student job portal"
                  width={310}
                  height={310}
                  priority
                  className="h-auto w-full max-w-[245px] object-contain"
                />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 items-stretch gap-2.5 pt-7 sm:grid-cols-4">
              {studentFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/15"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Icon className="h-4 w-4" />
                    </div>

                    <p className="mt-3 flex min-h-[32px] items-center justify-center text-[11px] font-black leading-tight text-slate-900">
                      {feature.title}
                    </p>

                    <p className="mt-1 flex min-h-[48px] items-start justify-center text-[9px] leading-4 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
