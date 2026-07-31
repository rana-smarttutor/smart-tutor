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
import { LiveClock } from "@/components/live-clock";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getPublicInstituteData } from "@/lib/data-store";
import { PlacedStudentsWall } from "@/components/placed-students-wall";
import { StudentCarousel } from "@/components/student-carousel";
import { GrandSuccessCarousel } from "@/components/grand-success-carousel";
import HomeToppers from "@/components/home-toppers";
import { courseLibrary } from "@/lib/course-library";
import { CampusHighlightsCarousel } from "@/components/campus-highlights-carousel";
import { ProgramCarousel } from "@/components/program-carousel";
import { FeaturesSection } from "@/components/features-section";

export const metadata: Metadata = {
  description:
    "Find the best personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams, Digital Courses, and Skill Development Programs. Learn with expert teachers through live classes, one-to-one mentoring, recorded lectures, study materials, mock tests, performance analytics, Library Support and complete career guidance.",
  alternates: {
    canonical: "https://smarttutors.co.in",
  },
};

export const dynamic = "force-dynamic";

const roleAccentMap = {
  student: "from-blue-50 to-white",
  educator: "from-purple-50 to-white",
  admin: "from-emerald-50 to-white",
  parent: "from-orange-50 to-white",
} as const;

const metricStyleMap: Record<
  string,
  { icon: ReactNode; color: string; bg: string }
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

