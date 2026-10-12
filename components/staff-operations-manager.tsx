
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";

type Kind =
  | "tasks"
  | "expenses"
  | "daily-reports";

type Item = {
  id: string;
  title: string;
  details?: string;
  date?: string;
  amount?: number | null;
  status: string;
  createdAt: string;
};

const titles: Record<Kind, string> = {
  tasks: "Staff Tasks & Reports",
  expenses: "Branch Expenses",
  "daily-reports": "Daily Branch Report",
};

const inputStyle =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

export function StaffOperationsManager({
  kind,
}: {
  kind: Kind;
}) {
  const [items, setItems] =
    useState<Item[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [date, setDate] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const endpoint =
    `/api/staff-operations?kind=${kind}`;

  const refresh = useCallback(
    async () => {
      setLoading(true);

      try {
        const response = await fetch(
          endpoint,
          { cache: "no-store" },
        );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "Could not load data",
          );
        }

        setItems(
          Array.isArray(payload.items)
            ? payload.items
            : [],
        );

        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load data",
        );
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = useMemo(
    () => ({
      total: items.length,

      complete: items.filter(
        (item) =>
          item.status === "completed",
      ).length,

      amount: items.reduce(
        (sum, item) =>
          sum + (item.amount || 0),
        0,
      ),
    }),
    [items],
  );

  async function create(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            details,
            date,
            amount: Number(amount),
          }),
        },
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Could not save record",
        );
      }

      setTitle("");
      setDetails("");
      setDate("");
      setAmount("");

      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save record",
      );
    } finally {
      setBusy(false);
    }
  }

  async function change(
    id: string,
    status: string,
  ) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        endpoint,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id,
            status,
          }),
        },
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to update",
        );
      }

      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !window.confirm(
        "Delete this task?",
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        endpoint,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        },
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to delete",
        );
      }

      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 text-slate-900">
      <div className="rounded-3xl bg-gradient-to-r from-[#091f47] to-[#1c59ae] p-6 text-white shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">
          Staff operations
        </div>

        <h1 className="mt-2 text-2xl font-black">
          {titles[kind]}
        </h1>

        <p className="mt-2 text-sm text-blue-100">
          Your records are saved in MongoDB
          and scoped to your staff account.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-xs text-slate-500">
            Total records
          </div>

          <div className="mt-1 text-2xl font-black">
            {loading
              ? "—"
              : counts.total}
          </div>
        </div>

        {kind === "tasks" ? (
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-xs text-slate-500">
              Completed tasks
            </div>

            <div className="mt-1 text-2xl font-black">
              {counts.complete}
            </div>
          </div>
        ) : null}

        {kind === "expenses" ? (
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-xs text-slate-500">
              My submitted expenses
            </div>

            <div className="mt-1 text-2xl font-black">
              ₹
              {counts.amount.toLocaleString(
                "en-IN",
              )}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={(event) =>
            void create(event)
          }
          className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Plus size={18} />

            {kind === "tasks"
              ? "Create task"
              : kind === "expenses"
                ? "Record expense"
                : "Submit daily report"}
          </h2>

          <label className="block text-sm font-medium">
            {kind === "daily-reports"
              ? "Report title"
              : kind === "expenses"
                ? "Expense title"
                : "Task title"}

            <input
              required
              maxLength={140}
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              className={`${inputStyle} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium">
            {kind === "daily-reports"
              ? "Work completed, challenges and follow-ups"
              : "Details"}

            <textarea
              maxLength={4000}
              rows={5}
              value={details}
              onChange={(event) =>
                setDetails(
                  event.target.value,
                )
              }
              className={`${inputStyle} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium">
            Date

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value,
                )
              }
              className={`${inputStyle} mt-1`}
            />
          </label>

          {kind === "expenses" ? (
            <label className="block text-sm font-medium">
              Amount (₹)

              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value,
                  )
                }
                className={`${inputStyle} mt-1`}
              />
            </label>
          ) : null}

          <button
            type="submit"
            disabled={
              busy || !title.trim()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus size={16} />

            {busy
              ? "Saving..."
              : "Save record"}
          </button>
        </form>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ClipboardList size={19} />
            Recent records
          </h2>

          {loading ? (
            <p className="py-8 text-sm text-slate-500">
              Loading...
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm text-slate-500">
              No records yet.
            </p>
          ) : (
            <div className="mt-4 divide-y">
              {items.map((item) => (
                <article
                  className="space-y-2 py-4"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                        {item.details}
                      </p>
                    </div>

                    {kind === "tasks" ? (
                      <button
                        aria-label="Delete task"
                        type="button"
                        disabled={busy}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          void remove(
                            item.id,
                          )
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      {item.date ||
                        item.createdAt.slice(
                          0,
                          10,
                        )}
                    </span>

                    {kind === "expenses" ? (
                      <strong>
                        ₹
                        {(
                          item.amount || 0
                        ).toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    ) : null}

                    {kind === "tasks" ? (
                      <select
                        disabled={busy}
                        className="rounded-lg border p-2 text-xs"
                        value={
                          item.status
                        }
                        onChange={(
                          event,
                        ) =>
                          void change(
                            item.id,
                            event.target.value,
                          )
                        }
                      >
                        <option value="pending">
                          Pending
                        </option>

                        <option value="in_progress">
                          In progress
                        </option>

                        <option value="completed">
                          Completed
                        </option>
                      </select>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-500">
        Expense and daily-report submissions
        are retained for administrator review
        and cannot be deleted by staff.
        They are not approved branch ledgers
        or consolidated institution reports.
      </p>
    </div>
  );
}
