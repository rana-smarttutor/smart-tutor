"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Bell,
  BellRing,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  Inbox,
  Megaphone,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import type {
  AppNotification,
  AppNotificationType,
  ManagedUser,
  Role,
} from "@/lib/types";

type NotificationCenterProps = {
  role: Role;
  managedUsers: ManagedUser[];
  onMarkAsRead?: () => void;
};

type NotificationForm = {
  targetMode:
    | "everyone"
    | "selected-users";

  recipientIds: string[];

  title: string;

  message: string;

  type:
    AppNotificationType;

  link: string;
};

type InboxFilter =
  | "all"
  | "unread"
  | AppNotificationType;

type NotificationGroup =
  | "Today"
  | "Yesterday"
  | "Earlier";

const notificationTypes: Array<{
  value: AppNotificationType;
  label: string;
}> = [
  {
    value: "lecture",
    label: "Lecture",
  },
  {
    value: "homework",
    label: "Homework",
  },
  {
    value: "attendance",
    label: "Attendance",
  },
  {
    value: "test",
    label: "Test",
  },
  {
    value: "feedback",
    label: "Feedback",
  },
  {
    value: "fees",
    label: "Fees",
  },
  {
    value: "payment",
    label: "Payment",
  },
  {
    value: "placement",
    label: "Placement",
  },
];

const inboxFilters: Array<{
  value: InboxFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "unread",
    label: "Unread",
  },
  {
    value: "lecture",
    label: "Lectures",
  },
  {
    value: "homework",
    label: "Homework",
  },
  {
    value: "test",
    label: "Tests",
  },
  {
    value: "attendance",
    label: "Attendance",
  },
  {
    value: "feedback",
    label: "Feedback",
  },
  {
    value: "fees",
    label: "Fees",
  },
];

function createEmptyForm():
NotificationForm {
  return {
    targetMode:
      "everyone",

    recipientIds: [],

    title: "",

    message: "",

    type:
      "lecture",

    link: "",
  };
}

function getTypeLabel(
  type:
    AppNotificationType,
) {
  return (
    notificationTypes.find(
      (item) =>
        item.value ===
        type,
    )?.label ??
    "Notification"
  );
}

function getTypeTheme(
  type:
    AppNotificationType,
) {
  if (
    type ===
    "lecture"
  ) {
    return {
      icon:
        "bg-blue-100 text-blue-700",

      badge:
        "border-blue-200 bg-blue-50 text-blue-700",

      accent:
        "border-l-blue-500",

      dot:
        "bg-blue-500",
    };
  }

  if (
    type ===
    "homework"
  ) {
    return {
      icon:
        "bg-orange-100 text-orange-700",

      badge:
        "border-orange-200 bg-orange-50 text-orange-700",

      accent:
        "border-l-orange-500",

      dot:
        "bg-orange-500",
    };
  }

  if (
    type ===
    "attendance"
  ) {
    return {
      icon:
        "bg-cyan-100 text-cyan-700",

      badge:
        "border-cyan-200 bg-cyan-50 text-cyan-700",

      accent:
        "border-l-cyan-500",

      dot:
        "bg-cyan-500",
    };
  }

  if (
    type ===
    "test"
  ) {
    return {
      icon:
        "bg-violet-100 text-violet-700",

      badge:
        "border-violet-200 bg-violet-50 text-violet-700",

      accent:
        "border-l-violet-500",

      dot:
        "bg-violet-500",
    };
  }

  if (
    type ===
    "feedback"
  ) {
    return {
      icon:
        "bg-pink-100 text-pink-700",

      badge:
        "border-pink-200 bg-pink-50 text-pink-700",

      accent:
        "border-l-pink-500",

      dot:
        "bg-pink-500",
    };
  }

  if (
    type ===
      "fees" ||
    type ===
      "payment"
  ) {
    return {
      icon:
        "bg-emerald-100 text-emerald-700",

      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",

      accent:
        "border-l-emerald-500",

      dot:
        "bg-emerald-500",
    };
  }

  return {
    icon:
      "bg-amber-100 text-amber-700",

    badge:
      "border-amber-200 bg-amber-50 text-amber-700",

    accent:
      "border-l-amber-500",

    dot:
      "bg-amber-500",
  };
}

