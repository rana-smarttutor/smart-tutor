import Link from "next/link";
import { ArrowRight } from "lucide-react";

import GovernmentExamSelection from "@/components/government-exam-selection";

import {
  type CourseHubDefinition,
  courseHubRegistry,
  getCoursePageBySlug,
  getCoursesForHub,
} from "@/lib/course-page-registry";

type Props = {
  hub: CourseHubDefinition;
};

const ENTRANCE_EXAM_GROUPS = {
  "mba-entrance-exams": {
    title: "MBA Entrance Exam",
    slugs: ["cat", "cmat", "mba-cet"],
  },
  "law-entrance-exams": {
    title: "Law Entrance Exam",
    slugs: ["clat", "ailet"],
  },
} as const;

const GROUPED_ENTRANCE_SLUGS = new Set([
  "cat",
  "cmat",
  "mba-cet",
  "clat",
  "ailet",
  "mba-entrance-exams",
  "law-entrance-exams",
]);

const GROUPED_GOVERNMENT_SLUGS = new Set([
  // Banking exams
  "ibps-po",
  "ibps-clerk",
  "sbi-po",
  "sbi-clerk",
  "rbi-grade-b",

  // SSC exams
  "ssc-cgl",
  "ssc-chsl",
  "ssc-mts",
  "ssc-cpo",
]);

const ENTRANCE_GROUP_CARDS = [
  {
    slug: "mba-entrance-exams",
    name: "MBA Entrance Exams",
    introduction:
      "Explore management entrance examination preparation for CAT, CMAT and MBA CET, including aptitude, reasoning, verbal ability and examination-focused practice.",
    category: "Entrance Exams",
    isGroup: true,
  },
  {
    slug: "law-entrance-exams",
    name: "Law Entrance Exams",
    introduction:
      "Explore law entrance examination preparation for CLAT and AILET, including English, current affairs, legal reasoning and logical reasoning.",
    category: "Entrance Exams",
    isGroup: true,
  },
];

export default function CourseCategoryHub({ hub }: Props) {
  const courses = getCoursesForHub(hub.category);

  const groupConfig =
    ENTRANCE_EXAM_GROUPS[hub.slug as keyof typeof ENTRANCE_EXAM_GROUPS];

  const isEntranceGroup = Boolean(groupConfig);

  const isMainEntranceHub = hub.slug === "entrance-exams";

  const visibleCourses = courses.filter((course) => {
    // Hide individual MBA and Law examinations
    // from the main Entrance Exams category page.
    if (hub.slug === "entrance-exams") {
      return !GROUPED_ENTRANCE_SLUGS.has(course.slug);
    }

    // Hide individual Banking and SSC examinations
    // from the main Government Exams category page.
    if (hub.slug === "government-exams") {
      return !GROUPED_GOVERNMENT_SLUGS.has(course.slug);
    }

    // All other course categories remain unchanged.
    return true;
  });

  // Group cards use the exact same design
  // as the existing individual course cards.
  const displayCourses = isMainEntranceHub
    ? [
        ...visibleCourses.map((course) => ({
          slug: course.slug,
          name: course.name,
          introduction: course.introduction,
          category: course.category,
          isGroup: false,
        })),
        ...ENTRANCE_GROUP_CARDS,
      ]
    : visibleCourses.map((course) => ({
        slug: course.slug,
        name: course.name,
        introduction: course.introduction,
        category: course.category,
        isGroup: false,
      }));

  const otherHubs = courseHubRegistry.filter(
    (item) =>
      item.slug !== hub.slug &&
      item.slug !== "mba-entrance-exams" &&
      item.slug !== "law-entrance-exams",
  );

  const selectedExams = groupConfig
    ? groupConfig.slugs.flatMap((examSlug) => {
        const exam = getCoursePageBySlug(examSlug);

        return exam
          ? [
              {
                slug: exam.slug,
                name: exam.name,
                description: exam.introduction,
              },
            ]
          : [];
      })
    : [];

  const programmeCount = isEntranceGroup
    ? selectedExams.length
    : displayCourses.length;

  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#122344]">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#0A1D45] via-[#0D2B64] to-[#0956B7] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-xs text-blue-100">
            <Link href="/" className="hover:underline">
              Home
            </Link>

            {" / "}

            <Link href="/courses" className="hover:underline">
              Courses
            </Link>

            {" / "}

            {isEntranceGroup && (
              <>
                <Link
                  href="/courses/entrance-exams"
                  className="hover:underline"
                >
                  Entrance Exams
                </Link>

                {" / "}
              </>
            )}

            <span aria-current="page">{hub.heading}</span>
          </nav>

          <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl">
            {hub.heading}
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
            {hub.introduction}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#available-courses"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              {isEntranceGroup ? "Select Examination" : "Explore Courses"}
            </a>

            <Link
              href="/contact"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#10244A] hover:bg-blue-50"
            >
              Contact Admissions
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <nav
          aria-label="Other course categories"
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <span className="rounded-lg bg-blue-50 px-3 py-2 font-bold text-blue-700">
            {programmeCount} programmes
          </span>

          {otherHubs.map((item) => (
            <Link
              key={item.slug}
              href={`/courses/${item.slug}`}
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100"
            >
              {item.heading
                .replace(" — Classes 6 to 10", "")
                .replace(" — Classes 11 and 12", "")}
            </Link>
          ))}
        </nav>

        <section id="available-courses" className="mt-7 scroll-mt-24">
          {/* MBA / LAW EXAM SELECTION */}
          {isEntranceGroup && groupConfig ? (
            <>
              <GovernmentExamSelection
                title={groupConfig.title}
                exams={selectedExams}
              />

              <div className="mt-7">
                <Link
                  href="/courses/entrance-exams"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
                >
                  ← Back to Entrance Exams
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="sr-only">Available courses</h2>

              {/* ALL CARDS USE THE SAME ORIGINAL DESIGN */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayCourses.map((course) => (
                  <article
                    key={course.slug}
                    className="flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <span className="self-start rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {hub.category}
                    </span>

                    <h3 className="mt-5 text-xl font-bold text-[#112447]">
                      {course.name}
                    </h3>

                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                      {course.introduction}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        View Course
                      </Link>

                      <Link
                        href={
                          course.isGroup
                            ? `/courses/${course.slug}`
                            : `/courses?enquire=${encodeURIComponent(
                                course.slug,
                              )}`
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        {course.isGroup ? "Select Exam" : "Enroll Now"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {displayCourses.length === 0 && (
                <p className="rounded-xl bg-white p-8 text-slate-600">
                  Courses in this category are being prepared.
                </p>
              )}
            </>
          )}
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Explore All Courses
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
