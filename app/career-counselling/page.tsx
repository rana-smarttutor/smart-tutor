
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Career Counselling | SmartIQ Institute",
  description:
    "Career counselling for Class 6–12 students, college students and graduates. Explore your interests, study habits and career goals with SmartIQ Institute.",
};

const AUDIENCES = [
  {
    level: "6 to 8",
    title: "Build habits, find interests",
    description:
      "Study routine, strong basics, olympiads and hobbies.",
  },
  {
    level: "9 to 10",
    title: "Choose the right stream",
    description:
      "Science, Commerce or Arts, based on interests and aptitude, not pressure.",
  },
  {
    level: "11 to 12",
    title: "Pick courses and entrance exams",
    description:
      "Degree options, entrance exams and a preparation plan.",
  },
  {
    level: "College+",
    title: "Government jobs and other careers",
    description:
      "UPSC, SSC, Banking, Railway, Law, MBA, private jobs and higher studies.",
  },
];

const PROCESS = [
  {
    number: "1",
    status: "Required",
    title: "Career counselling form",
    description:
      "Five short steps: about you, education, interests and goals, daily routine and study habits, and review.",
    featured: true,
  },
  {
    number: "2",
    status: "Optional",
    title: "Aptitude test",
    description:
      "Around 50 minutes online. Explore reasoning, numbers, language, spatial thinking, accuracy and interests.",
    featured: false,
  },
  {
    number: "3",
    status: "Optional",
    title: "Result and report",
    description:
      "A counsellor-reviewed career report with next steps, available for viewing and sharing once approved.",
    featured: false,
  },
];

const FACTORS = [
  {
    title: "Academics",
    description:
      "Marks, stronger and weaker subjects, and exams already attempted.",
  },
  {
    title: "Interests and strengths",
    description:
      "What you enjoy, your skills and the kind of work you prefer.",
  },
  {
    title: "Sleep and wake-up time",
    description:
      "Rest, daily timing and habits that support learning.",
  },
  {
    title: "Screen time",
    description:
      "Time spent on learning, entertainment, games and conversations.",
  },
  {
    title: "Study sitting capacity",
    description:
      "How long you can focus now and how to build that ability gradually.",
  },
  {
    title: "Family and practical needs",
    description:
      "Family expectations, budget and whether moving cities is practical.",
  },
];

const shareText = encodeURIComponent(
  "SmartIQ Institute Career Counselling: Explore your interests, education, goals and study habits. Start here: https://smartiqinstitute.in/career-counselling",
);