function getTypeIcon(
  type:
    AppNotificationType,
) {
  if (
    type ===
    "lecture"
  ) {
    return (
      <BookOpen
        size={20}
      />
    );
  }

  if (
    type ===
    "homework"
  ) {
    return (
      <FileText
        size={20}
      />
    );
  }

  if (
    type ===
    "attendance"
  ) {
    return (
      <CalendarCheck
        size={20}
      />
    );
  }

  if (
    type ===
    "test"
  ) {
    return (
      <GraduationCap
        size={20}
      />
    );
  }

  if (
    type ===
    "feedback"
  ) {
    return (
      <MessageSquareText
        size={20}
      />
    );
  }

  if (
    type ===
    "fees"
  ) {
    return (
      <CreditCard
        size={20}
      />
    );
  }

  if (
    type ===
    "payment"
  ) {
    return (
      <CircleDollarSign
        size={20}
      />
    );
  }

  return (
    <Megaphone
      size={20}
    />
  );
}

function formatDateTime(
  value:
    string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}

function getDateGroup(
  value:
    string,
): NotificationGroup {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Earlier";
  }

  const today =
    new Date();

  const todayStart =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

  const notificationStart =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

  const difference =
    Math.round(
      (
        todayStart.getTime() -
        notificationStart.getTime()
      ) /
        (
          24 *
          60 *
          60 *
          1000
        ),
    );

  if (
    difference <=
    0
  ) {
    return "Today";
  }

  if (
    difference ===
    1
  ) {
    return "Yesterday";
  }

  return "Earlier";
}

async function getApiError(
  response:
    Response,
) {
  const payload =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      | {
          error?:
            string;
        }
      | null;

  return (
    payload?.error ??
    "Something went wrong. Please try again."
  );
}

