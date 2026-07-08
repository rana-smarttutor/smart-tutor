"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

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
  targetMode: "everyone" | "selected-users";
  recipientIds: string[];
  title: string;
  message: string;
  type: AppNotificationType;
  link: string;
};

const notificationTypes: Array<{
  value: AppNotificationType;
  label: string;
}> = [
  { value: "lecture", label: "Lecture" },
  { value: "homework", label: "Homework" },
  { value: "attendance", label: "Attendance" },
  { value: "test", label: "Test" },
  { value: "feedback", label: "Feedback" },
  { value: "fees", label: "Fees" },
  { value: "payment", label: "Payment" },
];

function createEmptyForm(): NotificationForm {
  return {
    targetMode: "everyone",
    recipientIds: [],
    title: "",
    message: "",
    type: "lecture",
    link: "",
  };
}

function getTypeLabel(type: AppNotificationType) {
  return (
    notificationTypes.find((item) => item.value === type)?.label ??
    "Notification"
  );
}

function getTypeStyle(type: AppNotificationType) {
  if (type === "fees" || type === "payment") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (type === "attendance") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (type === "test" || type === "feedback") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function getApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  return payload?.error ?? "Something went wrong. Please try again.";
}

export function NotificationCenter({
  role,
  managedUsers,
  onMarkAsRead,
}: NotificationCenterProps) {
  const canSendNotifications = role === "admin" || role === "educator";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [form, setForm] = useState<NotificationForm>(createEmptyForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingNotificationId, setUpdatingNotificationId] = useState<
    string | null
  >(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState<
    string | null
  >(null);

  const [showRead, setShowRead] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recipients = useMemo(() => {
    return managedUsers
      .filter((user) => {
        if (user.status !== "active" || user.verified === false) {
          return false;
        }

        if (role === "educator") {
          return user.role === "student" || user.role === "parent";
        }

        return user.role !== "admin";
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [managedUsers, role]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notification) =>
      showRead ? true : !notification.read,
    );
  }, [notifications, showRead]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const payload = (await response.json()) as {
        notifications?: AppNotification[];
      };

      const nextNotifications = Array.isArray(payload.notifications)
        ? payload.notifications
        : [];

      setNotifications(
        nextNotifications.sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  function updateForm<Key extends keyof NotificationForm>(
    key: Key,
    value: NotificationForm[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleRecipient(recipientId: string) {
    setForm((current) => ({
      ...current,
      recipientIds: current.recipientIds.includes(recipientId)
        ? current.recipientIds.filter((id) => id !== recipientId)
        : [...current.recipientIds, recipientId],
    }));
  }

  async function submitNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSendNotifications) {
      return;
    }

    setError(null);
    setNotice(null);

    const title = form.title.trim();
    const message = form.message.trim();
    const link = form.link.trim();

    if (!title || !message) {
      setError("Notification title and message are required.");
      return;
    }

    if (
      form.targetMode === "selected-users" &&
      form.recipientIds.length === 0
    ) {
      setError("Select at least one recipient.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetMode: form.targetMode,
          userIds: form.recipientIds,
          title,
          message,
          type: form.type,
          link: link || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const payload = (await response.json()) as {
        createdCount?: number;
      };

      setForm(createEmptyForm());

      setNotice(
        `${payload.createdCount ?? 0} notification${
          payload.createdCount === 1 ? "" : "s"
        } sent successfully.`,
      );

      await loadNotifications();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to send notifications.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function setNotificationRead(
    notification: AppNotification,
    read: boolean,
  ) {
    setError(null);
    setNotice(null);
    setUpdatingNotificationId(notification.id);

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const payload = (await response.json()) as {
        notification?: AppNotification;
      };

      if (payload.notification) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === payload.notification?.id
              ? payload.notification
              : item,
          ),
        );
        onMarkAsRead?.();
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update notification.",
      );
    } finally {
      setUpdatingNotificationId(null);
    }
  }

  async function deleteNotification(notification: AppNotification) {
    const shouldDelete = window.confirm(
      "Remove this notification from your notification centre?",
    );

    if (!shouldDelete) {
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingNotificationId(notification.id);

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );

      setNotice("Notification removed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove notification.",
      );
    } finally {
      setDeletingNotificationId(null);
    }
  }

  async function markAllAsRead() {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.read,
    );

    if (!unreadNotifications.length) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await Promise.all(
        unreadNotifications.map(async (notification) => {
          const response = await fetch(
            `/api/notifications/${notification.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ read: true }),
            },
          );

          if (!response.ok) {
            throw new Error(await getApiError(response));
          }
        }),
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        })),
      );

      onMarkAsRead?.();
      setNotice("All notifications marked as read.");
    } catch (markAllError) {
      setError(
        markAllError instanceof Error
          ? markAllError.message
          : "Unable to mark all notifications as read.",
      );
    }
  }

  return (
    <section className="grid gap-6">
      <header className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">Personal Alerts</p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              Notifications Centre
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              Keep track of lecture reminders, tests, attendance, feedback,
              fees, and important institute updates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={isLoading}
            className="inline-flex w-fit items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="surface-soft rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Total Notifications
          </p>

          <p className="mt-3 text-3xl font-semibold text-[var(--color-heading)]">
            {notifications.length}
          </p>
        </article>

        <article className="surface-soft rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Unread Notifications
          </p>

          <p className="mt-3 text-3xl font-semibold text-[var(--color-primary)]">
            {unreadCount}
          </p>
        </article>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      ) : null}

      {canSendNotifications ? (
        <form
          onSubmit={submitNotification}
          className="surface rounded-[2rem] p-5 sm:p-6"
        >
          <div>
            <p className="section-label">Send Alert</p>

            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              Create Notification
            </h3>

            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {role === "admin"
                ? "Send an in-app notification to selected users or all active users."
                : "Send an in-app notification to selected students or parents."}
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
              Notification Type
              <select
                value={form.type}
                onChange={(event) =>
                  updateForm(
                    "type",
                    event.target.value as AppNotificationType,
                  )
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              >
                {notificationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)]">
              Target Group
              <select
                value={form.targetMode}
                onChange={(event) =>
                  updateForm(
                    "targetMode",
                    event.target.value as NotificationForm["targetMode"],
                  )
                }
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              >
                <option value="everyone">All eligible active users</option>
                <option value="selected-users">Selected users only</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)] lg:col-span-2">
              Title
              <input
                type="text"
                value={form.title}
                maxLength={80}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Example: Mathematics lecture rescheduled"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)] lg:col-span-2">
              Notification Message
              <textarea
                value={form.message}
                maxLength={280}
                rows={4}
                onChange={(event) =>
                  updateForm("message", event.target.value)
                }
                placeholder="Write the notification details here..."
                className="resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--color-heading)] lg:col-span-2">
              Optional Dashboard Link
              <input
                type="text"
                value={form.link}
                maxLength={160}
                onChange={(event) => updateForm("link", event.target.value)}
                placeholder="Example: /dashboard?section=weekly-tests"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>
          </div>

          {form.targetMode === "selected-users" ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-heading)]">
                    Select Recipients
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {form.recipientIds.length} selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      recipientIds:
                        current.recipientIds.length === recipients.length
                          ? []
                          : recipients.map((recipient) => recipient.id),
                    }))
                  }
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {form.recipientIds.length === recipients.length
                    ? "Clear All"
                    : "Select All"}
                </button>
              </div>

              <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background)] p-3 sm:grid-cols-2">
                {recipients.map((recipient) => {
                  const selected = form.recipientIds.includes(recipient.id);

                  return (
                    <label
                      key={recipient.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                        selected
                          ? "border-[var(--color-primary)] bg-[var(--color-panel)]"
                          : "border-transparent hover:border-[var(--color-border)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[var(--color-heading)]">
                          {recipient.name}
                        </span>

                        <span className="block truncate text-xs text-[var(--color-muted)]">
                          {recipient.role}
                        </span>
                      </span>
                    </label>
                  );
                })}

                {!recipients.length ? (
                  <p className="col-span-full py-6 text-center text-sm text-[var(--color-muted)]">
                    No eligible active recipients are available.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving || recipients.length === 0}
            className="mt-6 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Sending..." : "Send Notification"}
          </button>
        </form>
      ) : null}

      <section className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-label">My Notification Inbox</p>

            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              Recent Notifications
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowRead((current) => !current)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {showRead ? "Unread Only" : "Show All"}
            </button>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={unreadCount === 0}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark All Read
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : visibleNotifications.length ? (
          <div className="mt-6 grid gap-4">
            {visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-[1.5rem] border p-5 transition ${
                  notification.read
                    ? "border-[var(--color-border)] bg-[var(--color-background)]"
                    : "border-[var(--color-primary)]/30 bg-[var(--color-panel)] shadow-sm"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${getTypeStyle(
                          notification.type,
                        )}`}
                      >
                        {getTypeLabel(notification.type)}
                      </span>

                      {!notification.read ? (
                        <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>

                    <h4 className="mt-4 text-lg font-semibold text-[var(--color-heading)]">
                      {notification.title}
                    </h4>

                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                      {notification.message}
                    </p>

                    <p className="mt-4 text-xs font-medium text-[var(--color-muted)]">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {notification.link ? (
                      <a
                        href={notification.link}
                        className="rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                      >
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
                      disabled={updatingNotificationId === notification.id}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingNotificationId === notification.id
                        ? "Updating..."
                        : notification.read
                          ? "Mark Unread"
                          : "Mark Read"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteNotification(notification)}
                      disabled={deletingNotificationId === notification.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingNotificationId === notification.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {showRead
                ? "You do not have any notifications yet."
                : "You do not have unread notifications."}
            </p>
          </div>
        )}
      </section>
    </section>
  );
}