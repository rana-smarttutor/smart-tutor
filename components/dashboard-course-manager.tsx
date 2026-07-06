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
  name: string;
  code: string;
  description: string;
  durationMonths: string;
};

export function DashboardCourseManager({
  initialCourses,
  courseOptions,
}: DashboardCourseManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [status, setStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<CourseForm>({
    name: courseOptions[0]?.standardKey ?? "",
    code: "",
    description: "",
    durationMonths: "",
  });
  const [editForm, setEditForm] = useState<CourseForm>({
    name: "",
    code: "",
    description: "",
    durationMonths: "",
  });

  const stats = useMemo(() => {
    const totalSubjects = courses.reduce(
      (sum, c) => sum + c.subjectsCovered.length,
      0,
    );
    const totalBatches = courses.length;
    const avgDuration = courses.length
      ? Math.round(
          courses.reduce((sum, c) => {
            const n = parseInt(c.duration, 10);
            return sum + (Number.isFinite(n) ? n : 12);
          }, 0) / courses.length,
        )
      : 0;
    return { totalSubjects, totalBatches, avgDuration };
  }, [courses]);

  function resetAddForm() {
    setAddForm({
      name: courseOptions[0]?.standardKey ?? "",
      code: "",
      description: "",
      durationMonths: "",
    });
  }

  async function handleCreate() {
    const response = await fetch("/api/courses", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standardKey: addForm.name,
        tagline: "",
        schedule: `${addForm.durationMonths || "12"} months`,
        summary: addForm.description.slice(0, 140),
        description: addForm.description,
        duration: addForm.durationMonths || "12",
        mode: "On Campus",
        audienceLabel: "All Students",
        courseNamesIncluded: addForm.code ? [addForm.code] : [],
        branchesIncluded: [],
        subjectsCovered: [],
        points: [],
      }),
    });

    const payload = (await response.json()) as {
      course?: CourseItem;
      error?: string;
    };

    if (!response.ok || !payload.course) {
      setStatus(payload.error ?? "Course could not be created.");
      return;
    }

    setCourses((current) => [payload.course as CourseItem, ...current]);
    setShowAddModal(false);
    resetAddForm();
    setStatus("Course created successfully.");
  }

  function openEdit(course: CourseItem) {
    setEditingCourse(course);
    setEditForm({
      name: course.title,
      code: course.courseNamesIncluded[0] ?? "",
      description: course.description,
      durationMonths: course.duration,
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editingCourse) return;

    const response = await fetch("/api/courses", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingCourse.id,
        standardKey: editingCourse.standardKey,
        tagline: editingCourse.tagline,
        schedule: `${editForm.durationMonths || "12"} months`,
        summary: editForm.description.slice(0, 140),
        description: editForm.description,
        duration: editForm.durationMonths || "12",
        mode: editingCourse.mode,
        audienceLabel: editingCourse.audienceLabel,
        courseNamesIncluded: editForm.code ? [editForm.code] : [],
        branchesIncluded: editingCourse.branchesIncluded,
        subjectsCovered: editingCourse.subjectsCovered,
        points: editingCourse.points,
      }),
    });

    const payload = (await response.json()) as {
      course?: CourseItem;
      error?: string;
    };

    if (!response.ok || !payload.course) {
      setStatus(payload.error ?? "Course could not be updated.");
      return;
    }

    setCourses((current) =>
      current.map((c) =>
        c.id === editingCourse.id ? (payload.course as CourseItem) : c,
      ),
    );
    setShowEditModal(false);
    setEditingCourse(null);
    setStatus("Course updated successfully.");
  }

  async function handleDelete(courseId: string) {
    const response = await fetch("/api/courses", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: courseId }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error ?? "Course could not be deleted.");
      setDeleteConfirmId(null);
      return;
    }

    setCourses((current) => current.filter((c) => c.id !== courseId));
    setDeleteConfirmId(null);
    setStatus("Course deleted.");
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Course / Program Master</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Top-level hierarchy: Course → Subject → Topic. Batches are linked to a course.
          </h2>
        </div>
        <button
          type="button"
          onClick={() => { resetAddForm(); setShowAddModal(true); }}
          className="btn-action btn-md font-bold shrink-0"
        >
          + New Course
        </button>
      </div>

      {status ? (
        <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">{status}</p>
      ) : null}

      {/* Stats row */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="surface-soft rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-[var(--color-primary)]">{stats.totalSubjects}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Subjects</p>
        </div>
        <div className="surface-soft rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-[var(--color-success)]">{stats.totalBatches}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Batches</p>
        </div>
        <div className="surface-soft rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-[var(--color-warning)]">{stats.avgDuration}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Months</p>
        </div>
      </div>

      {/* Course grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="surface-soft rounded-2xl border border-[var(--color-border)] p-5 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-bold text-[var(--color-heading)]">{course.title}</p>
              <span className="shrink-0 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
                Active
              </span>
            </div>

            {course.courseNamesIncluded.length > 0 ? (
              <code className="mt-2 inline-block rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                {course.courseNamesIncluded[0]}
              </code>
            ) : null}

            {course.summary ? (
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)] line-clamp-2">
                {course.summary}
              </p>
            ) : null}

            <div className="mt-4 flex gap-3">
              <div className="text-center">
                <p className="text-lg font-extrabold text-[var(--color-primary)]">
                  {course.subjectsCovered.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Subjects</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-[var(--color-success)]">1</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Batches</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-[var(--color-warning)]">{course.duration}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Months</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(course)}
                className="flex-1 rounded-xl border border-[var(--color-primary)]/30 px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(course.id)}
                className="flex-1 rounded-xl border border-[var(--color-danger)]/30 px-3 py-2 text-xs font-bold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
            <div className="rounded-t-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] px-6 py-5">
              <h3 className="text-lg font-bold text-white">Add Course / Program</h3>
            </div>
            <div className="grid gap-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Course Name <span className="text-[var(--color-danger)]">*</span>
                </label>
                <select
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                >
                  {courseOptions.map((opt) => (
                    <option key={opt.standardKey} value={opt.standardKey}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Code
                </label>
                <input
                  value={addForm.code}
                  onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. JEE-M, XI-SCI"
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Duration (months)
                </label>
                <input
                  value={addForm.durationMonths}
                  onChange={(e) => setAddForm((f) => ({ ...f, durationMonths: e.target.value }))}
                  type="number"
                  min="1"
                  max="120"
                  placeholder="12"
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Description
                </label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of this course…"
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); resetAddForm(); }}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {showEditModal && editingCourse ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
            <div className="rounded-t-2xl bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning-strong)] px-6 py-5">
              <h3 className="text-lg font-bold text-white">Edit Course</h3>
            </div>
            <div className="grid gap-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Course Name <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Code
                </label>
                <input
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Duration (months)
                </label>
                <input
                  value={editForm.durationMonths}
                  onChange={(e) => setEditForm((f) => ({ ...f, durationMonths: e.target.value }))}
                  type="number"
                  min="1"
                  max="120"
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="surface-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingCourse(null); }}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-xl bg-[var(--color-warning)] px-5 py-2.5 text-sm font-bold text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete confirm */}
      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--color-heading)]">Delete course?</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-heading)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
