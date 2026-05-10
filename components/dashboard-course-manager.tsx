"use client";

import { useMemo, useState } from "react";

import type { CourseItem } from "@/lib/types";

type CourseTemplateOption = {
  standardKey: string;
  title: string;
};

type DashboardCourseManagerProps = {
  initialCourses: CourseItem[];
  courseOptions: CourseTemplateOption[];
};

type CourseForm = {
  standardKey: string;
  schedule: string;
  summary: string;
  description: string;
  duration: string;
  mode: string;
  audienceLabel: string;
  tagline: string;
  courseNamesIncludedText: string;
  branchesIncludedText: string;
  subjectsCoveredText: string;
  pointsText: string;
};

function toForm(course: CourseItem): CourseForm {
  return {
    standardKey: course.standardKey,
    schedule: course.schedule,
    summary: course.summary,
    description: course.description,
    duration: course.duration,
    mode: course.mode,
    audienceLabel: course.audienceLabel,
    tagline: course.tagline,
    courseNamesIncludedText: course.courseNamesIncluded.join("\n"),
    branchesIncludedText: course.branchesIncluded.join("\n"),
    subjectsCoveredText: course.subjectsCovered.join("\n"),
    pointsText: course.points.join("\n"),
  };
}

export function DashboardCourseManager({
  initialCourses,
  courseOptions,
}: DashboardCourseManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [drafts, setDrafts] = useState<Record<string, CourseForm>>({});
  const [createForm, setCreateForm] = useState<CourseForm>({
    standardKey: courseOptions[0]?.standardKey ?? "",
    schedule: "",
    summary: "",
    description: "",
    duration: "",
    mode: "",
    audienceLabel: "",
    tagline: "",
    courseNamesIncludedText: "",
    branchesIncludedText: "",
    subjectsCoveredText: "",
    pointsText: "",
  });

  const standardizedCount = useMemo(
    () => new Set(courses.map((course) => course.standardKey)).size,
    [courses],
  );

  async function handleCreate() {
    const response = await fetch("/api/courses", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        courseNamesIncluded: createForm.courseNamesIncludedText.split("\n").map((item) => item.trim()).filter(Boolean),
        branchesIncluded: createForm.branchesIncludedText.split("\n").map((item) => item.trim()).filter(Boolean),
        subjectsCovered: createForm.subjectsCoveredText.split("\n").map((item) => item.trim()).filter(Boolean),
        points: createForm.pointsText.split("\n").map((item) => item.trim()).filter(Boolean),
      }),
    });

    const payload = (await response.json()) as { course?: CourseItem; error?: string };

    if (!response.ok || !payload.course) {
      setStatus(payload.error ?? "Course could not be created.");
      return;
    }

    setCourses((current) => [payload.course as CourseItem, ...current]);
    setStatus("Course saved to the database.");
  }

  async function handleSave(courseId: string) {
    const draft = drafts[courseId];

    if (!draft) {
      return;
    }

    const response = await fetch("/api/courses", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: courseId,
        ...draft,
        courseNamesIncluded: draft.courseNamesIncludedText.split("\n").map((item) => item.trim()).filter(Boolean),
        branchesIncluded: draft.branchesIncludedText.split("\n").map((item) => item.trim()).filter(Boolean),
        subjectsCovered: draft.subjectsCoveredText.split("\n").map((item) => item.trim()).filter(Boolean),
        points: draft.pointsText.split("\n").map((item) => item.trim()).filter(Boolean),
      }),
    });

    const payload = (await response.json()) as { course?: CourseItem; error?: string };

    if (!response.ok || !payload.course) {
      setStatus(payload.error ?? "Course could not be updated.");
      return;
    }

    setCourses((current) =>
      current.map((course) => (course.id === courseId ? (payload.course as CourseItem) : course)),
    );
    setEditingId(null);
    setStatus("Course changes saved to the database.");
  }

  return (
    <section className="surface rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Course Control</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Standardized course manager
          </h2>
        </div>
        <span className="pill">{standardizedCount} standard tracks</span>
      </div>

      {status ? <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">{status}</p> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="surface-soft rounded-[1.75rem] p-5">
          <p className="text-sm font-semibold text-[var(--color-heading)]">Create course from standard list</p>
          <div className="mt-4 grid gap-3">
            <select
              value={createForm.standardKey}
              onChange={(event) => setCreateForm((current) => ({ ...current, standardKey: event.target.value }))}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            >
              {courseOptions.map((option) => (
                <option key={option.standardKey} value={option.standardKey}>
                  {option.title}
                </option>
              ))}
            </select>
            {[
              ["tagline", "Tagline"],
              ["schedule", "Schedule"],
              ["duration", "Duration"],
              ["mode", "Mode"],
              ["audienceLabel", "Audience label"],
            ].map(([key, label]) => (
              <input
                key={key}
                value={createForm[key as keyof CourseForm] as string}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, [key]: event.target.value }))
                }
                placeholder={label}
                className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
              />
            ))}
            <textarea
              value={createForm.summary}
              onChange={(event) => setCreateForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Summary"
              rows={3}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Detailed description"
              rows={4}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <textarea
              value={createForm.courseNamesIncludedText}
              onChange={(event) => setCreateForm((current) => ({ ...current, courseNamesIncludedText: event.target.value }))}
              placeholder="Included course names, one per line"
              rows={4}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <textarea
              value={createForm.branchesIncludedText}
              onChange={(event) => setCreateForm((current) => ({ ...current, branchesIncludedText: event.target.value }))}
              placeholder="Included branches, one per line"
              rows={4}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <textarea
              value={createForm.subjectsCoveredText}
              onChange={(event) => setCreateForm((current) => ({ ...current, subjectsCoveredText: event.target.value }))}
              placeholder="Subjects covered, one per line"
              rows={4}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <textarea
              value={createForm.pointsText}
              onChange={(event) => setCreateForm((current) => ({ ...current, pointsText: event.target.value }))}
              placeholder="One key point per line"
              rows={4}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <button type="button" onClick={handleCreate} className="btn-action btn-md w-full font-bold">
              Add New Course
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {courses.map((course) => {
            const draft = drafts[course.id] ?? toForm(course);
            const isEditing = editingId === course.id;

            return (
              <div key={course.id} className="surface-soft rounded-[1.75rem] p-5 border border-transparent hover:border-[var(--color-primary)] transition-all">
                {isEditing ? (
                  <div className="grid gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1">Editing Course</p>
                    <select
                      value={draft.standardKey}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, standardKey: event.target.value },
                        }))
                      }
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    >
                      {courseOptions.map((option) => (
                        <option key={option.standardKey} value={option.standardKey}>
                          {option.title}
                        </option>
                      ))}
                    </select>
                    {[
                      ["tagline", "Tagline"],
                      ["schedule", "Schedule"],
                      ["duration", "Duration"],
                      ["mode", "Mode"],
                      ["audienceLabel", "Audience label"],
                    ].map(([key, label]) => (
                      <input
                        key={key}
                        value={draft[key as keyof CourseForm] as string}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [course.id]: { ...draft, [key]: event.target.value },
                          }))
                        }
                        placeholder={label}
                        className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                      />
                    ))}
                    <textarea
                      value={draft.summary}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, summary: event.target.value },
                        }))
                      }
                      rows={3}
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, description: event.target.value },
                        }))
                      }
                      rows={4}
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <textarea
                      value={draft.courseNamesIncludedText}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, courseNamesIncludedText: event.target.value },
                        }))
                      }
                      rows={4}
                      placeholder="Included course names"
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <textarea
                      value={draft.branchesIncludedText}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, branchesIncludedText: event.target.value },
                        }))
                      }
                      rows={4}
                      placeholder="Included branches"
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <textarea
                      value={draft.subjectsCoveredText}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, subjectsCoveredText: event.target.value },
                        }))
                      }
                      rows={4}
                      placeholder="Subjects covered"
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <textarea
                      value={draft.pointsText}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [course.id]: { ...draft, pointsText: event.target.value },
                        }))
                      }
                      rows={4}
                      className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <div className="flex flex-wrap gap-3 mt-2">
                      <button type="button" onClick={() => handleSave(course.id)} className="btn-action btn-sm">
                        Update Course
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="btn-surface btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="keyword-line text-[var(--color-secondary)]">{course.tagline}</p>
                        <p className="mt-2 text-xl font-bold text-[var(--color-heading)]">
                          {course.title}
                        </p>
                      </div>
                      <span className="pill bg-[var(--color-secondary-soft)] text-[var(--color-secondary-strong)] border-[var(--color-secondary)]/20">{course.duration}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)] font-medium">{course.summary}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="surface rounded-2xl p-4 border border-[var(--color-border)] bg-white/40">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Delivery Mode</p>
                        <p className="mt-1 text-sm font-bold text-[var(--color-heading)]">{course.mode}</p>
                      </div>
                      <div className="surface rounded-2xl p-4 border border-[var(--color-border)] bg-white/40">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Target Audience</p>
                        <p className="mt-1 text-sm font-bold text-[var(--color-heading)]">{course.audienceLabel}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3">
                      <div className="surface rounded-2xl p-4 border border-[var(--color-border)] bg-white/40">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Course Portfolio</p>
                        <p className="mt-1 text-sm font-bold text-[var(--color-heading)]">
                          {course.courseNamesIncluded.join(", ")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(course.id);
                        setDrafts((current) => ({ ...current, [course.id]: toForm(course) }));
                      }}
                      className="btn-action btn-sm mt-6 w-full sm:w-auto"
                    >
                      Edit Course Details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
