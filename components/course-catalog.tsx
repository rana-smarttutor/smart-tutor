"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CourseItem } from "@/lib/types";

type CourseCatalogProps = {
  courses: CourseItem[];
};

type CourseGroup = {
  id: string;
  title: string;
  subtitle?: string;
  courses: CourseItem[];
  isFeatureCard?: boolean;
};

const MERGED_CLASS_6_8_TITLE = "Class 6th-8th Regular Academic (State/CBSE)";

function inferBoardLabel(course: CourseItem) {
  const haystack = [
    course.title,
    course.summary,
    course.description,
    course.audienceLabel,
    ...course.courseNamesIncluded,
    ...course.branchesIncluded,
    ...course.subjectsCovered,
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("igcse")) {
    return "IGCSE";
  }
  if (haystack.includes("icse")) {
    return "ICSE";
  }
  if (haystack.includes("cbse")) {
    return "CBSE";
  }
  if (haystack.includes("state")) {
    return "State Board";
  }
  if (haystack.includes("ib")) {
    return "IB";
  }

  return "General Track";
}

function inferModeLabel(course: CourseItem) {
  const normalizedMode = course.mode.trim();

  if (!normalizedMode) {
    return "Flexible Mode";
  }

  const compactMode = normalizedMode.toLowerCase();

  if (compactMode.includes("home") && compactMode.includes("online")) {
    return "Home / Online";
  }
  if (compactMode.includes("home") && compactMode.includes("center")) {
    return "Home / Center";
  }
  if (compactMode.includes("online") && compactMode.includes("personal")) {
    return "Online / Personal";
  }
  if (compactMode.includes("online")) {
    return "Online";
  }
  if (compactMode.includes("home")) {
    return "Home";
  }
  if (compactMode.includes("center")) {
    return "Center";
  }
  if (compactMode.includes("personal")) {
    return "Personal";
  }

  return normalizedMode;
}

function buildCourseGroups(courses: CourseItem[]) {
  const grouped: CourseGroup[] = [];
  const class68Courses: CourseItem[] = [];

  for (const course of courses) {
    const shouldMergeClass68 = course.title === MERGED_CLASS_6_8_TITLE;

    if (shouldMergeClass68) {
      class68Courses.push(course);
      continue;
    }

    grouped.push({
      id: `single:${course.id}`,
      title: course.title,
      courses: [course],
    });
  }

  if (class68Courses.length > 0) {
    const boards = Array.from(new Set(class68Courses.map((course) => inferBoardLabel(course))));
    const modes = Array.from(new Set(class68Courses.map((course) => inferModeLabel(course))));

    grouped.push({
      id: `merged:${MERGED_CLASS_6_8_TITLE}`,
      title: MERGED_CLASS_6_8_TITLE,
      subtitle: `${boards.join(" / ")} | ${modes.join(" / ")}`,
      courses: class68Courses,
      isFeatureCard: true,
    });
  }

  return grouped;
}

