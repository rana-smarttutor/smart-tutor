"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Filter,
  Loader2,
  Lock,
  MessageCircleQuestion,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Unlock,
  UserRound,
  X,
} from "lucide-react";

import type {
  DoubtAnswer,
  DoubtItem,
  DoubtStatus,
  Role,
  SessionUser,
} from "@/lib/types";

type Props = {
  session: SessionUser | null;
  role: Role;
};

type StatusFilter = "all" | DoubtStatus;

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

const SUBJECT_SUGGESTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Science",
  "Social Science",
  "Economics",
  "Accountancy",
  "Business Studies",
  "Computer Science",
  "Reasoning",
  "General Knowledge",
  "Current Affairs",
  "Other",
];

function ModalPortal({
  children,
}: {
  children: ReactNode;
}) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  if (
    !mounted ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    children,
    document.body,
  );
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusLabel(
  status: DoubtStatus,
) {
  if (status === "open") {
    return "Open";
  }

  if (status === "answered") {
    return "Answered";
  }

  if (status === "resolved") {
    return "Resolved";
  }

  return "Closed";
}

function getStatusClasses(
  status: DoubtStatus,
) {
  if (status === "open") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "answered") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getAuthorLabel(
  answer: DoubtAnswer,
) {
  if (
    answer.authorRole === "ai"
  ) {
    return "AI Doubt Solver";
  }

  if (
    answer.authorRole ===
    "educator"
  ) {
    return "Faculty";
  }

  if (
    answer.authorRole ===
    "admin"
  ) {
    return "Admin";
  }

  return "Student";
}

