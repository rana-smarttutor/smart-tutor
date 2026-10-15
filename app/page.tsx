import type { Metadata } from "next";
import type { ReactNode } from "react";

import Link from "next/link";
import Image from "next/image";

import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Globe,
  GraduationCap,
  Smartphone,
  Users,
} from "lucide-react";

import { CountUpValue } from "@/components/count-up-value";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getPublicInstituteData } from "@/lib/data-store";

import { getExamUpdates, type ExamUpdate } from "@/lib/exam-updates";

import { MentorHighlightsCarousel } from "@/components/mentor-highlights-carousel";
import { GrandSuccessCarousel } from "@/components/grand-success-carousel";
import HomeToppers from "@/components/home-toppers";

import { courseLibrary } from "@/lib/course-library";
import { ProgramCarousel } from "@/components/program-carousel";
import { ExamPortalBanner } from "@/components/exam-portal-banner";
import { ConsultationEnquiryButton } from "@/components/consultation-enquiry-button";
import { HomeJourneySection } from "@/components/home-journey-section";

/* =====================================================
   HOMEPAGE SEO
===================================================== */

export const metadata: Metadata = {
  description:
    "Find the best personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams, Digital Courses, and Skill Development Programs. Learn with expert teachers through live classes, one-to-one mentoring, recorded lectures, study materials, mock tests, performance analytics, Library Support and complete career guidance.",

  alternates: {
    canonical: "https://smartiqinstitute.in",
  },
};

export const dynamic = "force-dynamic";

/* =====================================================
   ROLE CARD COLOURS
===================================================== */

const roleAccentMap = {
  student: "from-blue-50 to-white",
  educator: "from-purple-50 to-white",
  admin: "from-emerald-50 to-white",
  parent: "from-orange-50 to-white",
} as const;

/* =====================================================
   METRIC STYLES
===================================================== */

const metricStyleMap: Record<
  string,
  {
    icon: ReactNode;
    color: string;
    bg: string;
  }
