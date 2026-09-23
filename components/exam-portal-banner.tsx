import { ArrowUpRight, BookOpenCheck, Sparkles } from "lucide-react";

type ExamPortalBannerProps = {
  compact?: boolean;
};

export function ExamPortalBanner({
  compact = false,
}: ExamPortalBannerProps) {
  return (
    <section
      aria-labelledby="exam-portal-title"
      className={`relative isolate overflow-hidden rounded-none border border-blue-300/30 bg-gradient-to-br from-[#071638] via-[#103B91] to-[#2563EB] text-white shadow-[0_20px_65px_-18px_rgba(29,78,216,0.45)] ${
        compact ? "p-6 sm:p-9" : "p-7 sm:p-10 lg:p-12"
      }`}
    >
      {/* Background decoration */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 left-1/4 h-80 w-80 rounded-full bg-indigo-300/15 blur-3xl"
      />

      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          {/* Featured badge */}

          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            <Sparkles className="h-4 w-4" />

            SmartIQ Exam Portal

            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black tracking-wide text-slate-950">
              FEATURED
            </span>
          </div>

          {/* Heading */}

          <h2
            id="exam-portal-title"
            className={`mt-6 max-w-3xl font-black leading-[1.12] tracking-tight ${
              compact
                ? "text-2xl sm:text-3xl"
                : "text-3xl sm:text-4xl lg:text-5xl"
            }`}
          >
            Your Next Step Towards{" "}
            <span className="text-cyan-300">
              Exam Success.
            </span>
          </h2>

          {/* Description */}

          <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-blue-100 sm:text-base">
            Explore dedicated mock test series and exam-focused
            practice on SmartIQ Institute&apos;s examination platform.
          </p>

          {/* Feature labels */}

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
              Mock Test Series
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
              Exam Preparation
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
              SmartIQ Institute
            </span>
          </div>

          <p className="mt-6 break-all text-xs font-semibold tracking-wide text-cyan-200">
            smartiqexamportal.in
          </p>
        </div>

        {/* Button */}

        <div className="flex flex-col items-center gap-4 lg:items-end">
          <div className="hidden h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm lg:flex">
            <BookOpenCheck
              className="h-10 w-10 text-cyan-200"
              strokeWidth={1.5}
            />
          </div>

          <a
            href="https://smartiqexamportal.in"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Explore SmartIQ Exam Portal mock test series in a new tab"
            className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-center text-sm font-black text-[#103B91] shadow-[0_12px_35px_-10px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-100 hover:shadow-xl sm:w-auto sm:text-base"
          >
            Explore Mock Test Series

            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>

          <span className="text-xs font-medium text-blue-100">
            Opens SmartIQ Exam Portal ↗
          </span>
        </div>
      </div>
    </section>
  );
}