
"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Atom,
  BookOpen,
  BrainCircuit,
  Code2,
  GraduationCap,
  Landmark,
  Laptop,
  Lightbulb,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

const categories = [
  {
    title: "School Tuition",
    subtitle: "Classes 6–10",
    href: "/courses/school-tuition",
    icon: GraduationCap,
    bg: "bg-[#EFF6FF]",
    iconBg: "bg-[#D8E9FF]",
    color: "text-[#1559BB]",
    border: "border-blue-200",
  },
  {
    title: "Junior College",
    subtitle: "Classes 11–12",
    href: "/courses/junior-college",
    icon: BookOpen,
    bg: "bg-[#F8F2FF]",
    iconBg: "bg-[#EDE0FF]",
    color: "text-violet-700",
    border: "border-violet-200",
  },
  {
    title: "Entrance Exams",
    subtitle: "JEE, NEET, CAT, CLAT",
    href: "/courses/entrance-exams",
    icon: Trophy,
    bg: "bg-[#FFF8F1]",
    iconBg: "bg-[#FFF0DA]",
    color: "text-orange-600",
    border: "border-orange-200",
  },
  {
    title: "Government Exams",
    subtitle: "Banking, SSC, UPSC",
    href: "/courses/government-exams",
    icon: Landmark,
    bg: "bg-[#F0FDF4]",
    iconBg: "bg-[#DCFCE7]",
    color: "text-green-600",
    border: "border-green-200",
  },
  {
    title: "Skill Courses",
    subtitle: "English, Robotics, AI",
    href: "/courses/skill-courses",
    icon: Laptop,
    bg: "bg-[#EFFBFF]",
    iconBg: "bg-[#DDF6FF]",
    color: "text-cyan-600",
    border: "border-cyan-200",
  },
];

function FloatingEducationIllustration() {
  const reduceMotion = useReducedMotion();

  const float = (distance: number, duration: number) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -distance, 0] },
          transition: {
            duration,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[300px] w-full max-w-[500px] sm:h-[340px] lg:h-[360px]"
    >
      {/* Soft radial glow */}
      <div className="absolute inset-x-[8%] top-[8%] h-[82%] rounded-full bg-cyan-400/20 blur-[65px]" />
      <div className="absolute left-[35%] top-[20%] h-44 w-44 rounded-full bg-violet-400/20 blur-[50px]" />

      {/* Orbit circles */}
      <div className="absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 sm:h-[320px] sm:w-[320px]" />
      <div className="absolute left-1/2 top-1/2 h-[215px] w-[215px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:h-[260px] sm:w-[260px]" />

      {/* Decorative stars */}
      <Sparkles className="absolute right-[12%] top-[13%] h-7 w-7 text-yellow-300" />
      <Sparkles className="absolute bottom-[15%] left-[13%] h-5 w-5 text-cyan-200" />

      <span className="absolute left-[22%] top-[13%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_#67e8f9]" />
      <span className="absolute bottom-[15%] right-[19%] h-2.5 w-2.5 rounded-full bg-yellow-300 shadow-[0_0_16px_#fde047]" />

      {/* Main central education card */}
      <motion.div
        {...float(8, 5)}
        className="absolute left-1/2 top-1/2 z-20 flex h-[205px] w-[235px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[35px] border border-white/30 bg-gradient-to-br from-white/25 via-white/15 to-blue-300/10 shadow-[0_25px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:h-[230px] sm:w-[260px]"
      >
        <div className="absolute inset-3 rounded-[27px] border border-white/15" />

        {/* Graduation cap */}
        <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#FFFFFF] via-[#DBEBFF] to-[#8DB8FF] shadow-[0_18px_30px_rgba(0,20,70,0.28)] ring-1 ring-white/70">
          <GraduationCap
            size={66}
            strokeWidth={1.7}
            className="text-[#1252C5] drop-shadow-md"
          />
        </div>

        <div className="relative z-10 mt-5 text-center">
          <p className="text-lg font-extrabold tracking-tight text-white">
            Learn Without Limits
          </p>
          <p className="mt-1 text-xs font-medium text-blue-100">
            Discover your next step
          </p>
        </div>
      </motion.div>

      {/* Books - upper left */}
      <motion.div
        {...float(12, 4.6)}
        className="absolute left-[2%] top-[11%] z-30 flex h-[75px] w-[85px] -rotate-12 items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-[#F8F3FF] to-[#BBA2FF] shadow-[0_16px_30px_rgba(9,13,60,0.26)] sm:left-[7%]"
      >
        <BookOpen
          size={44}
          strokeWidth={1.7}
          className="text-violet-700"
        />
      </motion.div>

      {/* Atom - upper right */}
      <motion.div
        {...float(10, 4.2)}
        className="absolute right-[4%] top-[16%] z-30 flex h-[76px] w-[76px] rotate-12 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-[#E6FAFF] to-[#80DFFF] shadow-[0_16px_30px_rgba(0,25,80,0.25)] sm:right-[7%]"
      >
        <Atom
          size={43}
          strokeWidth={1.8}
          className="text-cyan-700"
        />
      </motion.div>

      {/* Coding - bottom left */}
      <motion.div
        {...float(9, 5.4)}
        className="absolute bottom-[11%] left-[5%] z-30 flex h-[72px] w-[82px] rotate-6 items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-[#EEFFF7] to-[#8DE6B7] shadow-[0_16px_30px_rgba(0,25,55,0.23)] sm:left-[9%]"
      >
        <Code2
          size={43}
          strokeWidth={1.9}
          className="text-emerald-700"
        />
      </motion.div>

      {/* Laptop - bottom right */}
      <motion.div
        {...float(13, 4.8)}
        className="absolute bottom-[9%] right-[3%] z-30 flex h-[75px] w-[90px] -rotate-9 items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-[#FFF8E9] to-[#FFD18D] shadow-[0_16px_30px_rgba(0,25,70,0.25)] sm:right-[8%]"
      >
        <Laptop
          size={46}
          strokeWidth={1.8}
          className="text-orange-700"
        />
      </motion.div>

      {/* Mini AI badge */}
      <motion.div
        {...float(7, 3.8)}
        className="absolute right-[2%] top-[47%] z-30 flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-2 shadow-lg backdrop-blur-md"
      >
        <BrainCircuit size={19} className="text-cyan-200" />
        <span className="text-xs font-bold text-white">AI Skills</span>
      </motion.div>

      {/* Mini learning badge */}
      <motion.div
        {...float(6, 5)}
        className="absolute bottom-[5%] left-[35%] z-30 flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-2 shadow-lg backdrop-blur-md"
      >
        <Lightbulb size={18} className="text-yellow-300" />
        <span className="text-xs font-bold text-white">
          Bright Futures
        </span>
      </motion.div>
    </div>
  );
}