export default async function Home() {
  const data = await getPublicInstituteData();

  // Manually defined roles to ensure 4 cards
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

  const programCarouselItems = data.programs.map((program) => ({
    ...program,
    targetTab: "overview",
  }));

  return (
    <main className="relative overflow-hidden pb-16 pt-2">
      <section className="section-shell grid gap-8 pt-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <RevealOnScroll className="h-full space-y-7 text-center lg:text-left w-full max-w-full">
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Admissions | Exams | Placement
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

          <div className="space-y-5">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600 md:text-[11px]">
              India&apos;s No.1 Trusted Smart Learning Platform
            </p>

            <h1 className="mx-auto max-w-[680px] font-serif text-[2.35rem] font-black leading-[1.05] tracking-[-0.035em] text-[var(--color-heading)] sm:text-[3.6rem] lg:text-[4.15rem] xl:mx-0 xl:max-w-[720px]">
              Get Smart Results
              <br />
              <span className="relative inline-block whitespace-nowrap text-blue-600 ">
                With Smart Tutors.
                <svg
                  className="absolute -bottom-2 left-[72%] h-3.5 w-[34%] -translate-x-1/2 sm:-bottom-3 sm:h-4"
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
            </h1>

            <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-[var(--color-muted)] sm:text-lg xl:mx-0">
              Smart Tutors offers thoughtfully designed{" "}
              <strong>courses for every stage of a learner's journey</strong>.
              From school academics and board preparation to competitive exams,
              government exams, and future-ready digital skills, our courses
              combine expert mentoring, structured learning, and focused
              practice to help students achieve meaningful academic and career
              growth.
            </p>
          </div>

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
                className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.523 15.3414C17.068 15.3414 16.699 15.7114 16.699 16.1654V18.1564C16.699 18.3304 16.558 18.4714 16.384 18.4714H7.616C7.442 18.4714 7.301 18.3304 7.301 18.1564V16.1654C7.301 15.7104 6.932 15.3414 6.477 15.3414C6.022 15.3414 5.653 15.7114 5.653 16.1654V18.1564C5.653 19.2384 6.534 20.1194 7.616 20.1194H16.384C17.466 20.1194 18.347 19.2384 18.347 18.1564V16.1654C18.347 15.7114 17.978 15.3414 17.523 15.3414Z" />
                <path d="M11.364 15.1194C11.538 15.2934 11.765 15.3744 12 15.3744C12.235 15.3744 12.462 15.2934 12.636 15.1194L15.753 12.0024C16.089 11.6664 16.089 11.1214 15.753 10.7854C15.417 10.4494 14.872 10.4494 14.536 10.7854L12.824 12.4974V4.70642C12.824 4.23042 12.438 3.84442 11.962 3.84442C11.486 3.84442 11.1 4.23042 11.1 4.70642V12.4974L9.388 10.7854C9.052 10.4494 8.507 10.4494 8.171 10.7854C7.835 11.1214 7.835 11.6664 8.171 12.0024L11.364 15.1194Z" />
              </svg>
              Download Android App
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-8">
            {data.metrics.map((metric) => {
              const style = metricStyleMap[metric.label] ?? fallbackMetricStyle;

              return (
                <article
                  key={metric.label}
                  className="group flex flex-row items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:flex-col md:items-start sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-1"
                >
                  <div
                    className={`${style.bg} ${style.color} w-10 h-10 sm:w-12 sm:h-12 md:mb-4 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}
                  >
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <CountUpValue
                      value={metric.value}
                      className="text-lg md:text-2xl font-extrabold text-slate-900 tracking-tight"
                    />
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 truncate">
                      {metric.label}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 opacity-80 grayscale hover:grayscale-0 transition-all justify-center lg:justify-start">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Recognized By
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-8 items-center justify-center">
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap">
                ISO 9001:2015
              </span>
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap">
                MSME Certified
              </span>
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap">
                Digital India
              </span>
            </div>
          </div>

          <div className="pt-10 border-t border-[var(--color-border)] mt-10">
            <div className="relative isolate overflow-hidden rounded-4xl p-6 sm:p-10 shadow-xl transition-all duration-500 hover:shadow-blue-500/10 border border-blue-100 group bg-white">
              <div className="absolute top-0 right-0 -z-10 h-100 w-100 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/30 transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 blur-[80px] rounded-full -translate-x-1/4 translate-y-1/4 group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />

              <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-10 items-center text-center lg:text-left">
                <div className="max-w-2xl mx-auto lg:mx-0">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-6">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                    Limited Slots for 2026-27
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                    Ready to Start Your{" "}
                    <span className="text-blue-600">Journey?</span>
                  </h3>
                  <p className="text-lg text-[var(--color-muted)] mb-0 leading-relaxed font-medium">
                    Join 500+ students already excelling with Smart Tutors. Get
                    access to expert mentoring and disciplined preparation.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[240px] justify-center lg:justify-start">
                  <Link
                    href="/login"
                    className="group/btn relative inline-flex h-14 items-center justify-center gap-3 bg-blue-600 text-white px-8 rounded-xl font-black text-base transition-all hover:bg-blue-700 hover:scale-[1.02] shadow-xl shadow-blue-500/25 active:scale-95 overflow-hidden"
                  >
                    Enroll Now
                  </Link>

                  <a
                    href="https://wa.me/918850447887"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-14 items-center justify-center gap-3 bg-emerald-50 text-emerald-700 px-8 rounded-xl font-black text-base border-2 border-emerald-100 transition-all hover:bg-emerald-100 hover:scale-[1.02] active:scale-95"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="flex h-full min-w-0 flex-col gap-4" delayMs={90}>
          <div className="surface graph-paper rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="mb-8">
              <p className="section-label">Campus Highlights</p>

              <h2 className="section-title mt-2 text-left text-3xl sm:text-3xl">
                Visible trust, visible outcomes
              </h2>
            </div>

            <CampusHighlightsCarousel />
          </div>

          <div className="surface rounded-xl p-6 hover:shadow-xl transition-all flex flex-1 items-center justify-center min-h-[300px]">
            <Image
              src="/WhySmartTutor3.png"
              alt="Why Choose Smart Tutors"
              width={1280}
              height={1180}
              className="h-auto w-full rounded-[2rem]"
              priority
            />
          </div>
        </RevealOnScroll>
      </section>

      <section className="pt-14 sm:pt-20 pb-0">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
              Academic Excellence
            </span>
            <h2 className="text-3xl md:text-6xl font-black tracking-tight text-[var(--color-heading)] mb-6">
              Recent Results
            </h2>
            <p className="text-[var(--color-muted)] text-sm sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
              Smart Tutors honors the dedication and remarkable achievements of
              our students. Our proven track record defines our commitment to
              academic brilliance.
            </p>
          </div>

          <GrandSuccessCarousel />

          <div className="mt-12">
            <HomeToppers />
          </div>
        </div>
      </section>

      <RevealOnScroll className="section-shell py-10 lg:py-16" delayMs={100}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
              Our Methodology
            </span>
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-5xl mb-6">
              Programs Mapped to Every Stage of Growth
            </h2>
            <p className="text-[var(--color-muted)] text-base sm:text-lg font-medium">
              We provide a complete educational pathway from school foundation
              to high-level government service and future digital skills.
            </p>
          </div>

          <ProgramCarousel programs={programCarouselItems} />

          <div className="mt-10 sm:mt-16 text-center">
            <Link
              href="/courses"
              className="action-button px-10 py-5 text-lg shadow-2xl"
            >
              Explore All {courseLibrary.length}+ Programs
            </Link>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="section-shell py-16" delayMs={40}>
        <div className="mb-10 max-w-5xl text-left">
          <p className="section-label mb-3 !text-sm sm:!text-base">Roles</p>

          <h2 className="section-title leading-[1.12]">
            One system for Students, Educators, Parents.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {homeRoles.map((role) => (
            <article
              key={role.role}
              className={`surface rounded-xl bg-gradient-to-br ${roleAccentMap[role.role as keyof typeof roleAccentMap]} p-6 text-center lg:text-left hover:shadow-2xl hover:translate-y-[-4px] transition-all border-blue-100/50 flex flex-col h-full`}
            >
              <p className="keyword-line uppercase tracking-widest text-[10px] font-black">
                {role.role}
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--color-heading)]">
                {role.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] font-medium flex-grow">
                {role.summary}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[var(--color-heading)] font-bold">
                {role.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="section-shell py-14" delayMs={80}>
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface flex h-full flex-col rounded-xl p-8 transition-all hover:shadow-xl">
            <div className="mb-8">
              <p className="section-label">Upcoming Exam Updates</p>
              <h2 className="section-title">
                Stay updated with the Smart Tutors
              </h2>
            </div>

            <div className="space-y-6">
              <div className="surface-soft rounded-xl p-6 border-l-4 border-blue-600 hover:bg-blue-50 transition-colors">
                <span className="pill mb-3 bg-blue-100 text-blue-700 border-none font-bold">
                  All boards/Competative Exam  Update
                </span>
                <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2">
                  CBSE Board Exam Phase 2 Schedule
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                  Phase 2 (Improvement/Compartment) exams for Class 10 are
                  scheduled from May 15 to June 1, 2026. Over 6.6 lakh students
                  have registered for this phase.
                </p>
              </div>

              <div className="surface-soft rounded-xl p-6 border-l-4 border-indigo-600 hover:bg-indigo-50 transition-colors">
                <span className="pill mb-3 bg-indigo-100 text-indigo-700 border-none font-bold">
                  Government Exam Update
                </span>
                <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2">
                  Civil Services Prelims 2026
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                  The UPSC CSE Preliminary Exam is set for May 24, 2026.
                  Candidates are advised to begin their final revision cycles
                  focusing on current affairs.
                </p>
              </div>

              <div className="surface-soft rounded-xl p-6 border-l-4 border-emerald-600 hover:bg-emerald-50 transition-colors">
                <span className="pill mb-3 bg-emerald-100 text-emerald-700 border-none font-bold">
                  Prime Digital School
                </span>
                <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2">
                  comming soon
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                  Prime Digital School empowers students with future-ready digital skills, practical learning, and technology-focused education.
                </p>
              </div>
            </div>
          </article>

          <div className="flex h-full flex-col">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#1e40af] via-[#3730a3] to-[#4338ca] p-10 text-white shadow-2xl transition-all hover:scale-[1.02]">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all"></div>
              <p className="text-blue-200 text-sm font-black uppercase tracking-[0.2em] mb-3 relative z-10">
                Promotional Offer
              </p>
              <h2 className="text-4xl font-black leading-tight mb-4 drop-shadow-md relative z-10">
                Advance Your Career with Smart Tutors
              </h2>
              <p className="text-blue-50 text-lg leading-relaxed mb-8 font-medium relative z-10">
                Join our specialized coaching programs and get access to
                exclusive mock tests, personal mentoring, and board-certified
                study materials.
              </p>
              <ul className="space-y-4 mb-10 relative z-10">
                {[
                  "Personalized Learning Path",
                  "Expert Faculty Support",
                  "Weekly Mock Assessments",
                  "Comprehensive Study Material",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-base font-bold"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400/30 text-blue-200">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className=" mt-auto inline-flex items-center justify-center w-full py-5 bg-white text-blue-800 font-black text-lg rounded-xl hover:bg-blue-50 transition-all hover:scale-105 shadow-xl relative z-10"
              >
                Book a Consultation
              </Link>
            </article>
          </div>
        </div>
      </RevealOnScroll>
    </main>
  );
}
