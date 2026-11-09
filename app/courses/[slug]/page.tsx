import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import CourseCategoryHub from "@/components/course-category-hub";
import CourseBoardSyllabus from "@/components/course-board-syllabus";
import {
  COURSE_SITE_URL,
  coursePageRegistry,
  getCourseHubBySlug,
  getCoursePageBySlug,
  getCoursePageSlugs,
  getCoursePageUrl,
} from "@/lib/course-page-registry";
import { getCourseSeoContent } from "@/lib/course-seo-content";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return getCoursePageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = getCourseHubBySlug(slug);
  if (hub) {
    const url = getCoursePageUrl(slug);
    return {
      title: { absolute: hub.title },
      description: hub.introduction,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        title: hub.title,
        description: hub.introduction,
        url,
        siteName: "SmartIQ Institute",
      },
      robots: { index: false, follow: true },
    };
  }
  const course = getCoursePageBySlug(slug);
  if (!course)
    return {
      title: "Course Not Found",
      robots: { index: false, follow: false },
    };
  const title = `${course.name} | SmartIQ Institute`;
  const url = getCoursePageUrl(slug);
  return {
    title: { absolute: title },
    description: course.introduction,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description: course.introduction,
      url,
      siteName: "SmartIQ Institute",
    },
    robots: { index: false, follow: true },
  };
}