> = {
  "Success Rate": {
    icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },

  "App Support": {
    icon: <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },

  "Active Students": {
    icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },

  "Expert Mentors": {
    icon: <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },

  "Book Downloads": {
    icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },

  "People Visited": {
    icon: <Globe className="h-5 w-5 sm:h-6 sm:w-6" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
};

const fallbackMetricStyle = {
  icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
  color: "text-blue-600",
  bg: "bg-blue-50",
};

/* =====================================================
   HOMEPAGE ROLE CARDS
===================================================== */

const homeRoles = [
  {
    role: "student",
    title: "Learning Portal",

    summary:
      "Access 1-on-1 tutoring, mock tests, and digital resources to accelerate your growth.",

    features: [
      "Live Classes",
      "Personalized Dashboard",
      "Instant Doubt Solving",
    ],
  },

  {
    role: "educator",
    title: "Mentor Studio",

    summary:
      "Manage your teaching schedule, track student performance, and deliver high-impact lectures.",

    features: [
      "Resource Manager",
      "Performance Tracking",
      "Student Engagement",
    ],
  },

  {
    role: "parent",
    title: "Parent Dashboard",

    summary:
      "Stay connected with the institute — access notices, fee details, and communicate with educators.",

    features: ["Institute Notices", "Fee Details", "Weekly/Monthly Reports"],
  },
];

/* =====================================================
   DYNAMIC EXAM UPDATE CARD
===================================================== */

type HomepageExamCardProps = {
  label: string;
  update: ExamUpdate | null;
  borderColor: string;
  badgeColor: string;
};

function HomepageExamCard({
  label,
  update,
  borderColor,
  badgeColor,
}: HomepageExamCardProps) {
  return (
    <div
      className={`surface-soft rounded-xl border-l-4 p-5 transition-colors hover:bg-blue-50 sm:p-6 ${borderColor}`}
    >
      <span className={`pill mb-3 border-none font-bold ${badgeColor}`}>
        {label}
      </span>

      {update ? (
        <>
          <h3 className="mb-2 break-words text-lg font-bold leading-snug text-[var(--color-heading)] sm:text-xl">
            {update.title}
          </h3>

          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
            <span>{update.source}</span>

            {update.publishedLabel ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{update.publishedLabel}</span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/exam-updates"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 transition-colors hover:text-blue-900"
            >
              View Exam Updates
              <ChevronRight size={16} />
            </Link>
          </div>
        </>
      ) : (
        <>
          <h3 className="mb-2 text-lg font-bold text-[var(--color-heading)]">
            Official exam announcements
          </h3>

          <p className="mb-3 text-sm font-medium leading-relaxed text-[var(--color-muted)]">
            Announcements from the connected official sources are currently
            unavailable. Visit our Exam Updates page to explore more
            examinations.
          </p>

          <Link
            href="/exam-updates"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 transition-colors hover:text-blue-900"
          >
            Browse Exam Updates
            <ChevronRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}

/* =====================================================
   HOMEPAGE
===================================================== */

export default async function Home() {
  /* ===================================================
     LOAD PUBLIC DATA + EXISTING EXAM UPDATE FEED
  =================================================== */

  const [data, examUpdates] = await Promise.all([
    getPublicInstituteData(),
    getExamUpdates().catch((error): ExamUpdate[] => {
      console.error("[Home] Failed to load exam updates:", error);

      return [];
    }),
  ]);

  /* ===================================================
     SELECT ANNOUNCEMENTS BY CATEGORY

     The exam feed is interleaved by authority,
     so the first matching entry is not guaranteed
     to have the newest publication date.
  =================================================== */

  const homepageExamUpdates = {
    board:
      examUpdates.find((update) => update.category === "Board Exams") ?? null,

    government:
      examUpdates.find((update) => update.category === "Government Exams") ??
      null,
  };

  /* ===================================================
     HOMEPAGE PROGRAMS
  =================================================== */

  const programCarouselItems = data.programs.map((program) => ({
    ...program,
    targetTab: "overview",
  }));

  return (
    <main className="relative overflow-hidden pb-16 pt-2">
      {/* =================================================
          HERO SECTION
      ================================================= */}

      <section className="section-shell grid gap-10 pt-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] lg:items-start xl:gap-14">
        {/* LEFT SIDE */}

        <RevealOnScroll className="h-full w-full max-w-full space-y-7 text-center lg:text-left">
          {/* HERO BADGES */}

          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Learn | Practice | Achieve
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Offline Campus
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Vashi&apos;s Results-Driven Campus
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-700 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Panvel&apos;s Results-Driven Campus
            </span>
          </div>

          {/* HERO TITLE */}

          <div className="space-y-5">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600 md:text-[11px]">
              India&apos;s No.1 Trusted Smart Learning Platform
            </p>

            <h1 className="mx-auto max-w-[660px] font-serif text-[2.25rem] font-black leading-[1.02] tracking-[-0.04em] text-[var(--color-heading)] sm:text-[3.15rem] lg:mx-0 lg:text-[3.45rem] xl:text-[3.9rem]">
              Get Smart Results
              <br />
              <span className="inline-block text-[2rem] leading-[1.05] text-blue-600 sm:text-[2.75rem] lg:whitespace-nowrap lg:text-[3rem] xl:text-[3.35rem]">
                With SmartIQ{" "}
                <span className="relative inline-block">
                  Institute
                  <svg
                    className="absolute -bottom-2 left-1/2 h-3 w-[105%] -translate-x-1/2 sm:-bottom-3 sm:h-4"
                    viewBox="0 0 280 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 21C70 8 171 7 272 18"
                      stroke="#F5B400"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-[var(--color-muted)] sm:text-lg xl:mx-0">
              SmartIQ Institute offers thoughtfully designed{" "}
              <strong>
                courses for every stage of a learner&apos;s journey
              </strong>
              . From school academics and board preparation to competitive
              exams, government exams, and future-ready digital skills, our
              courses combine expert mentoring, structured learning, and focused
              practice to help students achieve meaningful academic and career
              growth.
            </p>
          </div>

          {/* HERO BUTTONS */}

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:items-start lg:justify-start">
            <Link
              href="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a365d] px-8 py-3.5 text-base font-bold text-white shadow-[0_8px_20px_-6px_rgba(26,54,93,0.5)] transition-all hover:-translate-y-1 hover:bg-[#214a7d] hover:shadow-[0_12px_25px_-6px_rgba(26,54,93,0.7)] active:translate-y-0 active:scale-95 sm:w-auto"
            >
              Start Your Journey
              <ChevronRight size={18} strokeWidth={3} />
            </Link>

            <a
              href="https://s4hwk9dbjuligkqz.public.blob.vercel-storage.com/smart%20tutors.apk"
              download
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-600 active:translate-y-0 active:scale-95 sm:w-auto"
            >
              <svg
                className="h-5 w-5 text-slate-400 transition-colors group-hover:text-emerald-600"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.523 15.3414C17.068 15.3414 16.699 15.7114 16.699 16.1654V18.1564C16.699 18.3304 16.558 18.4714 16.384 18.4714H7.616C7.442 18.4714 7.301 18.3304 7.301 18.1564V16.1654C7.301 15.7104 6.932 15.3414 6.477 15.3414C6.022 15.3414 5.653 15.7114 5.653 16.1654V18.1564C5.653 19.2384 6.534 20.1194 7.616 20.1194H16.384C17.466 20.1194 18.347 19.2384 18.347 18.1564V16.1654C18.347 15.7114 17.978 15.3414 17.523 15.3414Z" />
                <path d="M11.364 15.1194C11.538 15.2934 11.765 15.3744 12 15.3744C12.235 15.3744 12.462 15.2934 12.636 15.1194L15.753 12.0024C16.089 11.6664 16.089 11.1214 15.753 10.7854C15.417 10.4494 14.872 10.4494 14.536 10.7854L12.824 12.4974V4.70642C12.824 4.23042 12.438 3.84442 11.962 3.84442C11.486 3.84442 11.1 4.23042 11.1 4.70642V12.4974L9.388 10.7854C9.052 10.4494 8.507 10.4494 8.171 10.7854C7.835 11.1214 7.835 11.6664 8.171 12.0024L11.364 15.1194Z" />
              </svg>
              Download Android App
            </a>
          </div>

          {/* HOMEPAGE METRICS */}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {data.metrics.map((metric) => {
              const style = metricStyleMap[metric.label] ?? fallbackMetricStyle;

              return (
                <article
                  key={metric.label}
                  className="group flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-slate-200 sm:p-5 md:gap-3"
                >
                  <div
                    className={`${style.bg} ${style.color} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 sm:h-12 sm:w-12`}
                  >
                    {style.icon}
                  </div>

                  <div className="min-w-0 w-full">
                    <CountUpValue
                      value={metric.value}
                      className="text-lg font-extrabold tracking-tight text-slate-900 md:text-2xl"
                    />

                    <p className="mt-1 break-words text-[11px] font-semibold text-slate-500 sm:text-sm">
                      {metric.label}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* RECOGNITIONS */}

          <div className="flex flex-col items-center justify-center gap-4 pt-6 opacity-80 grayscale transition-all hover:grayscale-0 sm:flex-row sm:gap-6 lg:justify-start">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-xs">
              Recognized By
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              <span className="whitespace-nowrap text-sm font-bold sm:text-lg">
                ISO 9001:2015
              </span>

              <span className="whitespace-nowrap text-sm font-bold sm:text-lg">
                MSME Certified
              </span>

              <span className="whitespace-nowrap text-sm font-bold sm:text-lg">
                Digital India
              </span>
            </div>
          </div>
        </RevealOnScroll>

        {/* =================================================
            RIGHT HERO SIDE
        ================================================= */}

        <RevealOnScroll
          className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24"
          delayMs={90}
        >
          {/* CAMPUS HIGHLIGHTS */}

          <div className="surface graph-paper rounded-[1.75rem] p-5 transition-all hover:shadow-xl sm:p-6">
            <div className="mb-5">
              <p className="section-label">Campus Highlights</p>

              <h2 className="section-title mt-2 text-left text-3xl sm:text-3xl">
                Visible trust, visible outcomes
              </h2>
            </div>

            <div className="flex items-center justify-center">
              <MentorHighlightsCarousel />
            </div>
          </div>

          {/* WHY CHOOSE SMARTIQ IMAGE */}

          <div className="relative h-[520px] w-full overflow-hidden rounded-[2rem]">
            <Image
              src="/WCSIOI.jpeg"
              alt="Why Choose SmartIQ Institute"
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </RevealOnScroll>
      </section>

      {/* =================================================
          JOURNEY + ADMISSIONS + SMARTIQ VIDEO
      ================================================= */}

      <HomeJourneySection />

      {/* =================================================
          EXAM PORTAL BANNER
      ================================================= */}

      <section className="w-full px-0 py-10 sm:py-14">
        <ExamPortalBanner />
      </section>

      {/* =================================================
          RECENT STUDENT RESULTS
      ================================================= */}

      <section className="pb-0 pt-14 sm:pt-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center sm:mb-16">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700">
              Academic Excellence
            </span>

            <h2 className="mb-6 text-3xl font-black tracking-tight text-[var(--color-heading)] md:text-6xl">
              Recent Results
            </h2>

            <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-[var(--color-muted)] sm:text-lg">
              SmartIQ Institute honors the dedication and remarkable
              achievements of our students. Our proven track record defines our
              commitment to academic brilliance.
            </p>
          </div>

          <GrandSuccessCarousel />

          <div className="mt-12">
            <HomeToppers />
          </div>
        </div>
      </section>

      {/* =================================================
          OUR METHODOLOGY
      ================================================= */}

      <RevealOnScroll className="section-shell py-10 lg:py-16" delayMs={100}>
        <div className="container mx-auto px-3 sm:px-6">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700">
              Our Methodology
            </span>

            <h2 className="mb-6 text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-5xl">
              Programs Mapped to Every Stage of Growth
            </h2>

            <p className="text-base font-medium text-[var(--color-muted)] sm:text-lg">
              We provide a complete educational pathway from school foundation
              to high-level government service and future digital skills.
            </p>
          </div>

          <ProgramCarousel programs={programCarouselItems} />

          <div className="mt-10 text-center sm:mt-16">
            <Link
              href="/courses"
              className="action-button inline-flex max-w-full items-center justify-center px-6 py-4 text-center text-base shadow-2xl sm:px-10 sm:py-5 sm:text-lg"
            >
              Explore All {courseLibrary.length}+ Programs
            </Link>
          </div>
        </div>
      </RevealOnScroll>

      {/* =================================================
          STUDENT / EDUCATOR / PARENT ROLE CARDS
      ================================================= */}

      <RevealOnScroll className="section-shell py-16" delayMs={40}>
        <div className="mb-10 max-w-5xl text-left">
          <p className="section-label mb-3 !text-sm sm:!text-base">Roles</p>

          <h2 className="section-title leading-[1.12]">
            One system for Students, Educators, Parents.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {homeRoles.map((role) => (
            <article
              key={role.role}
              className={`surface flex h-full min-w-0 flex-col rounded-2xl border border-blue-100/50 bg-gradient-to-br ${
                roleAccentMap[role.role as keyof typeof roleAccentMap]
              } p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6`}
            >
              <p className="keyword-line text-[10px] font-black uppercase tracking-widest">
                {role.role}
              </p>

              <h3 className="mt-3 break-words text-xl font-bold leading-snug tracking-tight text-[var(--color-heading)] sm:text-2xl">
                {role.title}
              </h3>

              <p className="mt-3 flex-grow break-words text-sm font-medium leading-6 text-[var(--color-muted)] sm:leading-7">
                {role.summary}
              </p>

              <ul className="mt-5 space-y-3 text-sm font-bold text-[var(--color-heading)]">
                {role.features.map((feature) => (
                  <li key={feature} className="flex min-w-0 items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                    <span className="min-w-0 break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      {/* =================================================
          EXAM UPDATES + PROMOTIONAL OFFER
      ================================================= */}

      <RevealOnScroll className="section-shell py-14" delayMs={80}>
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT: DYNAMIC EXAM UPDATES */}

          <article className="surface flex h-full min-w-0 flex-col rounded-xl p-5 transition-all hover:shadow-xl sm:p-8">
            <div className="mb-5">
              <p className="section-label">Official Exam Updates</p>

              <h2 className="section-title">
                Stay updated with the SmartIQ Institute
              </h2>
            </div>

            <div className="space-y-6">
              {/* BOARD EXAM UPDATE */}

              <HomepageExamCard
                label="Board Exam Update"
                update={homepageExamUpdates.board}
                borderColor="border-blue-600"
                badgeColor="bg-blue-100 text-blue-700"
              />

              {/* GOVERNMENT EXAM UPDATE */}

              <HomepageExamCard
                label="Government Exam Update"
                update={homepageExamUpdates.government}
                borderColor="border-indigo-600"
                badgeColor="bg-indigo-100 text-indigo-700"
              />

              {/* =========================================
                  PRIME DIGITAL SCHOOL — NOW LIVE
              ========================================= */}

              <div className="surface-soft rounded-xl border-l-4 border-emerald-600 p-5 transition-colors hover:bg-emerald-50 sm:p-6">
                <span className="pill mb-3 border-none bg-emerald-100 font-bold text-emerald-700">
                  Prime Digital School
                </span>

                <h3 className="mb-2 text-xl font-bold text-[var(--color-heading)]">
                  Now Live — Explore the Future of Digital Education!
                </h3>

                <p className="text-sm font-medium leading-relaxed text-[var(--color-muted)]">
                  Prime Digital School is now live! Explore future-ready
                  programs in Coding, Artificial Intelligence, Web Development,
                  Cloud Computing, and digital technologies through practical,
                  project-based learning.
                </p>

                <a
                  href="https://primedigitalschool.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-900"
                >
                  Explore Prime Digital School
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </article>

          {/* =================================================
              RIGHT: PROMOTIONAL OFFER
          ================================================= */}

          <div className="flex h-full min-w-0 flex-col">
            <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#1e40af] via-[#3730a3] to-[#4338ca] p-6 text-white shadow-2xl transition-all hover:scale-[1.01] sm:p-10">
              {/* BACKGROUND DECORATION */}

              <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10 blur-3xl transition-all group-hover:bg-white/20" />

              <p className="relative z-10 mb-3 text-sm font-black uppercase tracking-[0.2em] text-blue-200">
                Promotional Offer
              </p>

              <h2 className="relative z-10 mb-4 break-words text-3xl font-black leading-tight drop-shadow-md sm:text-4xl">
                Advance Your Career with SmartIQ Institute
              </h2>

              <p className="relative z-10 mb-8 text-base font-medium leading-relaxed text-blue-50 sm:text-lg">
                Join our specialized coaching programs and get access to
                exclusive mock tests, personal mentoring, and board-certified
                study materials.
              </p>

              {/* OFFER FEATURES */}

              <ul className="relative z-10 mb-10 space-y-4">
                {[
                  "Personalized Learning Path",
                  "Expert Faculty Support",
                  "Weekly Mock Assessments",
                  "Comprehensive Study Material",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm font-bold sm:text-base"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400/30 text-blue-200">
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>

              {/* CONSULTATION BUTTON */}

              <ConsultationEnquiryButton
                label="Book a Consultation"
                requestType="consultation"
                source="homepage"
                className="relative z-10 mt-auto inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-white px-4 py-4 text-center text-base font-black text-blue-800 shadow-xl transition-all hover:scale-[1.02] hover:bg-blue-50 sm:py-5 sm:text-lg"
              />
            </article>
          </div>
        </div>
      </RevealOnScroll>
    </main>
  );
}
