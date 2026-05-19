"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import type { CourseItem } from "@/lib/types";

type CourseCatalogProps = {
  courses: CourseItem[];
};

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

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
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => setSelectedCourse(course)}
            className="surface group rounded-[2rem] p-5 text-left flex flex-col h-full border-2 border-transparent hover:border-blue-500/40 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2">
                  <p className="keyword-line text-[10px]">{course.tagline}</p>
                  <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                </div>
                <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight text-[var(--color-heading)] py-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3rem]">
                  {course.title}
                </h2>
              </div>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-blue-50 p-1 dark:bg-blue-900/20">
                <Image
                  src="/image3.png"
                  alt="Smart Tutors identity"
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              </div>
            </div>
            
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-blue-500/80">
              {course.audienceLabel}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)] flex-grow line-clamp-3">
              {course.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="surface-soft rounded-2xl p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Duration
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--color-heading)] truncate">
                  {course.duration}
                </p>
              </div>
              <div className="surface-soft rounded-2xl p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Mode
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--color-heading)] truncate">
                  {course.mode}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                View Full Program <span>→</span>
              </span>
            </div>
          </button>
        ))}
      </section>

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
                <p className="keyword-line text-xs">{selectedCourse.tagline}</p>
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
                  <p className="text-sm font-semibold text-[var(--color-heading)]">Course names included</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedCourse.courseNamesIncluded.map((item) => (
                      <span
                        key={item}
                        className="surface rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-heading)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">Branches included</p>
                  <div className="mt-4 grid gap-2">
                    {selectedCourse.branchesIncluded.map((item) => (
                      <p key={item} className="text-sm leading-6 text-[var(--color-muted)]">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="surface-soft rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">Subjects covered</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedCourse.subjectsCovered.map((item) => (
                      <span
                        key={item}
                        className="surface rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-heading)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {selectedCourse.points.map((point) => (
                    <div key={point} className="surface-soft rounded-3xl p-5">
                      <p className="text-sm leading-7 text-[var(--color-heading)]">{point}</p>
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