export default function CareerCounsellingPage() {
  return (
    <main className="min-h-screen bg-[#F3F6FC] text-[#0F1B33]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-14 px-5 py-10 sm:px-6 sm:py-12 lg:gap-16">
        {/* HERO SECTION */}
        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <div className="flex flex-col items-start gap-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#1D4ED8] sm:text-sm">
              Career counselling · Class 6 to graduates
            </p>

            <h1 className="max-w-[660px] text-[35px] font-extrabold leading-[1.07] tracking-[-0.035em] text-[#0B1F4B] sm:text-5xl lg:text-[50px]">
              Find the right career path, with a plan
              you can follow every day.
            </h1>

            <p className="max-w-[595px] text-base leading-7 text-[#33415C] sm:text-lg sm:leading-8">
              Tell us about your studies, your interests
              and your daily routine. A SmartIQ
              counsellor reviews your answers and helps
              you understand which paths may suit you,
              what to do next and how to build a
              sustainable study plan.
            </p>

            <div className="flex w-full flex-wrap items-center gap-3">
              <Link
                href="/career-counselling/about-you"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-[#2563EB] px-6 py-3 text-center text-base font-bold text-white transition hover:bg-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start career counselling
                <ArrowRight
                  size={19}
                  aria-hidden="true"
                />
              </Link>

              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md border-2 border-[#2563EB] bg-white px-5 py-3 text-center text-sm font-bold text-[#1D4ED8] transition hover:bg-[#EAF1FE] sm:text-base"
              >
                <MessageCircle
                  size={19}
                  aria-hidden="true"
                />
                Share on WhatsApp
              </a>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4A5872]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  size={15}
                  className="text-[#2563EB]"
                  aria-hidden="true"
                />
                Free to fill the form
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock3
                  size={15}
                  className="text-[#2563EB]"
                  aria-hidden="true"
                />
                About 10–15 minutes
              </span>

              <span className="inline-flex items-center gap-1.5">
                <UsersRound
                  size={15}
                  className="text-[#2563EB]"
                  aria-hidden="true"
                />
                Parents can help
              </span>
            </div>
          </div>

          {/* WHO IS IT FOR */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold text-[#0B1F4B]">
              Who is it for?
            </h2>

            {AUDIENCES.map((audience, index) => (
              <div
                key={audience.level}
                className={`flex items-start gap-4 rounded-lg border-[1.5px] bg-white p-4 ${
                  index === AUDIENCES.length - 1
                    ? "border-[#2563EB]"
                    : "border-[#C5CFE0]"
                }`}
              >
                <span
                  className={`min-w-[72px] shrink-0 rounded px-2 py-1 text-center text-sm font-extrabold ${
                    index === AUDIENCES.length - 1
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#EAF1FE] text-[#1D4ED8]"
                  }`}
                >
                  {audience.level}
                </span>

                <div className="min-w-0">
                  <h3 className="font-extrabold text-[#0B1F4B]">
                    {audience.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-[#4A5872]">
                    {audience.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          aria-labelledby="career-process-heading"
          className="space-y-5"
        >
          <h2
            id="career-process-heading"
            className="text-[28px] font-extrabold text-[#0B1F4B] sm:text-3xl"
          >
            How it works
          </h2>

          <ol className="grid gap-4 md:grid-cols-3">
            {PROCESS.map((item) => (
              <li
                key={item.number}
                className={`flex flex-col gap-3 rounded-lg border-[1.5px] p-6 ${
                  item.featured
                    ? "border-[#0B1F4B] bg-[#0B1F4B] text-white"
                    : "border-[#C5CFE0] bg-white text-[#0B1F4B]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-5xl font-extrabold leading-none ${
                      item.featured
                        ? "text-[#F2B705]"
                        : "text-[#2563EB]"
                    }`}
                  >
                    {item.number}
                  </span>

                  <span
                    className={`rounded px-2.5 py-1 text-xs font-bold ${
                      item.featured
                        ? "bg-[#F2B705] text-[#0B1F4B]"
                        : "border border-[#8593AD] text-[#33415C]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold">
                  {item.title}
                </h3>

                <p
                  className={`text-sm leading-6 ${
                    item.featured
                      ? "text-[#DCE5F7]"
                      : "text-[#4A5872]"
                  }`}
                >
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* WHAT YOUR COUNSELLOR LOOKS AT */}
        <section
          aria-labelledby="counselling-factors-heading"
          className="space-y-5"
        >
          <div className="space-y-2">
            <h2
              id="counselling-factors-heading"
              className="text-[28px] font-extrabold text-[#0B1F4B] sm:text-3xl"
            >
              What your counsellor looks at
            </h2>

            <p className="max-w-[720px] text-base leading-7 text-[#4A5872]">
              Marks alone do not decide a career.
              Counselling considers the whole student,
              including the daily habits that make
              a plan practical.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FACTORS.map((factor) => (
              <article
                key={factor.title}
                className="rounded-lg border-[1.5px] border-[#C5CFE0] bg-white p-[18px]"
              >
                <h3 className="font-extrabold text-[#0B1F4B]">
                  {factor.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#4A5872]">
                  {factor.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* PRIVACY NOTICE */}
        <div className="flex flex-wrap items-start gap-3 rounded-lg bg-[#EAF1FE] p-5 text-sm leading-6 text-[#0B1F4B]">
          <ShieldCheck
            size={23}
            className="shrink-0 text-[#2563EB]"
            aria-hidden="true"
          />

          <p className="min-w-0 flex-1">
            Career-counselling information is
            personal. Please read our{" "}
            <Link
              href="/privacy"
              className="font-bold text-[#1D4ED8] underline"
            >
              Privacy Policy
            </Link>{" "}
            before sharing details. A parent or
            guardian should participate when
            the student is under 18.
          </p>
        </div>

        {/* END OF PAGE */}
        <div className="flex items-center gap-2 border-t border-[#C5CFE0] pt-5 text-sm text-[#4A5872]">
          <BookOpenText
            size={19}
            className="text-[#2563EB]"
            aria-hidden="true"
          />

          <span>
            SmartIQ Institute · Career Counselling
          </span>
        </div>
      </div>
    </main>
  );
}
