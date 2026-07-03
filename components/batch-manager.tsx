"use client";

import { useEffect, useMemo, useState } from "react";

import type { Batch } from "@/lib/types";

type ManagedUser = {
  id: string;
  name: string;
  role: string;
  status: string;
  program?: string;
};

type BatchManagerProps = {
  managedUsers: ManagedUser[];
};

type BatchForm = {
  name: string;
  courseName: string;
  subject: string;
  schedule: string;
  studentIds: string[];
  teacherIds: string[];
};

const emptyForm: BatchForm = {
  name: "",
  courseName: "",
  subject: "",
  schedule: "",
  studentIds: [],
  teacherIds: [],
};

export function BatchManager({ managedUsers }: BatchManagerProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const students = useMemo(
    () =>
      managedUsers.filter(
        (user) => user.role === "student" && user.status === "active",
      ),
    [managedUsers],
  );

  const teachers = useMemo(
    () =>
      managedUsers.filter(
        (user) => user.role === "educator" && user.status === "active",
      ),
    [managedUsers],
  );

  useEffect(() => {
    void loadBatches();
  }, []);

  async function loadBatches() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/batches", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        batches?: Batch[];
        error?: string;
      };

      if (!response.ok) {
        setMessage(payload.error ?? "Unable to load batches.");
        return;
      }

      setBatches(payload.batches ?? []);
    } catch {
      setMessage("Unable to load batches.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateForm<Key extends keyof BatchForm>(
    key: Key,
    value: BatchForm[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleSelection(
    key: "studentIds" | "teacherIds",
    userId: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(userId)
        ? current[key].filter((id) => id !== userId)
        : [...current[key], userId],
    }));
  }

  function startEdit(batch: Batch) {
    setEditingBatchId(batch.id);

    setForm({
      name: batch.name ?? "",
      courseName: batch.courseName ?? "",
      subject: batch.subject ?? "",
      schedule: batch.schedule ?? "",
      studentIds: batch.studentIds ?? [],
      teacherIds: batch.teacherIds ?? [],
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingBatchId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function saveBatch() {
    if (!form.name.trim()) {
      setMessage("Batch name is required.");
      return;
    }

    if (!form.studentIds.length) {
      setMessage("Select at least one student.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      if (!editingBatchId) {
        const response = await fetch("/api/batches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const payload = (await response.json()) as {
          batch?: Batch;
          error?: string;
        };

        if (!response.ok || !payload.batch) {
          setMessage(payload.error ?? "Unable to create batch.");
          return;
        }

        for (const teacherId of form.teacherIds) {
          await fetch("/api/batches", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "assign-teacher",
              batchId: payload.batch.id,
              teacherId,
              subject: form.subject,
            }),
          });
        }

        setMessage("Batch created successfully.");
        setForm(emptyForm);

        await loadBatches();
        return;
      }

      const currentBatch = batches.find(
        (batch) => batch.id === editingBatchId,
      );

      const response = await fetch("/api/batches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: editingBatchId,
          ...form,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessage(payload.error ?? "Unable to update batch.");
        return;
      }

      const previousTeacherIds = currentBatch?.teacherIds ?? [];

      const addedTeachers = form.teacherIds.filter(
        (teacherId) => !previousTeacherIds.includes(teacherId),
      );

      const removedTeachers = previousTeacherIds.filter(
        (teacherId) => !form.teacherIds.includes(teacherId),
      );

      await Promise.all(
        addedTeachers.map((teacherId) =>
          fetch("/api/batches", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "assign-teacher",
              batchId: editingBatchId,
              teacherId,
              subject: form.subject,
            }),
          }),
        ),
      );

      await Promise.all(
        removedTeachers.map((teacherId) =>
          fetch("/api/batches", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "remove-teacher",
              batchId: editingBatchId,
              teacherId,
            }),
          }),
        ),
      );

      setMessage("Batch updated successfully.");
      setEditingBatchId(null);
      setForm(emptyForm);

      await loadBatches();
    } catch {
      setMessage("Something went wrong while saving the batch.");
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveBatch(batchId: string) {
    const confirmed = window.confirm(
      "Archive this batch? Students and teachers will no longer see it.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/batches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId,
          status: "archived",
        }),
      });

      if (!response.ok) {
        setMessage("Unable to archive batch.");
        return;
      }

      setMessage("Batch archived successfully.");
      await loadBatches();
    } catch {
      setMessage("Unable to archive batch.");
    }
  }

  function getUserNames(userIds: string[]) {
    return userIds
      .map((userId) => managedUsers.find((user) => user.id === userId)?.name)
      .filter(Boolean)
      .join(", ");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Academic Operations
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Batch Management
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create batches, add students, and assign faculty members.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {batches.length} Batches
          </span>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Batch Name
            </span>

            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="e.g. Class 10 CBSE Mathematics - Morning"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Course / Program
            </span>

            <input
              value={form.courseName}
              onChange={(event) =>
                updateForm("courseName", event.target.value)
              }
              placeholder="e.g. Class 10 CBSE"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Subject
            </span>

            <input
              value={form.subject}
              onChange={(event) => updateForm("subject", event.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Schedule
            </span>

            <input
              value={form.schedule}
              onChange={(event) => updateForm("schedule", event.target.value)}
              placeholder="e.g. Mon, Wed, Fri · 5:00 PM"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Students</p>

              <span className="text-xs text-slate-500">
                {form.studentIds.length} selected
              </span>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {students.length ? (
                students.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2 transition hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.studentIds.includes(student.id)}
                      onChange={() =>
                        toggleSelection("studentIds", student.id)
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-medium text-slate-800">
                      {student.name}
                    </span>

                    <span className="ml-auto text-[10px] text-slate-400">
                      {student.program || "Student"}
                    </span>
                  </label>
                ))
              ) : (
                <p className="p-3 text-sm text-slate-500">
                  No active students found.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Faculty</p>

              <span className="text-xs text-slate-500">
                {form.teacherIds.length} selected
              </span>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {teachers.length ? (
                teachers.map((teacher) => (
                  <label
                    key={teacher.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2 transition hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.teacherIds.includes(teacher.id)}
                      onChange={() =>
                        toggleSelection("teacherIds", teacher.id)
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-medium text-slate-800">
                      {teacher.name}
                    </span>

                    <span className="ml-auto text-[10px] text-slate-400">
                      Faculty
                    </span>
                  </label>
                ))
              ) : (
                <p className="p-3 text-sm text-slate-500">
                  No active faculty accounts found.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveBatch()}
            disabled={isSaving}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : editingBatchId
                ? "Update Batch"
                : "Create Batch"}
          </button>

          {editingBatchId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading batches...
          </div>
        ) : batches.length ? (
          batches.map((batch) => (
            <article
              key={batch.id}
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {batch.name}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        batch.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {[batch.courseName, batch.subject, batch.schedule]
                      .filter(Boolean)
                      .join(" · ") || "No course details added"}
                  </p>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Students
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
                        {batch.studentIds.length} enrolled
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Faculty
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
                        {getUserNames(batch.teacherIds) || "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(batch)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  {batch.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => void archiveBatch(batch.id)}
                      className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No batches created yet.
          </div>
        )}
      </div>
    </section>
  );
}