function getAuthorBadgeClasses(
  answer: DoubtAnswer,
) {
  if (
    answer.authorRole === "ai"
  ) {
    return "bg-violet-100 text-violet-700";
  }

  if (
    answer.authorRole ===
    "educator"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (
    answer.authorRole ===
    "admin"
  ) {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-700";
}

async function parsePayload<T>(
  response: Response,
) {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function DoubtBox({
  session,
  role,
}: Props) {
  const [doubts, setDoubts] =
    useState<DoubtItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    subjectFilter,
    setSubjectFilter,
  ] = useState("all");

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    selectedDoubtId,
    setSelectedDoubtId,
  ] = useState<string | null>(
    null,
  );

  const [
    subject,
    setSubject,
  ] = useState("");

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    answerContent,
    setAnswerContent,
  ] = useState("");

  const [
    busyAction,
    setBusyAction,
  ] = useState("");

  const isModerator =
    role === "educator" ||
    role === "admin";

  const selectedDoubt =
    useMemo(() => {
      if (!selectedDoubtId) {
        return null;
      }

      return (
        doubts.find(
          (doubt) =>
            doubt.id ===
            selectedDoubtId,
        ) ?? null
      );
    }, [
      doubts,
      selectedDoubtId,
    ]);

  const loadDoubts =
    useCallback(
      async (
        showMainLoader = false,
      ) => {
        if (showMainLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        try {
          const response =
            await fetch(
              "/api/doubts",
              {
                method: "GET",
                credentials:
                  "same-origin",
                cache:
                  "no-store",
              },
            );

          const payload =
            await parsePayload<
              ApiErrorPayload & {
                doubts?: DoubtItem[];
              }
            >(response);

          if (!response.ok) {
            throw new Error(
              payload.error ||
                "Unable to load doubts.",
            );
          }

          setDoubts(
            Array.isArray(
              payload.doubts,
            )
              ? payload.doubts
              : [],
          );

          setError("");
        } catch (loadError) {
          if (showMainLoader) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load doubts.",
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadDoubts(true);

    const interval =
      window.setInterval(() => {
        void loadDoubts(false);
      }, 15000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadDoubts]);

  useEffect(() => {
    if (
      !showCreateModal &&
      !selectedDoubtId
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    showCreateModal,
    selectedDoubtId,
  ]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [successMessage]);

  const subjectOptions =
    useMemo(() => {
      const subjects =
        doubts
          .map(
            (doubt) =>
              doubt.subject.trim(),
          )
          .filter(Boolean);

      return [
        ...new Set(subjects),
      ].sort((left, right) =>
        left.localeCompare(right),
      );
    }, [doubts]);

  const filteredDoubts =
    useMemo(() => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      return doubts.filter(
        (doubt) => {
          if (
            statusFilter !==
              "all" &&
            doubt.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            subjectFilter !==
              "all" &&
            doubt.subject !==
              subjectFilter
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchableText = [
            doubt.title,
            doubt.description,
            doubt.subject,
            doubt.studentName,
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      doubts,
      searchQuery,
      statusFilter,
      subjectFilter,
    ]);

  const myDoubts =
    doubts.filter(
      (doubt) =>
        doubt.studentId ===
        session?.id,
    ).length;

  const openDoubts =
    doubts.filter(
      (doubt) =>
        doubt.status === "open" ||
        doubt.status ===
          "answered",
    ).length;

  const solvedDoubts =
    doubts.filter(
      (doubt) =>
        doubt.status ===
        "resolved",
    ).length;

  const answersGiven =
    doubts.reduce(
      (
        total,
        doubt,
      ) =>
        total +
        (doubt.answers?.filter(
          (answer) =>
            answer.authorId ===
            session?.id,
        ).length ?? 0),
      0,
    );

  function resetCreateForm() {
    setSubject("");
    setTitle("");
    setDescription("");
  }

  function openDiscussion(
    doubtId: string,
  ) {
    setAnswerContent("");
    setError("");
    setSelectedDoubtId(
      doubtId,
    );
  }

  function closeDiscussion() {
    setSelectedDoubtId(
      null,
    );
    setAnswerContent("");
    setBusyAction("");
  }

  async function handleCreateDoubt(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setBusyAction(
      "create-doubt",
    );
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await fetch(
          "/api/doubts",
          {
            method: "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              subject,
              title,
              description,
            }),
          },
        );

      const payload =
        await parsePayload<
          ApiErrorPayload & {
            doubt?: DoubtItem;
          }
        >(response);

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to post your doubt.",
        );
      }

      resetCreateForm();
      setShowCreateModal(
        false,
      );

      setSuccessMessage(
        payload.message ||
          "Your doubt was posted successfully.",
      );

      await loadDoubts(false);

      if (payload.doubt?.id) {
        setSelectedDoubtId(
          payload.doubt.id,
        );
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to post your doubt.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handlePostAnswer(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedDoubt) {
      return;
    }

    setBusyAction(
      "post-answer",
    );
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await fetch(
          `/api/doubts/${encodeURIComponent(
            selectedDoubt.id,
          )}/answers`,
          {
            method: "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              content:
                answerContent,
            }),
          },
        );

      const payload =
        await parsePayload<ApiErrorPayload>(
          response,
        );

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to post your answer.",
        );
      }

      setAnswerContent("");

      setSuccessMessage(
        payload.message ||
          "Your answer was posted.",
      );

      await loadDoubts(false);
    } catch (answerError) {
      setError(
        answerError instanceof Error
          ? answerError.message
          : "Unable to post your answer.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleAskAi() {
    if (!selectedDoubt) {
      return;
    }

    setBusyAction("ask-ai");
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await fetch(
          `/api/doubts/${encodeURIComponent(
            selectedDoubt.id,
          )}/ai`,
          {
            method: "POST",
            credentials:
              "same-origin",
          },
        );

      const payload =
        await parsePayload<ApiErrorPayload>(
          response,
        );

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to generate an AI answer.",
        );
      }

      setSuccessMessage(
        payload.message ||
          "The AI Doubt Solver posted an answer.",
      );

      await loadDoubts(false);
    } catch (aiError) {
      setError(
        aiError instanceof Error
          ? aiError.message
          : "Unable to generate an AI answer.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleStatusAction(
    action:
      | "accept-answer"
      | "resolve"
      | "reopen"
      | "close"
      | "lock"
      | "unlock",
    answerId?: string,
  ) {
    if (!selectedDoubt) {
      return;
    }

    const actionKey = `${action}:${
      answerId ?? ""
    }`;

    setBusyAction(actionKey);
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await fetch(
          `/api/doubts/${encodeURIComponent(
            selectedDoubt.id,
          )}/status`,
          {
            method: "PATCH",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action,
              answerId,
            }),
          },
        );

      const payload =
        await parsePayload<ApiErrorPayload>(
          response,
        );

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to update the doubt.",
        );
      }

      setSuccessMessage(
        payload.message ||
          "The doubt was updated.",
      );

      await loadDoubts(false);
    } catch (statusError) {
      setError(
        statusError instanceof
          Error
          ? statusError.message
          : "Unable to update the doubt.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleDeleteAnswer(
    answer: DoubtAnswer,
  ) {
    const confirmed =
      window.confirm(
        "Delete this answer? This action cannot be undone.",
      );

    if (!confirmed) {
      return;
    }

    const actionKey = `delete-answer:${answer.id}`;

    setBusyAction(actionKey);
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await fetch(
          `/api/doubts/answers/${encodeURIComponent(
            answer.id,
          )}`,
          {
            method: "DELETE",
            credentials:
              "same-origin",
          },
        );

      const payload =
        await parsePayload<ApiErrorPayload>(
          response,
        );

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to delete the answer.",
        );
      }

      setSuccessMessage(
        payload.message ||
          "The answer was deleted.",
      );

      await loadDoubts(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the answer.",
      );
    } finally {
      setBusyAction("");
    }
  }

  const canManageSelectedDoubt =
    Boolean(
      selectedDoubt &&
        (selectedDoubt.studentId ===
          session?.id ||
          isModerator),
    );

  const hasAiAnswer =
    selectedDoubt?.answers?.some(
      (answer) =>
        answer.authorRole ===
        "ai",
    ) ?? false;

  const canRequestAi =
    Boolean(
      selectedDoubt &&
        !hasAiAnswer &&
        !selectedDoubt.isLocked &&
        selectedDoubt.status !==
          "closed" &&
        selectedDoubt.status !==
          "resolved" &&
        (selectedDoubt.studentId ===
          session?.id ||
          isModerator),
    );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0A1637] via-[#0B40A1] to-[#3467C8] px-6 py-7 text-white sm:px-8">
          <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-28 h-44 w-44 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                <MessageCircleQuestion className="h-5 w-5" />
                Collaborative Learning
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Doubt Box
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Ask academic questions, help classmates, learn from faculty,
                and use the AI Doubt Solver whenever extra support is needed.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadDoubts(
                    false,
                  )
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Refresh
              </button>

              {role ===
                "student" && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowCreateModal(
                      true,
                    );
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B40A1] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  Ask a Doubt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="shrink-0 rounded-lg p-1 hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <CircleHelp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {role ===
              "student"
                ? "My Doubts"
                : "Total"}
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-slate-900">
            {role ===
            "student"
              ? myDoubts
              : doubts.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {role ===
            "student"
              ? "Questions posted by you"
              : "Questions in the Doubt Box"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-slate-900">
            {openDoubts}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Open or answered discussions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Solved
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-slate-900">
            {solvedDoubts}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Doubts marked as resolved
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contributions
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-slate-900">
            {answersGiven}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Answers posted by you
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_190px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target
                    .value,
                )
              }
              placeholder="Search by question, subject, or student..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="relative block">
            <BookOpen className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              value={
                subjectFilter
              }
              onChange={(event) =>
                setSubjectFilter(
                  event.target
                    .value,
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All Subjects
              </option>

              {subjectOptions.map(
                (
                  subjectOption,
                ) => (
                  <option
                    key={
                      subjectOption
                    }
                    value={
                      subjectOption
                    }
                  >
                    {
                      subjectOption
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="relative block">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All Status
              </option>
              <option value="open">
                Open
              </option>
              <option value="answered">
                Answered
              </option>
              <option value="resolved">
                Resolved
              </option>
              <option value="closed">
                Closed
              </option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="animate-pulse rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="h-5 w-28 rounded bg-slate-200" />
                <div className="mt-5 h-7 w-2/3 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-full rounded bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
              </div>
            ),
          )}
        </div>
      ) : filteredDoubts.length ===
        0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <MessageCircleQuestion className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            No doubts found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Try changing your search or filters.
            {role ===
            "student"
              ? " You can also post a new academic doubt."
              : ""}
          </p>

          {role ===
            "student" && (
            <button
              type="button"
              onClick={() =>
                setShowCreateModal(
                  true,
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093581]"
            >
              <Plus className="h-4 w-4" />
              Ask a Doubt
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDoubts.map(
            (doubt) => (
              <article
                key={doubt.id}
                className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {doubt.subject}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                          doubt.status,
                        )}`}
                      >
                        {getStatusLabel(
                          doubt.status,
                        )}
                      </span>

                      {doubt.isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      ) : null}

                      {doubt.answers?.some(
                        (answer) =>
                          answer.authorRole ===
                          "ai",
                      ) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                          <Sparkles className="h-3 w-3" />
                          AI Answer
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openDiscussion(
                          doubt.id,
                        )
                      }
                      className="mt-4 block text-left"
                    >
                      <h2 className="text-xl font-bold leading-7 text-slate-900 transition group-hover:text-[#0B40A1]">
                        {doubt.title}
                      </h2>
                    </button>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {doubt.description}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-4 w-4" />
                        Asked by{" "}
                        {doubt.studentName}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquareText className="h-4 w-4" />
                        {doubt.answerCount ??
                          doubt.answers
                            ?.length ??
                          0}{" "}
                        Answers
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {formatDate(
                          doubt.createdAt,
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openDiscussion(
                        doubt.id,
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093581]"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    View Discussion
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      {showCreateModal ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
            <button
              type="button"
              aria-label="Close create doubt modal"
              onClick={() => {
                setShowCreateModal(
                  false,
                );
                setError("");
              }}
              className="absolute inset-0 cursor-default"
            />

            <div className="relative z-10 flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    New Question
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Ask a Doubt
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(
                      false,
                    );
                    setError("");
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={
                  handleCreateDoubt
                }
                className="flex-1 overflow-y-auto px-5 py-6 sm:px-7"
              >
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Subject
                    </span>

                    <input
                      list="doubt-subject-options"
                      value={subject}
                      onChange={(
                        event,
                      ) =>
                        setSubject(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Example: Mathematics"
                      maxLength={80}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <datalist id="doubt-subject-options">
                      {SUBJECT_SUGGESTIONS.map(
                        (
                          subjectSuggestion,
                        ) => (
                          <option
                            key={
                              subjectSuggestion
                            }
                            value={
                              subjectSuggestion
                            }
                          />
                        ),
                      )}
                    </datalist>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Doubt title
                    </span>

                    <input
                      value={title}
                      onChange={(
                        event,
                      ) =>
                        setTitle(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Write a short and clear question"
                      maxLength={160}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-right text-xs text-slate-400">
                      {title.length}/160
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Explain your doubt
                    </span>

                    <textarea
                      value={
                        description
                      }
                      onChange={(
                        event,
                      ) =>
                        setDescription(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Add the complete question, what you understood, and where you are stuck..."
                      rows={8}
                      maxLength={4000}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-right text-xs text-slate-400">
                      {
                        description.length
                      }
                      /4000
                    </p>
                  </label>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-700">
                    Do not include your phone number, email address, social
                    media details, or private information in a public doubt.
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(
                        false,
                      );
                      setError("");
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      busyAction ===
                      "create-doubt"
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#093581] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction ===
                    "create-doubt" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}

                    Post Doubt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      ) : null}

      {selectedDoubt ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:p-5">
            <button
              type="button"
              aria-label="Close doubt discussion"
              onClick={
                closeDiscussion
              }
              className="absolute inset-0 cursor-default"
            />

            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[94vh] sm:max-w-5xl sm:rounded-[2rem]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {
                        selectedDoubt.subject
                      }
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                        selectedDoubt.status,
                      )}`}
                    >
                      {getStatusLabel(
                        selectedDoubt.status,
                      )}
                    </span>

                    {selectedDoubt.isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-xl font-bold leading-7 text-slate-900 sm:text-2xl">
                    {
                      selectedDoubt.title
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDiscussion
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-7 sm:py-7">
                <div className="mx-auto max-w-4xl space-y-5">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {selectedDoubt.studentName
                            .trim()
                            .charAt(0)
                            .toUpperCase() ||
                            "S"}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {
                              selectedDoubt.studentName
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            Student ·{" "}
                            {formatDate(
                              selectedDoubt.createdAt,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {
                        selectedDoubt.description
                      }
                    </div>

                    {selectedDoubt.attachmentUrl ? (
                      <a
                        href={
                          selectedDoubt.attachmentUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                      >
                        <BookOpen className="h-4 w-4" />
                        View attachment
                      </a>
                    ) : null}
                  </article>

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      Answers
                    </h3>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                      {selectedDoubt
                        .answers
                        ?.length ?? 0}{" "}
                      replies
                    </span>
                  </div>

                  {!selectedDoubt.answers
                    ?.length ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                      <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 font-bold text-slate-700">
                        No answers yet
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Be the first to
                        help solve this
                        doubt.
                      </p>
                    </div>
                  ) : (
                    selectedDoubt.answers.map(
                      (answer) => {
                        const canDelete =
                          isModerator ||
                          (answer.authorId ===
                            session?.id &&
                            answer.authorRole !==
                              "ai");

                        const canAccept =
                          canManageSelectedDoubt &&
                          !answer.isAccepted &&
                          !selectedDoubt.isLocked &&
                          selectedDoubt.status !==
                            "closed";

                        const deleteKey = `delete-answer:${answer.id}`;
                        const acceptKey = `accept-answer:${answer.id}`;

                        return (
                          <article
                            key={
                              answer.id
                            }
                            className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
                              answer.isAccepted
                                ? "border-emerald-300 ring-2 ring-emerald-100"
                                : answer.authorRole ===
                                    "ai"
                                  ? "border-violet-200"
                                  : "border-slate-200"
                            }`}
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                                    answer.authorRole ===
                                    "ai"
                                      ? "bg-violet-100 text-violet-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {answer.authorRole ===
                                  "ai" ? (
                                    <Sparkles className="h-5 w-5" />
                                  ) : (
                                    answer.authorName
                                      .trim()
                                      .charAt(
                                        0,
                                      )
                                      .toUpperCase() ||
                                    "U"
                                  )}
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-bold text-slate-900">
                                      {
                                        answer.authorName
                                      }
                                    </p>

                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getAuthorBadgeClasses(
                                        answer,
                                      )}`}
                                    >
                                      {getAuthorLabel(
                                        answer,
                                      )}
                                    </span>

                                    {answer.isAccepted ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                        <Check className="h-3 w-3" />
                                        Accepted Answer
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatDate(
                                      answer.createdAt,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {canAccept ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleStatusAction(
                                        "accept-answer",
                                        answer.id,
                                      )
                                    }
                                    disabled={
                                      busyAction ===
                                      acceptKey
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                  >
                                    {busyAction ===
                                    acceptKey ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    Accept
                                  </button>
                                ) : null}

                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeleteAnswer(
                                        answer,
                                      )
                                    }
                                    disabled={
                                      busyAction ===
                                      deleteKey
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                  >
                                    {busyAction ===
                                    deleteKey ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {
                                answer.content
                              }
                            </div>

                            {answer.attachmentUrl ? (
                              <a
                                href={
                                  answer.attachmentUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                              >
                                <BookOpen className="h-4 w-4" />
                                View attachment
                              </a>
                            ) : null}
                          </article>
                        );
                      },
                    )
                  )}

                  {canRequestAi ? (
                    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-violet-800">
                            <Sparkles className="h-5 w-5" />
                            AI Doubt Solver
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Use AI when
                            classmates are
                            unavailable or
                            when you need
                            another
                            explanation.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleAskAi()
                          }
                          disabled={
                            busyAction ===
                            "ask-ai"
                          }
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyAction ===
                          "ask-ai" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}

                          Ask AI Solver
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-7">
                <div className="mx-auto max-w-4xl">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {canManageSelectedDoubt &&
                    selectedDoubt.status !==
                      "resolved" &&
                    selectedDoubt.status !==
                      "closed" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleStatusAction(
                            "resolve",
                          )
                        }
                        disabled={
                          busyAction ===
                          "resolve:"
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Resolved
                      </button>
                    ) : null}

                    {canManageSelectedDoubt &&
                    (selectedDoubt.status ===
                      "resolved" ||
                      selectedDoubt.status ===
                        "closed") ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleStatusAction(
                            "reopen",
                          )
                        }
                        disabled={
                          busyAction ===
                          "reopen:"
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reopen
                      </button>
                    ) : null}

                    {isModerator &&
                    selectedDoubt.status !==
                      "closed" ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusAction(
                              selectedDoubt.isLocked
                                ? "unlock"
                                : "lock",
                            )
                          }
                          disabled={
                            busyAction ===
                              "lock:" ||
                            busyAction ===
                              "unlock:"
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                        >
                          {selectedDoubt.isLocked ? (
                            <Unlock className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}

                          {selectedDoubt.isLocked
                            ? "Unlock"
                            : "Lock"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusAction(
                              "close",
                            )
                          }
                          disabled={
                            busyAction ===
                            "close:"
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <X className="h-3.5 w-3.5" />
                          Close Discussion
                        </button>
                      </>
                    ) : null}
                  </div>

                  {!selectedDoubt.isLocked &&
                  selectedDoubt.status !==
                    "closed" &&
                  selectedDoubt.status !==
                    "resolved" ? (
                    <form
                      onSubmit={
                        handlePostAnswer
                      }
                      className="flex items-end gap-3"
                    >
                      <textarea
                        value={
                          answerContent
                        }
                        onChange={(
                          event,
                        ) =>
                          setAnswerContent(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Write a helpful answer..."
                        rows={2}
                        maxLength={5000}
                        className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />

                      <button
                        type="submit"
                        disabled={
                          busyAction ===
                            "post-answer" ||
                          !answerContent.trim()
                        }
                        className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-5 text-sm font-bold text-white transition hover:bg-[#093581] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyAction ===
                        "post-answer" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}

                        <span className="hidden sm:inline">
                          Post Answer
                        </span>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                      <Lock className="h-4 w-4" />

                      {selectedDoubt.status ===
                      "resolved"
                        ? "This doubt has been resolved."
                        : "This discussion is closed for new answers."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </section>
  );
}