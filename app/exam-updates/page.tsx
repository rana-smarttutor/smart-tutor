import type { Metadata } from "next";
import {
  BellRing,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { ExamUpdatesClient } from "@/components/exam-updates-client";
import {
  getExamUpdates,
  OFFICIAL_EXAM_SOURCES,
} from "@/lib/exam-updates";

export const runtime = "nodejs";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Exam Updates | Smart IQ Institute",
  description:
    "Latest official SSC, UPSC, NTA, banking, entrance exam, admit card, answer key, application and result updates.",
  alternates: {
    canonical: "https://smartiqinstitute.in/exam-updates",
  },
};

export default async function ExamUpdatesPage() {
  const updates = await getExamUpdates();

  const checkedAt = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071b3c] via-[#0b2859] to-[#123d7d] pb-20 pt-16 text-white sm:pb-24 sm:pt-20">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100 backdrop-blur">
              <BellRing className="h-4 w-4" />
              Live Exam Updates
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Never Miss an Important
              <span className="block text-blue-300">
                Exam Update.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-blue-100/80 sm:text-lg">
              Get the latest exam notifications, applications,
              admit cards, results, answer keys and schedules from
              official Indian examination authorities.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Official links only
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <RefreshCw className="h-4 w-4 text-blue-300" />
                Auto refresh every hour
              </span>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {OFFICIAL_EXAM_SOURCES.map((source) => (
                <span
                  key={source.key}
                  className="rounded-lg border border-white/10 bg-black/10 px-3 py-1.5 text-xs font-bold text-blue-100"
                >
                  {source.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ExamUpdatesClient
        updates={updates}
        sources={OFFICIAL_EXAM_SOURCES}
        checkedAt={checkedAt}
      />
    </main>
  );
}