export default function CourseArtifactHero() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(
    () => searchParams.get("search") ?? "",
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    const query = params.toString();

    router.push(query ? `/courses?${query}` : "/courses", {
      scroll: false,
    });
  }

  return (
    <>
      {/* COURSES HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-[#0A1D45] via-[#0D2C65] to-[#0956B7] text-white">
        {/* Background effects */}
        <div className="pointer-events-none absolute -right-32 -top-40 h-[450px] w-[450px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 lg:px-8 lg:py-12">
          {/* LEFT CONTENT */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/5 px-3 py-1.5">
              <Sparkles
                size={14}
                aria-hidden="true"
                className="text-yellow-300"
              />

              <span className="text-[11px] font-bold tracking-[0.17em] text-blue-100">
                EXPLORE. LEARN. SUCCEED.
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[58px] lg:leading-[1.12]">
              Courses{" "}
              <span className="text-white">
                Offered
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Pathways from school to professional and government exam
              preparation.
            </p>

            {/* SEARCH */}
            <form
              onSubmit={submitSearch}
              role="search"
              className="mt-8 flex w-full max-w-[620px] items-center gap-3 rounded-2xl border border-white/20 bg-white p-2 pl-4 text-slate-800 shadow-[0_15px_45px_rgba(0,0,0,0.14)]"
            >
              <Search
                aria-hidden="true"
                size={21}
                className="shrink-0 text-slate-400"
              />

              <input
                aria-label="Search courses"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search skills, exams or boards..."
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#175CFA] px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-700 sm:text-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="relative z-10">
            <FloatingEducationIllustration />
          </div>
        </div>
      </section>

      {/* FIVE CATEGORY CARDS */}
      <nav
        aria-label="Course categories"
        className="relative left-1/2 grid w-[calc(100vw-2rem)] max-w-[1840px] -translate-x-1/2 grid-cols-1 gap-3 px-0 pt-7 sm:w-[calc(100vw-3rem)] sm:grid-cols-2 lg:grid-cols-5"
      >
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <Link
              key={category.href}
              href={category.href}
              className={`group flex min-h-[105px] items-center gap-3 rounded-2xl border ${category.border} ${category.bg} p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${category.iconBg} ${category.color}`}
              >
                <Icon
                  aria-hidden="true"
                  size={26}
                  strokeWidth={2.2}
                />
              </span>

              <span className="min-w-0">
                <span className="block text-base font-extrabold leading-tight text-[#102044] group-hover:text-blue-700">
                  {category.title}
                </span>

                <span className="mt-1.5 block text-xs leading-5 text-slate-600">
                  {category.subtitle}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
