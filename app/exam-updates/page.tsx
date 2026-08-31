import type { Metadata } from "next";
import {
  BellRing,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
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
    "Latest official SSC, UPSC, NTA, banking, admit card, answer key, application and result updates.",
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
    <main className="min-h-screen bg-[#f6f9ff]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#071c3f] text-white">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="absolute right-0 top-10 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_.75fr]">
            {/* Hero left */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-100 backdrop-blur-xl">
                <BellRing className="h-4 w-4 text-blue-300" />
                Live Exam Updates
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-[64px] lg:leading-[1.02]">
                Every important exam
                <span className="block bg-gradient-to-r from-[#69a7ff] via-[#7cc5ff] to-[#9ad8ff] bg-clip-text text-transparent">
                  update. One place.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-blue-100/75 sm:text-lg">
                Notifications, applications, admit cards, results and
                answer keys from official examination authorities —
                organised for students in one simple dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-bold backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Official links only
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-bold backdrop-blur">
                  <RefreshCw className="h-4 w-4 text-blue-300" />
                  Updated automatically
                </div>
              </div>
            </div>

            {/* Hero right */}
            <div className="hidden lg:block">
              <div className="relative rounded-[30px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
                <div className="absolute -right-3 -top-3 rounded-full border border-blue-300/20 bg-blue-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                  Live
                </div>

                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20">
                    <Search className="h-5 w-5 text-blue-300" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      Smart Exam Feed
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-blue-100/50">
                      Official authorities in one place
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {OFFICIAL_EXAM_SOURCES.map((source) => (
                    <div
                      key={source.key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[10px] font-black text-blue-100">
                          {source.name.slice(0, 4)}
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">
                            {source.name}
                          </p>
                          <p className="text-[11px] font-medium text-blue-100/50">
                            Official Authority
                          </p>
                        </div>
                      </div>

                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-blue-500/15 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-300" />
                    <span className="text-xs font-bold text-blue-100">
                      {updates.length} updates available
                    </span>
                  </div>

                  <ExternalLink className="h-4 w-4 text-blue-300" />
                </div>
              </div>
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