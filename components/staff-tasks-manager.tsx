
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "low" | "medium" | "high";

type StaffTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500";

export function StaffTasksManager() {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/staff-tasks", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load tasks");
      }

      setTasks(payload.tasks ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load tasks",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/staff-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create task");
      }

      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create task",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(
    id: string,
    status: TaskStatus,
  ) {
    setError("");

    try {
      const response = await fetch("/api/staff-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update task");
      }

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update task",
      );
    }
  }

  async function deleteTask(id: string) {
    if (!window.confirm("Delete this task?")) return;

    setError("");

    try {
      const response = await fetch("/api/staff-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete task");
      }

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete task",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Staff Tasks & Reports
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Plan your work, record progress and track completion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Tasks", count: counts.total },
          { label: "Pending", count: counts.pending },
          { label: "In Progress", count: counts.progress },
          { label: "Completed", count: counts.completed },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {loading ? "—" : stat.count}
            </p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={(event) => void createTask(event)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-blue-700" />
            <h2 className="text-lg font-black text-slate-900">
              Create Task
            </h2>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">
              Task Title *
            </label>
            <input
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">
              Description
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass}
              placeholder="Describe the work"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Priority
              </label>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button
            disabled={saving || !title.trim()}
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <Plus size={17} />
            {saving ? "Saving..." : "Create Task"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-900">
              Task Register
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Your assigned and recorded tasks
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="mx-5 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList
                size={34}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm text-slate-500">
                No tasks recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div key={task.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {task.title}
                      </h3>

                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                        {task.description || "No description"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void deleteTask(task.id)}
                      aria-label={`Delete ${task.title}`}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-bold capitalize text-blue-700">
                      {task.priority} priority
                    </span>

                    {task.dueDate ? (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Clock3 size={13} />
                        Due {task.dueDate}
                      </span>
                    ) : null}

                    {task.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 size={14} />
                        Completed
                      </span>
                    ) : null}
                  </div>

                  <select
                    aria-label={`Status for ${task.title}`}
                    value={task.status}
                    onChange={(event) =>
                      void updateTask(
                        task.id,
                        event.target.value as TaskStatus,
                      )
                    }
                    className={inputClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
