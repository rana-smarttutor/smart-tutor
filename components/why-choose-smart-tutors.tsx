import {
  Award,
  ChartNoAxesCombined,
  ClipboardCheck,
  GraduationCap,
  Laptop,
  MessageCircleQuestion,
  Target,
  UsersRound,
  Layers3,
  BadgeCheck,
  BookOpen,
  FileText,
  Dumbbell,
} from "lucide-react";

const benefits = [
  {
    title: "Parent Teacher Meeting",
    description:
      "Parents can track their child's progress at any time and attend regular parent-teacher meetings.",
    icon: UsersRound,
    tone: "text-blue-600",
    iconBg: "bg-blue-50",
    border: "border-blue-100",
    numberBg: "bg-blue-100",
  },
  {
    title: "Expert Faculty",
    description:
      "Structured classes taught by faculty with more than 10 years of teaching experience.",
    icon: GraduationCap,
    tone: "text-violet-600",
    iconBg: "bg-violet-50",
    border: "border-violet-100",
    numberBg: "bg-violet-100",
  },
  {
    title: "Student Performance Reports",
    description:
      "Detailed reports show each student's strengths, weak areas and progress over time.",
    icon: ChartNoAxesCombined,
    tone: "text-orange-600",
    iconBg: "bg-orange-50",
    border: "border-orange-100",
    numberBg: "bg-orange-100",
  },
  {
    title: "Smart Digital Library",
    description:
      "More than 500 books and study materials you can preview and download with a library subscription.",
    icon: BookOpen,
    tone: "text-green-600",
    iconBg: "bg-green-50",
    border: "border-green-100",
    numberBg: "bg-green-100",
  },
  {
    title: "Mock Tests & Quiz Series",
    description:
      "More than 500 exam-pattern tests and quizzes for Boards, Competitive & Government exams.",
    icon: ClipboardCheck,
    tone: "text-sky-600",
    iconBg: "bg-sky-50",
    border: "border-sky-100",
    numberBg: "bg-sky-100",
  },
  {
    title: "24/7 Doubt Support",
    description:
      "Ask a question at any time and get clear answers from our teachers.",
    icon: MessageCircleQuestion,
    tone: "text-purple-600",
    iconBg: "bg-purple-50",
    border: "border-purple-100",
    numberBg: "bg-purple-100",
  },
  {
    title: "Career Counselling & Personal Mentor",
    description:
      "One-to-one guidance to help students choose the right course and career path, and to help them achieve their goals.",
    icon: Target,
    tone: "text-emerald-600",
    iconBg: "bg-emerald-50",
    border: "border-emerald-100",
    numberBg: "bg-emerald-100",
  },
  {
    title: "Exam-Wise Handbooks",
    description:
      "Compact handbooks for each exam with key concepts, formulas and quick revision notes.",
    icon: FileText,
    tone: "text-blue-600",
    iconBg: "bg-blue-50",
    border: "border-blue-100",
    numberBg: "bg-blue-100",
  },
  {
    title: "Offline + Online Classes + Private Tutor + Recorded Lectures",
    description:
      "Attend at the institute, join live from home, hire a personal tutor or rewatch recorded lectures.",
    icon: Laptop,
    tone: "text-pink-600",
    iconBg: "bg-pink-50",
    border: "border-pink-100",
    numberBg: "bg-pink-100",
  },
  {
    title: "Ground Training & Mock Interview",
    description:
      "Physical ground training plus one-to-one practice interviews with expert feedback.",
    icon: Dumbbell,
    tone: "text-violet-600",
    iconBg: "bg-violet-50",
    border: "border-violet-100",
    numberBg: "bg-violet-100",
  },
] as const;

const kpis = [
  {
    value: "10,000+",
    label: "Students Guided",
    icon: UsersRound,
    tone: "text-blue-600",
  },
  {
    value: "40+",
    label: "Expert Faculty",
    icon: GraduationCap,
    tone: "text-blue-600",
  },
  {
    value: "47+",
    label: "Courses & Programs",
    icon: Layers3,
    tone: "text-violet-600",
  },
  {
    value: "95%",
    label: "Student Satisfaction",
    icon: BadgeCheck,
    tone: "text-violet-700",
  },
] as const;

