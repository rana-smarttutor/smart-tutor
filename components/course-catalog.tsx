"use client";

import { useEffect, useState } from "react";

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
      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => setSelectedCourse(course)}
            className="surface rounded-[1.8rem] p-6 text-left"
          >
            <p className="keyword-line">{course.tagline}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {course.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--color-accent)]">
              {course.audienceLabel}
            </p>
            <p className="mt-6 text-sm leading-7 text-[var(--color-muted)]">
              {course.description}
            </p>

            <div className="mt-5 grid gap-3">
              <div className="surface-soft rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Duration
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
                  {course.duration}
                </p>
              </div>
              <div className="surface-soft rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Mode
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
                  {course.mode}
                </p>
              </div>
              <div className="surface-soft rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Included branches
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
                  {course.branchesIncluded.join(", ")}
                </p>
              </div>
            </div>

            <span className="mt-5 inline-flex text-sm font-semibold text-[var(--color-accent)]">
              View full details
            </span>
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
            className="surface flex max-h-[calc(100dvh-5.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] sm:max-h-[90vh] sm:rounded-[2rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-soft flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="keyword-line">{selectedCourse.tagline}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-heading)] sm:text-3xl">
                  {selectedCourse.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="surface flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-[var(--color-heading)]"
                aria-label="Close course details"
              >
                x
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
