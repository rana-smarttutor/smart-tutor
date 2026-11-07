import type { Metadata } from "next";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

import QuizArenaClient from "@/components/quiz-arena-client";

import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mock Test Arena | SmartIQ Institute",
  description:
    "Practise mock tests and quizzes for school, college, competitive exams, government exams and MBA entrances with SmartIQ Institute.",
  alternates: {
    canonical: "https://smartiqinstitute.in/mock-test",
  },
};

type MockTestPageProps = {
  searchParams: Promise<{
    arena?: string | string[];
  }>;
};

const examPortalTags = [
  "500+ Mock Tests",
  "Mock Test Series",
  "Exam Preparation",
  "SmartIQ Institute",
];

const quizArenaTags = [
  "500+ Quizzes",
  "📘 School Courses",
  "🎯 Competitive Exams",
  "🏛️ Government Exams",
  "📊 MBA Entrances",
];

const panelClassName =
  "relative isolate w-full overflow-hidden border border-blue-300/20 " +
  "bg-gradient-to-br from-[#071735] via-[#102F69] to-[#194785] " +
  "text-white shadow-[0_22px_60px_rgba(0,0,0,0.16)]";

export default async function MockTestPage({
  searchParams,
}: MockTestPageProps) {
  const session = await getSessionUser();

  // Guests can browse the Mock Test page.
  // Only active students and admins may use signed-in access.
  if (
    session &&
    ((session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active"))
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const arenaValue = Array.isArray(params.arena)
    ? params.arena[0]
    : params.arena;

  const showQuizArena = arenaValue === "quiz";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smartiqinstitute.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Mock Tests",
        item: "https://smartiqinstitute.in/mock-test",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      {showQuizArena ? (
        /*
         * Keep the existing Quiz Arena application.
         *
         * Default starting step is "welcome".
         * The visitor sees Start Quiz, then category selection.
         *
         * Subscription, login, level unlocking, draft saving
         * and question-generation logic remain untouched.
         */
        <QuizArenaClient mockTestMode />
      ) : (
        <main className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#050C23] via-[#17113D] to-[#07142D] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-7">
            {/* =====================================================
                PANEL 1 — SMARTIQ EXAM PORTAL
            ===================================================== */}

            <section
              aria-labelledby="mock-exam-portal-title"
              className={`${panelClassName} min-h-[355px]`}
            >
              {/* Background decoration */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="absolute -right-24 -top-32 h-[380px] w-[380px] rounded-full bg-cyan-400/[0.07] blur-[100px]" />

                <div className="absolute -bottom-36 left-[18%] h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[100px]" />
              </div>

              {/* Main content */}

              <div className="relative z-10 grid min-h-[355px] grid-cols-1 gap-8 px-6 py-9 sm:px-10 sm:py-11 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-center lg:gap-12 lg:px-11">
                {/* LEFT CONTENT */}

                <div className="min-w-0">
                  {/* Badge */}

                  <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 shadow-sm backdrop-blur-sm">
                    <Sparkles
                      size={19}
                      strokeWidth={1.8}
                      className="shrink-0 text-cyan-100"
                      aria-hidden="true"
                    />

                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 sm:text-xs">
                      SMARTIQ EXAM PORTAL
                    </span>

                    <span className="rounded-full bg-[#FFBF00] px-3 py-1 text-[10px] font-black uppercase text-[#101827]">
                      FEATURED
                    </span>
                  </div>

                  {/* Heading */}

                  <h1
                    id="mock-exam-portal-title"
                    className="mt-7 text-[clamp(1.8rem,2.5vw,2.5rem)] font-black leading-[1.18] tracking-[-0.045em]"
                  >
                    <span className="text-white">Your Next Step Towards </span>

                    <span className="text-[#70CFFF]">Exam Success.</span>
                  </h1>

                  {/* Description */}

                  <p className="mt-6 max-w-[790px] text-[15px] leading-[1.8] text-blue-100 sm:text-lg">
                    Explore dedicated mock test series and exam-focused practice
                    on SmartIQ Institute&apos;s examination platform.
                  </p>

                  {/* Tags */}

                  <div className="mt-7 flex flex-wrap gap-3">
                    {examPortalTags.map((tag, index) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold sm:text-sm ${
                          index === 0
                            ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
                            : "border-white/20 bg-white/10 text-white"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Website label */}

                  <p className="mt-7 text-sm font-semibold text-cyan-200">
                    smartiqexamportal.in
                  </p>
                </div>

                {/* RIGHT ACTION */}

                <div className="flex flex-col items-center justify-center gap-5 lg:items-end">
                  {/* Icon */}

                  <div className="flex h-[86px] w-[86px] items-center justify-center rounded-[26px] border border-white/20 bg-white/10 text-cyan-200 shadow-md backdrop-blur-sm">
                    <BookOpenCheck
                      size={42}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>

                  {/* CTA */}

                  <a
                    href="https://smartiqexamportal.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-[66px] w-full items-center justify-center gap-4 rounded-[18px] bg-white px-5 py-4 text-center text-[15px] font-black text-[#163D85] shadow-xl transition-all duration-200 hover:-translate-y-1 hover:bg-blue-50 sm:text-lg lg:w-[350px]"
                  >
                    Start Full Mock Test Series
                    <ArrowUpRight
                      size={23}
                      strokeWidth={2.3}
                      className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      aria-hidden="true"
                    />
                  </a>

                  <p className="text-center text-sm text-blue-100 lg:text-right">
                    Opens SmartIQ Exam Portal ↗
                  </p>
                </div>
              </div>
            </section>

            {/* =====================================================
                PANEL 2 — SMARTIQ QUIZ ARENA
            ===================================================== */}

            <section
              aria-labelledby="mock-quiz-arena-title"
              className={`${panelClassName} min-h-[355px]`}
            >
              {/* Background decoration */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="absolute -right-28 -top-28 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.07] blur-[110px]" />

                <div className="absolute -bottom-40 left-[22%] h-[390px] w-[390px] rounded-full bg-blue-500/10 blur-[100px]" />
              </div>

              {/* Main content */}

              <div className="relative z-10 grid min-h-[355px] grid-cols-1 gap-8 px-6 py-9 sm:px-10 sm:py-11 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-center lg:gap-12 lg:px-11">
                {/* LEFT CONTENT */}

                <div className="min-w-0">
                  {/* Badge */}

                  <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 shadow-sm backdrop-blur-sm">
                    <Sparkles
                      size={19}
                      strokeWidth={1.8}
                      className="shrink-0 text-cyan-100"
                      aria-hidden="true"
                    />

                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 sm:text-xs">
                      SMARTIQ QUIZ ARENA
                    </span>

                    <span className="rounded-full bg-[#FFBF00] px-3 py-1 text-[10px] font-black uppercase text-[#101827]">
                      PRACTICE ZONE
                    </span>
                  </div>

                  {/* Heading */}

                  <h2
                    id="mock-quiz-arena-title"
                    className="mt-7 text-[clamp(1.8rem,2.5vw,2.5rem)] font-black leading-[1.18] tracking-[-0.045em]"
                  >
                    <span className="text-white">Practise Daily, </span>

                    <span className="text-[#70CFFF]">Level Up Faster.</span>
                  </h2>

                  {/* Description */}

                  <p className="mt-6 max-w-[790px] text-[15px] leading-[1.8] text-blue-100 sm:text-lg">
                    Fresh quizzes for school, junior college, competitive exams,
                    government exams and MBA entrance preparation. Clear every
                    round to unlock the next level.
                  </p>

                  {/* Categories */}

                  <div className="mt-7 flex flex-wrap gap-3">
                    {quizArenaTags.map((tag, index) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold sm:text-sm ${
                          index === 0
                            ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
                            : "border-white/20 bg-white/10 text-white"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Quiz Structure */}

                  <p className="mt-7 text-sm font-semibold text-cyan-200">
                    10 Levels · 5 Rounds per Level · 10 Questions per Round
                  </p>
                </div>

                {/* RIGHT ACTION */}

                <div className="flex flex-col items-center justify-center gap-5 lg:items-end">
                  {/* Icon */}

                  <div className="flex h-[86px] w-[86px] items-center justify-center rounded-[26px] border border-white/20 bg-white/10 text-cyan-200 shadow-md backdrop-blur-sm">
                    <Trophy size={42} strokeWidth={1.8} aria-hidden="true" />
                  </div>

                  {/* CTA — OPENS EXISTING QUIZ ARENA */}

                  <Link
                    href="/mock-test?arena=quiz"
                    className="group inline-flex min-h-[66px] w-full items-center justify-center gap-4 rounded-[18px] bg-white px-5 py-4 text-center text-[15px] font-black text-[#163D85] shadow-xl transition-all duration-200 hover:-translate-y-1 hover:bg-blue-50 sm:text-lg lg:w-[350px]"
                  >
                    Start Quiz Arena
                    <ArrowDownRight
                      size={23}
                      strokeWidth={2.3}
                      className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
                      aria-hidden="true"
                    />
                  </Link>

                  <p className="text-center text-sm text-blue-100 lg:text-right">
                    Pick your exam and start at Level 1
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      )}
    </>
  );
}