function buildVariantLabel(course: CourseItem, index: number) {
  const branchLabel =
    course.branchesIncluded.find((branch) => branch.trim().length > 0) ?? `Program ${index + 1}`;

  const modeLabel = course.mode.trim();
  return modeLabel ? `${branchLabel} | ${modeLabel}` : branchLabel;
}

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const courseGroups = useMemo(() => buildCourseGroups(courses), [courses]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const featureCardRef = useRef<HTMLDivElement | null>(null);
  const featureGroup = courseGroups.find((group) => group.isFeatureCard) ?? null;
  const standardGroups = courseGroups.filter((group) => !group.isFeatureCard);

  const selectedGroup = useMemo(
    () => courseGroups.find((group) => group.id === selectedGroupId) ?? null,
    [courseGroups, selectedGroupId],
  );

  const selectedCourse =
    selectedGroup?.courses.find((course) => course.id === selectedVariantId) ??
    selectedGroup?.courses[0] ??
    null;

  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes("live")) {
      return "bg-emerald-500 text-white shadow-emerald-100";
    }
    if (normalizedStatus.includes("2 days") || normalizedStatus.includes("3 days")) {
      return "bg-rose-500 text-white shadow-rose-100";
    }
    if (normalizedStatus.includes("1 week") || normalizedStatus.includes("5 days")) {
      return "bg-orange-500 text-white shadow-orange-100";
    }
    if (normalizedStatus.includes("2 weeks")) {
      return "bg-amber-500 text-white shadow-amber-100";
    }
    if (normalizedStatus.includes("1 month")) {
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
    if (!selectedGroup) {
      return;
    }

    if (!selectedCourse) {
      setSelectedVariantId(selectedGroup.courses[0]?.id ?? null);
      return;
    }

    const stillExists = selectedGroup.courses.some((course) => course.id === selectedCourse.id);

    if (!stillExists) {
      setSelectedVariantId(selectedGroup.courses[0]?.id ?? null);
    }
  }, [selectedCourse, selectedGroup]);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedGroupId(null);
        setSelectedVariantId(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedGroupId]);

  const openGroup = (group: CourseGroup) => {
    setSelectedGroupId(group.id);
    setSelectedVariantId(group.courses[0]?.id ?? null);
  };

  const closeGroup = () => {
    setSelectedGroupId(null);
    setSelectedVariantId(null);
  };

  const scrollToFeatureCard = () => {
    featureCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      {featureGroup ? (
        <section className="mt-8">
          <div className="surface rounded-[2rem] border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-lg shadow-blue-100/70 transition-all hover:shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">
                  Class 6-8 Spotlight
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--color-heading)] sm:text-3xl">
                  {featureGroup.title}
                </h2>
                {featureGroup.subtitle ? (
                  <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
                    {featureGroup.subtitle}
                  </p>
                ) : null}
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  Explore the full regular academic selector below to choose the right board and
                  tutoring mode for the student.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {featureGroup.courses.slice(0, 4).map((course, index) => (
                    <span
                      key={`sampler-${course.id}`}
                      className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--color-heading)] shadow-sm"
                    >
                      {buildVariantLabel(course, index)}
                    </span>
                  ))}
                  {featureGroup.courses.length > 4 ? (
                    <span className="rounded-full border border-dashed border-blue-300 px-3 py-1.5 text-[11px] font-semibold text-blue-600">
                      +{featureGroup.courses.length - 4} more below
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={scrollToFeatureCard}
                  className="action-button px-6 py-3.5 text-sm"
                >
                  View Full Selector
                </button>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border-2 border-blue-200 bg-white px-6 py-3.5 text-sm font-bold text-blue-700 transition-all hover:bg-blue-50"
                >
                  Ask Admissions
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {[...standardGroups, ...(featureGroup ? [featureGroup] : [])].map((group, groupIndex) => {
          const leadCourse = group.courses[0];
          const variantCount = group.courses.length;
          const boardOptions = Array.from(
            new Set(group.courses.map((course) => inferBoardLabel(course))),
          );
          const modeOptions = Array.from(
            new Set(group.courses.map((course) => inferModeLabel(course))),
          );

          return (
            <div
              key={`course-group-${group.id}-${groupIndex}`}
              ref={group.isFeatureCard ? featureCardRef : null}
              className={`surface group rounded-[2rem] p-5 text-left flex flex-col h-full border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${getCategoryStyles(leadCourse)} ${
                group.isFeatureCard ? "md:col-span-2 xl:col-span-4 p-7 sm:p-8" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="keyword-line text-[8px]">{leadCourse.tagline}</p>
                    <span
                      className={`text-[7px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusStyles(leadCourse.statusLabel)} shadow-sm`}
                    >
                      {leadCourse.statusLabel}
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight text-[var(--color-heading)] py-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3rem]">
                    {leadCourse.title}
                  </h2>

                  {group.subtitle ? (
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      {group.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {leadCourse.title.includes("State") ? (
                  <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                    STATE
                  </span>
                ) : null}
                {leadCourse.title.includes("CBSE") ? (
                  <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                    CBSE
                  </span>
                ) : null}
                {leadCourse.title.includes("ICSE") ? (
                  <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                    ICSE
                  </span>
                ) : null}
                {leadCourse.title.includes("IGCSE") ? (
                  <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                    IGCSE
                  </span>
                ) : null}
                {leadCourse.title.includes("IB") ? (
                  <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                    IB
                  </span>
                ) : null}
                {variantCount > 1 ? (
                  <span className="bg-slate-100 text-slate-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                    {variantCount} OPTIONS
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-blue-500/80">
                {leadCourse.audienceLabel}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)] flex-grow line-clamp-3">
                {leadCourse.description}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <div className="surface-soft rounded-2xl p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Mode
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--color-heading)] truncate">
                    {variantCount > 1 ? `${variantCount} selectable study options` : leadCourse.mode}
                  </p>
                </div>
              </div>

              {group.isFeatureCard ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="surface-soft rounded-[1.75rem] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Available boards
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {boardOptions.map((board) => (
                        <span
                          key={`${group.id}-board-${board}`}
                          className="rounded-full bg-blue-100 px-3 py-1.5 text-[11px] font-bold text-blue-700"
                        >
                          {board}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Available modes
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {modeOptions.map((mode) => (
                        <span
                          key={`${group.id}-mode-${mode}`}
                          className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700"
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="surface-soft rounded-[1.75rem] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Quick view
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.courses.slice(0, 8).map((course, index) => (
                        <span
                          key={`${group.id}-preview-${course.id}`}
                          className="surface rounded-full px-3 py-1.5 text-[11px] font-semibold text-[var(--color-heading)]"
                        >
                          {buildVariantLabel(course, index)}
                        </span>
                      ))}
                    </div>
                    {variantCount > 8 ? (
                      <p className="mt-4 text-sm font-medium text-[var(--color-muted)]">
                        +{variantCount - 8} more options available inside the selector
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : variantCount > 1 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.courses.slice(0, 3).map((course, index) => (
                    <span
                      key={`${group.id}-preview-${course.id}`}
                      className="surface-soft rounded-full px-3 py-1 text-[10px] font-semibold text-[var(--color-heading)]"
                    >
                      {buildVariantLabel(course, index)}
                    </span>
                  ))}
                  {variantCount > 3 ? (
                    <span className="rounded-full border border-dashed border-blue-200 px-3 py-1 text-[10px] font-semibold text-blue-600">
                      +{variantCount - 3} more
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => openGroup(group)}
                  className="w-full text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-blue-50"
                >
                  {group.isFeatureCard
                    ? "Select Class 6-8 Program"
                    : variantCount > 1
                      ? "Choose Program Option"
                      : "View Full Program"}{" "}
                  <span>&rarr;</span>
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
          );
        })}
      </section>

      <div className="mt-12 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
          <div className="flex-grow">
            <h3 className="text-2xl font-bold">Personalized Tutoring Solutions</h3>

            <p className="mt-2 text-blue-100">
              Smart Tutors specializes in <strong>Personal Home Tutoring</strong> and{" "}
              <strong>Interactive Online Tutoring</strong>. Our mentors visit your home or connect
              digitally to ensure you get 1-on-1 focus and academic excellence across all academic
              and digital streams.
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

      {selectedGroup && selectedCourse ? (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-end justify-center p-2 pt-20 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selectedGroup.title}
          onClick={closeGroup}
        >
          <div
            className="surface flex max-h-[calc(100dvh-5.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] sm:max-h-[90vh] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-soft flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-6 sm:px-8">
              <div className="min-w-0">
                <p className="keyword-line text-xs">{selectedCourse.tagline}</p>

                <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[var(--color-heading)] sm:text-3xl">
                  {selectedGroup.title}
                </h3>

                {selectedGroup.subtitle ? (
                  <p className="mt-2 text-sm font-semibold text-blue-600">
                    {selectedGroup.subtitle}
                  </p>
                ) : null}

                {selectedGroup.courses.length > 1 ? (
                  <p className="mt-3 text-sm font-medium text-[var(--color-muted)]">
                    {selectedGroup.isFeatureCard
                      ? "Select the Class 6-8 board and study mode combination that best matches the student."
                      : "Select the Class 6-8 program option that best matches the student&apos;s track."}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeGroup}
                className="surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[var(--color-heading)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                aria-label="Close course details"
              >
                x
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-5 pt-4 sm:px-6 sm:pb-8 sm:pt-5">
              {selectedGroup.courses.length > 1 ? (
                <div className="surface-soft rounded-3xl p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Program options
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedGroup.courses.map((course, index) => {
                      const isActive = course.id === selectedCourse.id;

                      return (
                        <button
                          key={`${selectedGroup.id}-variant-${course.id}`}
                          type="button"
                          onClick={() => setSelectedVariantId(course.id)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                              : "surface text-[var(--color-heading)] hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          {buildVariantLabel(course, index)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <p className="mt-6 text-sm leading-7 text-[var(--color-muted)]">
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
