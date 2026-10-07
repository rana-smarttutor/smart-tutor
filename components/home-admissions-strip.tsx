import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

export function HomeAdmissionsStrip() {
  return (
    <section className="section-shell pt-8 sm:pt-10">
      <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 px-6 py-7 shadow-[0_18px_50px_-25px_rgba(37,99,235,0.20)] sm:px-8 lg:px-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* LEFT */}

          <div className="flex items-start gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 sm:h-20 sm:w-20">
              <GraduationCap
                size={34}
                strokeWidth={2.3}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Admissions
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm">
                  <CheckCircle2
                    size={18}
                    strokeWidth={2.7}
                  />

                  OPEN
                </div>

                <div className="hidden h-10 w-px bg-slate-200 sm:block" />

                <div>
                  <span className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                    Academic Session
                  </span>

                  <strong className="mt-1 block text-xl font-black text-slate-950">
                    2026–27
                  </strong>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Admissions are now open at SmartIQ Institute. Join expert-led
                learning, structured practice, mock assessments and
                performance tracking designed to help students achieve better
                academic results.
              </p>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/courses"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-700 px-7 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl"
            >
              Explore Programs

              <ArrowRight
                size={17}
                strokeWidth={2.5}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}