const categoryUrls: Record<string, string> = {
  "School Tuition": "/courses/school-tuition",
  "Junior College": "/courses/junior-college",
  "Entrance Exams": "/courses/entrance-exams",
  "Government Exams": "/courses/government-exams",
  "Skill Courses": "/courses/skill-courses",
};

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const hub = getCourseHubBySlug(slug);
  if (hub) return <CourseCategoryHub hub={hub} />;
  const course = getCoursePageBySlug(slug);
  if (!course) notFound();

  const seoContent = getCourseSeoContent(slug);
  const enquiryUrl = `/courses?enquire=${encodeURIComponent(slug)}`;
  const url = getCoursePageUrl(slug);
  const categoryHref = categoryUrls[course.category] ?? "/courses";
  const related = coursePageRegistry
    .filter(
      (item) =>
        item.slug !== slug &&
        item.category === course.category &&
        getCoursePageBySlug(item.slug) !== null,
    )
    .slice(0, 4);
  const subjects =
    seoContent?.syllabus ??
    (course.programme
      ? []
      : course.source.subjectsCovered.map((subject) => ({
          subject,
          topics: [],
        })));
  const steps = seoContent?.preparation ?? [];
  const faqs = seoContent?.faqs ?? [];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.name,
        description: course.introduction,
        url,
        provider: {
          "@type": "EducationalOrganization",
          name: "SmartIQ Institute",
          url: COURSE_SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: COURSE_SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Courses",
            item: `${COURSE_SITE_URL}/courses`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: course.category,
            item: `${COURSE_SITE_URL}${categoryHref}`,
          },
          { "@type": "ListItem", position: 4, name: course.name, item: url },
        ],
      },
      ...(faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#102143]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* Reference page 3: compact navy hero, white enquiry card */}
      <section className="bg-gradient-to-r from-[#0A1C44] via-[#0B2861] to-[#0A56B7] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-11 sm:px-6 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-xs leading-5 text-blue-100"
            >
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              /{" "}
              <Link href="/courses" className="hover:underline">
                Courses
              </Link>{" "}
              /{" "}
              <Link href={categoryHref} className="hover:underline">
                {course.category}
              </Link>{" "}
              / <span aria-current="page">{course.name}</span>
            </nav>
            <p className="mt-6 text-[11px] font-bold tracking-[0.14em] text-blue-200">
              {course.category.toUpperCase()}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {course.name}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              {course.introduction}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={enquiryUrl}
                className="inline-flex items-center justify-center rounded-lg bg-[#2769EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Enquire About Admission
              </Link>
              <a
                href="#course-syllabus"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#102143] hover:bg-blue-50"
              >
                Explore Syllabus
              </a>
            </div>
          </div>
          <aside className="hidden rounded-2xl bg-white p-7 text-[#102143] shadow-lg lg:block">
            <p className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {course.category}
            </p>
            <h2 className="mt-4 text-xl font-bold">{course.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Contact SmartIQ for current learning options and admission
              details.
            </p>
            <Link
              href={enquiryUrl}
              className="mt-6 inline-flex rounded-lg bg-[#2769EB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Request Course Details
            </Link>
          </aside>
        </div>
      </section>

      {/* Reference page 3/4: horizontal scrollable anchors */}
      <nav
        aria-label="Course sections"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 py-4 text-sm font-semibold sm:px-6 lg:px-8">
          <a
            href="#course-overview"
            className="shrink-0 text-blue-700 hover:underline"
          >
            Overview
          </a>
          <a
            href="#course-syllabus"
            className="shrink-0 text-slate-700 hover:text-blue-700"
          >
            Syllabus
          </a>
          <a
            href="#course-preparation"
            className="shrink-0 text-slate-700 hover:text-blue-700"
          >
            Preparation
          </a>
          <a
            href="#course-faqs"
            className="shrink-0 text-slate-700 hover:text-blue-700"
          >
            FAQs
          </a>
          <a
            href="#related-courses"
            className="shrink-0 text-slate-700 hover:text-blue-700"
          >
            Related Courses
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-11 sm:px-6 sm:py-14 lg:px-8">
        {/* Overview + compact information box */}
        <section id="course-overview" className="scroll-mt-20">
          <div className="grid gap-7 lg:grid-cols-[1fr_330px] lg:items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                About {course.name}
              </h2>
              <div className="mt-4 max-w-3xl space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
                {seoContent?.overview.length ? (
                  seoContent.overview.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p>{course.introduction}</p>
                )}
              </div>
            </div>
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Course Info
              </p>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Category</span> ·{" "}
                {course.category}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Mode</span> ·
                Contact for options
              </p>
            </aside>
          </div>
        </section>

        {/* BOARD-SPECIFIC SCHOOL SYLLABUS / STANDARD COURSE SYLLABUS */}
        {/^class-(6|7|8|9|10|11|12)-tuition$/.test(slug) ? (
          <CourseBoardSyllabus
            grade={Number(slug.match(/^class-(\d+)-tuition$/)?.[1])}
          />
        ) : (
          <section id="course-syllabus" className="scroll-mt-20">
            <h2 className="text-2xl font-bold tracking-tight">Syllabus</h2>

            <p className="mt-2 text-sm text-slate-500">
              Key topics for the programme; confirm the current official
              syllabus where applicable.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <article
                  key={subject.subject}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="hidden md:block">
                    <h3 className="text-base font-bold">{subject.subject}</h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {subject.topics.slice(0, 4).join(" · ") ||
                        "Explore subject information"}
                    </p>
                  </div>

                  <details className="group md:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-bold">
                      {subject.subject}

                      <span className="text-xl font-normal text-slate-800 group-open:hidden">
                        +
                      </span>

                      <span className="hidden text-xl font-normal group-open:inline">
                        −
                      </span>
                    </summary>

                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                      {subject.topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  </details>

                  {subject.topics.length > 0 && (
                    <details className="group mt-4 hidden md:block">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        Expand all topics
                        <ChevronDown
                          size={13}
                          className="group-open:rotate-180"
                        />
                      </summary>

                      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                        {subject.topics.map((topic) => (
                          <li key={topic}>{topic}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="course-preparation" className="scroll-mt-20">
          <h2 className="text-2xl font-bold tracking-tight">
            Preparation roadmap
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2769EB] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm leading-7 text-slate-600">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {faqs.length > 0 && (
          <section id="course-faqs" className="scroll-mt-20">
            <h2 className="text-2xl font-bold tracking-tight">FAQs</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold sm:text-base">
                    <span>{faq.question}</span>
                    <span className="text-lg group-open:hidden">+</span>
                    <span className="hidden text-lg group-open:inline">−</span>
                  </summary>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section id="related-courses" className="scroll-mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Related courses</h2>
          {related.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <article
                  key={item.slug}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                    {item.introduction}
                  </p>
                  <Link
                    href={`/courses/${item.slug}`}
                    className="mt-5 self-start rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    View Course
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <Link
              href={categoryHref}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              View Category <ArrowRight size={16} />
            </Link>
          )}
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-[#0A1C44] to-[#0A56B7] px-6 py-11 text-center text-white sm:px-10 sm:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to Explore {course.name}?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-100">
            Contact SmartIQ Institute for current options and admission
            information.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={enquiryUrl}
              className="rounded-lg bg-[#2769EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Enquire About Admission
            </Link>
            <Link
              href="/courses"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#102143] hover:bg-blue-50"
            >
              Explore All Courses
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
