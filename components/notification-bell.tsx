"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";

import type { AppNotification } from "@/lib/types";

type NotificationBellProps = {
  onOpenNotifications: () => void;
  onOpenChat?: () => void;
};

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getNotificationLabel(type: AppNotification["type"]) {
const labels: Record<AppNotification["type"], string> = {
  lecture: "Lecture",
  homework: "Homework",
  attendance: "Attendance",
  test: "Test",
  feedback: "Feedback",
  fees: "Fees",
  payment: "Payment",
  placement: "Placement",
  ptm: "PTM",
  doubt: "Doubt Box",
};

  return labels[type];
}

export function NotificationBell({
  onOpenNotifications,
  onOpenChat,
  refreshKey,
}: NotificationBellProps & { refreshKey?: number }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        return;
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
    } catch {
      // Keep the latest successful state.
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [refreshKey]);

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    function handleFocus() {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function updateReadState(notification: AppNotification, read: boolean) {
    setUpdatingId(notification.id);

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        notification?: AppNotification;
      };

      if (!payload.notification) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === payload.notification?.id ? payload.notification : item,
        ),
      );
    } catch {
      // Keep the existing state when the request fails.
    } finally {
      setUpdatingId(null);
    }
  }

  function openNotificationsPage() {
    setIsOpen(false);
    onOpenNotifications();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={
          unreadCount
            ? `${unreadCount} unread notifications`
            : "Open notifications"
        }
        aria-expanded={isOpen}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <Bell
  className="h-5 w-5 text-[#0B40A1]"
  strokeWidth={2.2}
/>

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(23rem,calc(100vw-3rem))] overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-heading)]">
                Notifications
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {unreadCount
                  ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
                  : "You are all caught up"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <span className="h-7 w-7 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
              </div>
            ) : notifications.length ? (
              notifications.slice(0, 6).map((notification) => (
                <article
                  key={notification.id}
                  className={`border-b border-[var(--color-border)] px-4 py-4 last:border-b-0 ${
                    notification.read
                      ? "bg-[var(--color-panel)]"
                      : "bg-[var(--color-highlight)]/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                          {getNotificationLabel(notification.type)}
                        </span>

                        {!notification.read ? (
                          <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm font-bold text-[var(--color-heading)]">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-[10px] font-medium text-[var(--color-muted)]">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.read ? (
                      <button
                        type="button"
                        disabled={updatingId === notification.id}
                        onClick={() => {
                          void updateReadState(notification, true);
                          if (notification.type === "feedback" && onOpenChat) {
                            onOpenChat();
                          }
                        }}
                        className="shrink-0 rounded-full border border-[var(--color-border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--color-heading)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
                      >
                        {updatingId === notification.id ? "..." : "Read"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                  No notifications yet.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] p-3">
            <button
              type="button"
              onClick={openNotificationsPage}
              className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              View All Notifications
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}