export default function CoursesWhyChooseSection() {
  return (
    <section
      aria-labelledby="courses-why-title"
      className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1840px] -translate-x-1/2 overflow-hidden rounded-[30px] border border-[#D9E7FF] bg-gradient-to-br from-[#F2F7FF] via-white to-[#EAF3FF] p-4 shadow-sm sm:w-[calc(100vw-3rem)] sm:p-7 xl:p-9"
    >
      {/* SOFT BACKGROUND GLOW */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full bg-blue-200/40 blur-[75px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-violet-200/20 blur-[75px]"
      />

      {/* ================================================
          CENTRED WHY CHOOSE SMARTIQ HEADING
      ================================================= */}
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center py-5 text-center sm:py-8">
        {/* SECTION BADGE */}
        <span className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-5 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-wide text-blue-800 sm:text-xs">
          <Award size={17} className="shrink-0" aria-hidden="true" />
          Why Choose SmartIQ Institute
        </span>

        {/* MAIN TITLE */}
        <h2
          id="courses-why-title"
          className="mt-6 max-w-4xl text-3xl font-black leading-[1.15] tracking-tight text-[#101F40] sm:text-4xl lg:text-5xl"
        >
          A Legacy of <span className="text-[#235CE9]">Academic Growth</span>
        </h2>

        {/* DESCRIPTION */}
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg lg:leading-8">
          From classrooms to career goals — we combine proven teaching methods
          with personalised guidance to help every learner achieve their goals.
        </p>

        {/* DECORATIVE UNDERLINE */}
        <div
          aria-hidden="true"
          className="mt-7 h-1.5 w-24 rounded-full bg-yellow-400"
        />
      </div>

      {/* ================================================
          FULL-WIDTH BENEFIT GRID
      ================================================= */}
      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;

          return (
            <article
              key={benefit.title}
              className={`group relative flex min-h-[170px] flex-col rounded-[20px] border ${benefit.border} bg-white/95 p-4 shadow-[0_4px_12px_rgba(18,35,68,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-lg xl:min-h-[195px]`}
            >
              {/* NUMBER AND ICON */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-black ${benefit.numberBg} ${benefit.tone}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${benefit.iconBg} ${benefit.tone}`}
                >
                  <Icon size={24} aria-hidden="true" />
                </span>
              </div>

              {/* BENEFIT TITLE */}
              <h3 className="mt-3 text-sm font-extrabold leading-snug text-[#112348] sm:text-[15px]">
                {benefit.title}
              </h3>

              {/* BENEFIT DESCRIPTION */}
              <p className="mt-2 text-[12px] leading-[1.55] text-slate-600 sm:text-[13px]">
                {benefit.description}
              </p>
            </article>
          );
        })}
      </div>

      {/* ================================================
          ACHIEVEMENT STATISTICS
      ================================================= */}
      <div
        aria-label="SmartIQ Institute achievements"
        className="relative mt-7 grid grid-cols-2 overflow-hidden rounded-[26px] bg-gradient-to-r from-[#E6F0FF] via-[#F1F6FF] to-[#DCEAFF] px-4 py-5 sm:px-6 lg:grid-cols-4 lg:py-6"
      >
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;

          return (
            <div
              key={kpi.label}
              className={`flex min-w-0 items-center justify-center gap-4 px-3 py-4 sm:gap-5 lg:py-0 ${
                index > 0 ? "lg:border-l lg:border-blue-200" : ""
              } ${
                index % 2 === 1 ? "border-l border-blue-200 lg:border-l" : ""
              } ${index >= 2 ? "border-t border-blue-200 lg:border-t-0" : ""}`}
            >
              <Icon
                size={45}
                strokeWidth={1.8}
                aria-hidden="true"
                className={`shrink-0 ${kpi.tone}`}
              />

              <div className="min-w-0">
                <p className="text-2xl font-black leading-tight tracking-tight text-[#0D1B3C] sm:text-3xl">
                  {kpi.value}
                </p>

                <p className="mt-0.5 text-xs font-medium leading-snug text-[#4B6080] sm:text-sm">
                  {kpi.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