export function NotificationCenter({
  role,
  managedUsers,
  onMarkAsRead,
}: NotificationCenterProps) {
  const canSendNotifications =
    role ===
      "admin" ||
    role ===
      "educator";

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      AppNotification[]
    >([]);

  const [
    form,
    setForm,
  ] =
    useState<NotificationForm>(
      createEmptyForm,
    );

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<InboxFilter>(
      "all",
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true,
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false,
    );

  const [
    updatingNotificationId,
    setUpdatingNotificationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    deletingNotificationId,
    setDeletingNotificationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    notice,
    setNotice,
  ] =
    useState<
      string | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const recipients =
    useMemo(
      () =>
        managedUsers
          .filter(
            (
              user,
            ) => {
              if (
                user.status !==
                  "active" ||
                user.verified ===
                  false
              ) {
                return false;
              }

              if (
                role ===
                "educator"
              ) {
                return (
                  user.role ===
                    "student" ||
                  user.role ===
                    "parent"
                );
              }

              return (
                user.role !==
                "admin"
              );
            },
          )
          .sort(
            (
              left,
              right,
            ) =>
              left.name.localeCompare(
                right.name,
              ),
          ),
      [
        managedUsers,
        role,
      ],
    );

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            notification,
          ) =>
            !notification.read,
        ).length,
      [
        notifications,
      ],
    );

  const readCount =
    notifications.length -
    unreadCount;

  const visibleNotifications =
    useMemo(
      () =>
        notifications.filter(
          (
            notification,
          ) => {
            if (
              activeFilter ===
              "all"
            ) {
              return true;
            }

            if (
              activeFilter ===
              "unread"
            ) {
              return (
                !notification.read
              );
            }

            return (
              notification.type ===
              activeFilter
            );
          },
        ),
      [
        notifications,
        activeFilter,
      ],
    );

  const groupedNotifications =
    useMemo(
      () => {
        const groups: Record<
          NotificationGroup,
          AppNotification[]
        > = {
          Today: [],

          Yesterday: [],

          Earlier: [],
        };

        for (
          const notification
          of visibleNotifications
        ) {
          groups[
            getDateGroup(
              notification.createdAt,
            )
          ].push(
            notification,
          );
        }

        return groups;
      },
      [
        visibleNotifications,
      ],
    );

  const loadNotifications =
    useCallback(
      async () => {
        setIsLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const response =
            await fetch(
              "/api/notifications",
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await getApiError(
                response,
              ),
            );
          }

          const payload =
            (await response.json()) as {
              notifications?:
                AppNotification[];
            };

          const nextNotifications =
            Array.isArray(
              payload.notifications,
            )
              ? payload.notifications
              : [];

          setNotifications(
            nextNotifications.sort(
              (
                left,
                right,
              ) =>
                right.createdAt.localeCompare(
                  left.createdAt,
                ),
            ),
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
            Error
              ? loadError.message
              : "Unable to load notifications.",
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void loadNotifications();
    },
    [
      loadNotifications,
    ],
  );

  function updateForm<
    Key extends
      keyof NotificationForm,
  >(
    key:
      Key,

    value:
      NotificationForm[Key],
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );
  }

  function toggleRecipient(
    recipientId:
      string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        recipientIds:
          current.recipientIds.includes(
            recipientId,
          )
            ? current.recipientIds.filter(
                (
                  id,
                ) =>
                  id !==
                  recipientId,
              )
            : [
                ...current.recipientIds,

                recipientId,
              ],
      }),
    );
  }

  async function submitNotification(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !canSendNotifications
    ) {
      return;
    }

    setError(
      null,
    );

    setNotice(
      null,
    );

    const title =
      form.title.trim();

    const message =
      form.message.trim();

    const link =
      form.link.trim();

    if (
      !title ||
      !message
    ) {
      setError(
        "Notification title and message are required.",
      );

      return;
    }

    if (
      form.targetMode ===
        "selected-users" &&
      form.recipientIds
        .length ===
        0
    ) {
      setError(
        "Select at least one recipient.",
      );

      return;
    }

    setIsSaving(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/notifications",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                targetMode:
                  form.targetMode,

                userIds:
                  form.recipientIds,

                title,

                message,

                type:
                  form.type,

                link:
                  link ||
                  undefined,
              }),
          },
        );

      if (
        !response.ok
      ) {
        throw new Error(
          await getApiError(
            response,
          ),
        );
      }

      const payload =
        (await response.json()) as {
          createdCount?:
            number;
        };

      setForm(
        createEmptyForm(),
      );

      setNotice(
        `${
          payload.createdCount ??
          0
        } notification${
          payload.createdCount ===
          1
            ? ""
            : "s"
        } sent successfully.`,
      );

      await loadNotifications();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
        Error
          ? saveError.message
          : "Unable to send notifications.",
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function setNotificationRead(
    notification:
      AppNotification,

    read:
      boolean,
  ) {
    setError(
      null,
    );

    setNotice(
      null,
    );

    setUpdatingNotificationId(
      notification.id,
    );

    try {
      const response =
        await fetch(
          `/api/notifications/${notification.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                read,
              }),
          },
        );

      if (
        !response.ok
      ) {
        throw new Error(
          await getApiError(
            response,
          ),
        );
      }

      const payload =
        (await response.json()) as {
          notification?:
            AppNotification;
        };

      if (
        payload.notification
      ) {
        setNotifications(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item.id ===
                payload.notification
                  ?.id
                  ? payload.notification
                  : item,
            ),
        );

        onMarkAsRead?.();
      }
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
        Error
          ? updateError.message
          : "Unable to update notification.",
      );
    } finally {
      setUpdatingNotificationId(
        null,
      );
    }
  }

  async function deleteNotification(
    notification:
      AppNotification,
  ) {
    const shouldDelete =
      window.confirm(
        "Remove this notification from your notification centre?",
      );

    if (
      !shouldDelete
    ) {
      return;
    }

    setError(
      null,
    );

    setNotice(
      null,
    );

    setDeletingNotificationId(
      notification.id,
    );

    try {
      const response =
        await fetch(
          `/api/notifications/${notification.id}`,
          {
            method:
              "DELETE",
          },
        );

      if (
        !response.ok
      ) {
        throw new Error(
          await getApiError(
            response,
          ),
        );
      }

      setNotifications(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              notification.id,
          ),
      );

      setNotice(
        "Notification removed.",
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
        Error
          ? deleteError.message
          : "Unable to remove notification.",
      );
    } finally {
      setDeletingNotificationId(
        null,
      );
    }
  }

  async function markAllAsRead() {
    const unreadNotifications =
      notifications.filter(
        (
          notification,
        ) =>
          !notification.read,
      );

    if (
      !unreadNotifications.length
    ) {
      return;
    }

    setError(
      null,
    );

    setNotice(
      null,
    );

    try {
      await Promise.all(
        unreadNotifications.map(
          async (
            notification,
          ) => {
            const response =
              await fetch(
                `/api/notifications/${notification.id}`,
                {
                  method:
                    "PATCH",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      read:
                        true,
                    }),
                },
              );

            if (
              !response.ok
            ) {
              throw new Error(
                await getApiError(
                  response,
                ),
              );
            }
          },
        ),
      );

      setNotifications(
        (
          current,
        ) =>
          current.map(
            (
              notification,
            ) => ({
              ...notification,

              read:
                true,
            }),
          ),
      );

      onMarkAsRead?.();

      setNotice(
        "All notifications marked as read.",
      );
    } catch (
      markAllError
    ) {
      setError(
        markAllError instanceof
        Error
          ? markAllError.message
          : "Unable to mark all notifications as read.",
      );
    }
  }

  return (
    <section className="grid gap-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0A2F7A] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-[0_18px_50px_rgba(11,64,161,0.24)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
              <BellRing
                size={27}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  className="text-blue-100"
                />

                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Personal Alerts
                </p>
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                Notification Centre
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Stay updated with lectures, homework, tests, attendance,
                feedback, fees, payments and institute announcements.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadNotifications()
            }
            disabled={
              isLoading
            }
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Inbox
                  size={20}
                />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                  Total
                </p>

                <p className="mt-0.5 text-2xl font-black">
                  {
                    notifications.length
                  }
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Bell
                  size={20}
                />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                  Unread
                </p>

                <p className="mt-0.5 text-2xl font-black">
                  {
                    unreadCount
                  }
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <CheckCheck
                  size={20}
                />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                  Read
                </p>

                <p className="mt-0.5 text-2xl font-black">
                  {
                    readCount
                  }
                </p>
              </div>
            </div>
          </article>
        </div>
      </header>

      {/* Messages */}
      {notice ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2
            size={18}
            className="shrink-0"
          />

          {
            notice
          }
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {
            error
          }
        </div>
      ) : null}

      {/* Create Notification */}
      {canSendNotifications ? (
        <form
          onSubmit={
            submitNotification
          }
          className="surface overflow-hidden rounded-[2rem]"
        >
          <div className="border-b border-[var(--color-border)] bg-gradient-to-r from-blue-50 to-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B40A1] text-white shadow-lg shadow-blue-900/15">
                <Send
                  size={20}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B40A1]">
                  Send Alert
                </p>

                <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--color-heading)]">
                  Create Notification
                </h3>

                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {role ===
                  "admin"
                    ? "Send an alert to all eligible users or choose specific recipients."
                    : "Send an alert to your selected students or parents."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                Notification Type

                <select
                  value={
                    form.type
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "type",

                      event
                        .target
                        .value as AppNotificationType,
                    )
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#0B40A1] focus:ring-4 focus:ring-blue-100"
                >
                  {notificationTypes.map(
                    (
                      type,
                    ) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >
                        {
                          type.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
                Target Group

                <select
                  value={
                    form.targetMode
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "targetMode",

                      event
                        .target
                        .value as NotificationForm["targetMode"],
                    )
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#0B40A1] focus:ring-4 focus:ring-blue-100"
                >
                  <option value="everyone">
                    All eligible active users
                  </option>

                  <option value="selected-users">
                    Selected users only
                  </option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)] lg:col-span-2">
                Title

                <input
                  type="text"
                  value={
                    form.title
                  }
                  maxLength={
                    80
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "title",

                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Example: Mathematics lecture rescheduled"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#0B40A1] focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)] lg:col-span-2">
                Notification Message

                <textarea
                  value={
                    form.message
                  }
                  maxLength={
                    280
                  }
                  rows={
                    4
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "message",

                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Write the notification details here..."
                  className="resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#0B40A1] focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)] lg:col-span-2">
                Optional Dashboard Link

                <input
                  type="text"
                  value={
                    form.link
                  }
                  maxLength={
                    160
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "link",

                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Example: /dashboard?section=weekly-tests"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#0B40A1] focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            {form.targetMode ===
            "selected-users" ? (
              <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users
                        size={17}
                        className="text-[#0B40A1]"
                      />

                      <p className="text-sm font-black text-[var(--color-heading)]">
                        Select Recipients
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {
                        form
                          .recipientIds
                          .length
                      }{" "}
                      selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          recipientIds:
                            current
                              .recipientIds
                              .length ===
                            recipients.length
                              ? []
                              : recipients.map(
                                  (
                                    recipient,
                                  ) =>
                                    recipient.id,
                                ),
                        }),
                      )
                    }
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:border-[#0B40A1] hover:text-[#0B40A1]"
                  >
                    {form
                      .recipientIds
                      .length ===
                    recipients.length
                      ? "Clear All"
                      : "Select All"}
                  </button>
                </div>

                <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                  {recipients.map(
                    (
                      recipient,
                    ) => {
                      const selected =
                        form.recipientIds.includes(
                          recipient.id,
                        );

                      return (
                        <label
                          key={
                            recipient.id
                          }
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                            selected
                              ? "border-[#0B40A1] bg-blue-50"
                              : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleRecipient(
                                recipient.id,
                              )
                            }
                            className="h-4 w-4 accent-[#0B40A1]"
                          />

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0B40A1]">
                            <UserRound
                              size={16}
                            />
                          </div>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[var(--color-heading)]">
                              {
                                recipient.name
                              }
                            </span>

                            <span className="block truncate text-xs capitalize text-[var(--color-muted)]">
                              {
                                recipient.role
                              }
                            </span>
                          </span>
                        </label>
                      );
                    },
                  )}

                  {!recipients.length ? (
                    <p className="col-span-full py-8 text-center text-sm text-[var(--color-muted)]">
                      No eligible active recipients are available.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={
                isSaving ||
                recipients.length ===
                  0
              }
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#082F79] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send
                size={16}
              />

              {isSaving
                ? "Sending..."
                : "Send Notification"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Inbox */}
      <section className="surface overflow-hidden rounded-[2rem]">
        <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B40A1]">
                My Notification Inbox
              </p>

              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-heading)]">
                Recent Notifications
              </h3>

              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Review your latest alerts and important updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void markAllAsRead()
              }
              disabled={
                unreadCount ===
                0
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-xs font-bold text-[var(--color-heading)] transition hover:border-[#0B40A1] hover:text-[#0B40A1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck
                size={15}
              />

              Mark All Read
            </button>
          </div>

          {/* Filters */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {inboxFilters.map(
              (
                filter,
              ) => {
                const isActive =
                  activeFilter ===
                  filter.value;

                return (
                  <button
                    key={
                      filter.value
                    }
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        filter.value,
                      )
                    }
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                      isActive
                        ? "border-[#0B40A1] bg-[#0B40A1] text-white shadow-md"
                        : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)] hover:border-[#0B40A1] hover:text-[#0B40A1]"
                    }`}
                  >
                    {
                      filter.label
                    }

                    {filter.value ===
                    "unread" ? (
                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-blue-100 text-[#0B40A1]"
                        }`}
                      >
                        {
                          unreadCount
                        }
                      </span>
                    ) : null}
                  </button>
                );
              },
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3">
              <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#0B40A1] border-t-transparent" />

              <p className="text-sm font-semibold text-[var(--color-muted)]">
                Loading notifications...
              </p>
            </div>
          ) : visibleNotifications.length ? (
            <div className="grid gap-7">
              {(
                [
                  "Today",
                  "Yesterday",
                  "Earlier",
                ] as NotificationGroup[]
              ).map(
                (
                  group,
                ) => {
                  const groupItems =
                    groupedNotifications[
                      group
                    ];

                  if (
                    !groupItems.length
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={
                        group
                      }
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--color-muted)]">
                          {
                            group
                          }
                        </p>

                        <div className="h-px flex-1 bg-[var(--color-border)]" />

                        <span className="rounded-full bg-[var(--color-background)] px-2 py-1 text-[10px] font-bold text-[var(--color-muted)]">
                          {
                            groupItems.length
                          }
                        </span>
                      </div>

                      <div className="grid gap-3">
                        {groupItems.map(
                          (
                            notification,
                          ) => {
                            const theme =
                              getTypeTheme(
                                notification.type,
                              );

                            return (
                              <article
                                key={
                                  notification.id
                                }
                                className={`group relative overflow-hidden rounded-2xl border border-l-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
                                  theme.accent
                                } ${
                                  notification.read
                                    ? "border-[var(--color-border)] bg-[var(--color-panel)]"
                                    : "border-blue-200 bg-gradient-to-r from-blue-50/80 to-white shadow-sm"
                                }`}
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="flex min-w-0 items-start gap-4">
                                    <div
                                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}
                                    >
                                      {getTypeIcon(
                                        notification.type,
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${theme.badge}`}
                                        >
                                          {getTypeLabel(
                                            notification.type,
                                          )}
                                        </span>

                                        {!notification.read ? (
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B40A1] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white" />

                                            New
                                          </span>
                                        ) : null}
                                      </div>

                                      <h4 className="mt-3 text-base font-black leading-6 text-[var(--color-heading)] sm:text-lg">
                                        {
                                          notification.title
                                        }
                                      </h4>

                                      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                                        {
                                          notification.message
                                        }
                                      </p>

                                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
                                        <Clock3
                                          size={13}
                                        />

                                        {formatDateTime(
                                          notification.createdAt,
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                                    {notification.link ? (
                                      <a
                                        href={
                                          notification.link
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B40A1] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#082F79]"
                                      >
                                        <ExternalLink
                                          size={13}
                                        />

                                        Open
                                      </a>
                                    ) : null}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void setNotificationRead(
                                          notification,

                                          !notification.read,
                                        )
                                      }
                                      disabled={
                                        updatingNotificationId ===
                                        notification.id
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:border-[#0B40A1] hover:text-[#0B40A1] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {notification.read ? (
                                        <Bell
                                          size={13}
                                        />
                                      ) : (
                                        <Check
                                          size={13}
                                        />
                                      )}

                                      {updatingNotificationId ===
                                      notification.id
                                        ? "Updating..."
                                        : notification.read
                                          ? "Mark Unread"
                                          : "Mark Read"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void deleteNotification(
                                          notification,
                                        )
                                      }
                                      disabled={
                                        deletingNotificationId ===
                                        notification.id
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <Trash2
                                        size={13}
                                      />

                                      {deletingNotificationId ===
                                      notification.id
                                        ? "Removing..."
                                        : "Remove"}
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/80 to-white px-6 py-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-[#0B40A1]">
                {activeFilter ===
                "unread" ? (
                  <CheckCheck
                    size={34}
                  />
                ) : (
                  <Bell
                    size={34}
                  />
                )}
              </div>

              <h4 className="mt-5 text-xl font-black text-[var(--color-heading)]">
                {activeFilter ===
                "unread"
                  ? "You are all caught up"
                  : "No notifications here"}
              </h4>

              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {activeFilter ===
                "unread"
                  ? "You currently have no unread notifications."
                  : "New alerts and institute updates will appear here."}
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}