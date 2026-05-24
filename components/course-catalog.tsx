"use client";

import { useEffect, useState } from "react";

import type { CourseItem } from "@/lib/types";

type CourseCatalogProps = {
  courses: CourseItem[];
};

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  const getStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("live")) {
      return "bg-emerald-500 text-white shadow-emerald-100";
    }
    if (s.includes("2 days") || s.includes("3 days")) {
      return "bg-rose-500 text-white shadow-rose-100";
    }
    if (s.includes("1 week") || s.includes("5 days")) {
      return "bg-orange-500 text-white shadow-orange-100";
    }
    if (s.includes("2 weeks")) {
      return "bg-amber-500 text-white shadow-amber-100";
    }
    if (s.includes("1 month")) {
      return "bg-blue-500 text-white shadow-blue-100";
    }
    return "bg-slate-500 text-white shadow-slate-100";
  };

  const getCategoryStyles = (course: CourseItem) => {
    const title = course.title.toLowerCase();
    if (title.includes("icse") || title.includes("igcse") || title.includes("ib")) {
      return "border-purple-500/30 hover:border-purple-500 shadow-purple-50 bg-purple-50/5";
    }
    if (title.includes("state") || title.includes("cbse")) {
      return "border-blue-500/30 hover:border-blue-500 shadow-blue-50 bg-blue-50/5";
    }
    if (course.category.includes("Digital") || course.sections.includes("Skills")) {
      return "border-emerald-500/30 hover:border-emerald-500 shadow-emerald-50 bg-emerald-50/5";
    }
    if (course.category.includes("Competitive")) {
      return "border-orange-500/30 hover:border-orange-500 shadow-orange-50 bg-orange-50/5";
    }
    if (course.category.includes("Government")) {
      return "border-rose-500/30 hover:border-rose-500 shadow-rose-50 bg-rose-50/5";
    }
    return "border-blue-500/30 hover:border-blue-500 shadow-blue-50 bg-blue-50/5";
  };

  useEffect(() => {
    if (!selectedCourse) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCourse(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedCourse]);

  return (
    <>
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {courses.map((course, courseIndex) => (
          <div
            key={`course-${course.id || course.title || "item"}-${courseIndex}`}
            className={`surface group rounded-[2rem] p-5 text-left flex flex-col h-full border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${getCategoryStyles(course)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2">
                  <p className="keyword-line text-[8px]">{course.tagline}</p>
                  <span className={`text-[7px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusStyles(course.statusLabel)} shadow-sm`}>
                    {course.statusLabel}
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight text-[var(--color-heading)] py-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3rem]">
                  {course.title}
                </h2>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {course.title.includes("State") && <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded">STATE</span>}
              {course.title.includes("CBSE") && <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-1.5 py-0.5 rounded">CBSE</span>}
              {course.title.includes("ICSE") && <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded">ICSE</span>}
              {course.title.includes("IGCSE") && <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded">IGCSE</span>}
              {course.title.includes("IB") && <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded">IB</span>}
            </div>

            <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-blue-500/80">
              {course.audienceLabel}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)] flex-grow line-clamp-3">
              {course.description}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2">
              <div className="surface-soft rounded-2xl p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Mode
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--color-heading)] truncate">
                  {course.mode}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setSelectedCourse(course)}
                className="w-full text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-blue-50"
              >
                View Full Program <span>→</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/contact"
                  className="flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2.5 text-[10px] font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  Hire Home Tutor
                </a>

                <a
                  href="/contact"
                  className="flex items-center justify-center rounded-xl border-2 border-blue-600 px-3 py-2.5 text-[10px] font-bold text-blue-600 transition-all hover:bg-blue-50 active:scale-95"
                >
                  Online Tutor
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-12 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
          <div className="flex-grow">
            <h3 className="text-2xl font-bold">
              Personalized Tutoring Solutions
            </h3>

            <p className="mt-2 text-blue-100">
              Smart Tutors specializes in{" "}
              <strong>Personal Home Tutoring</strong> and{" "}
              <strong>Interactive Online Tutoring</strong>. Our mentors visit
              your home or connect digitally to ensure you get 1-on-1 focus and
              academic excellence across all academic and digital streams.
            </p>
          </div>

          <a
            href="/contact"
            className="shrink-0 rounded-full bg-white px-8 py-4 font-bold text-blue-700 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Book a Free Consultation
          </a>
        </div>
      </div>

      {selectedCourse ? (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-end justify-center p-2 pt-20 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selectedCourse.title}
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="surface flex max-h-[calc(100dvh-5.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] sm:max-h-[90vh] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-soft flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-6 sm:px-8">
              <div className="min-w-0">
                <p className="keyword-line text-xs">
                  {selectedCourse.tagline}
                </p>

                <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[var(--color-heading)] sm:text-3xl">
                  {selectedCourse.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[var(--color-heading)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                aria-label="Close course details"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-5 pt-4 sm:px-6 sm:pb-8 sm:pt-5">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                {selectedCourse.description}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Duration
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
                    {selectedCourse.duration}
                  </p>
                </div>

                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Mode
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
                    {selectedCourse.mode}
                  </p>
                </div>

                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Audience
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
                    {selectedCourse.audienceLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="surface-soft rounded-3xl p-5 lg:col-span-2">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    Course names included
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedCourse.courseNamesIncluded.map((item, index) => (
                      <span
                        key={`course-name-${item}-${index}`}
                        className="surface rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-heading)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    Branches included
                  </p>

                  <div className="mt-4 grid gap-2">
                    {selectedCourse.branchesIncluded.map((item, index) => (
                      <p
                        key={`branch-${item}-${index}`}
                        className="text-sm leading-6 text-[var(--color-muted)]"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    Subjects covered
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedCourse.subjectsCovered.map((item, index) => (
                      <span
                        key={`subject-${item}-${index}`}
                        className="surface rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-heading)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {selectedCourse.points.map((point, index) => (
                    <div
                      key={`point-${index}-${point}`}
                      className="surface-soft rounded-3xl p-5"
                    >
                      <p className="text-sm leading-7 text-[var(--color-heading)]">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}