import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  createNotifications,
  getNotificationRecipientIdsForSender,
  getNotificationsForUser,
} from "@/lib/data-store";
import {
  sanitizeIdList,
  sanitizeTextInput,
  sanitizeTextareaInput,
} from "@/lib/validation";
import type { AppNotificationType } from "@/lib/types";

const notificationTypes = new Set<AppNotificationType>([
  "lecture",
  "homework",
  "attendance",
  "test",
  "feedback",
  "fees",
  "payment",
]);

type NotificationPayload = {
  targetMode?: "everyone" | "selected-users";
  userIds?: string[];
  title?: string;
  message?: string;
  type?: AppNotificationType;
  link?: string;
};

function isValidDashboardLink(link: string) {
  return link.startsWith("/") && !link.startsWith("//");
}

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to read notifications." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    notifications: await getNotificationsForUser(session.id),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to send notifications." },
      { status: 401 },
    );
  }

  if (!hasAnyRole(session, ["admin", "educator"])) {
    return NextResponse.json(
      { error: "Only admins and educators can send notifications." },
      { status: 403 },
    );
  }

  let body: NotificationPayload;

  try {
    body = (await request.json()) as NotificationPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid notification payload." },
      { status: 400 },
    );
  }

  const title = sanitizeTextInput(body.title, 80);
  const message = sanitizeTextareaInput(body.message, 280);
  const link = sanitizeTextInput(body.link, 160);
  const userIds = sanitizeIdList(body.userIds, 200);

  const targetMode =
    body.targetMode === "selected-users" ? "selected-users" : "everyone";

  if (!title || !message) {
    return NextResponse.json(
      { error: "Notification title and message are required." },
      { status: 400 },
    );
  }

  if (!body.type || !notificationTypes.has(body.type)) {
    return NextResponse.json(
      { error: "Choose a valid notification type." },
      { status: 400 },
    );
  }

  if (link && !isValidDashboardLink(link)) {
    return NextResponse.json(
      {
        error:
          "Notification links must be safe internal paths beginning with '/'.",
      },
      { status: 400 },
    );
  }

  if (targetMode === "selected-users" && !userIds.length) {
    return NextResponse.json(
      { error: "Select at least one notification recipient." },
      { status: 400 },
    );
  }

  try {
    const recipientIds = await getNotificationRecipientIdsForSender({
      senderId: session.id,
      senderRole: session.role as "educator" | "admin",
      targetMode,
      selectedUserIds: userIds,
    });

    if (!recipientIds.length) {
      return NextResponse.json(
        {
          error:
            "No eligible active recipients were found for this notification.",
        },
        { status: 400 },
      );
    }

    const notifications = await createNotifications({
      userIds: recipientIds,
      title,
      message,
      type: body.type,
      link: link || undefined,
    });

    return NextResponse.json(
      {
        notifications,
        createdCount: notifications.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send notifications.",
      },
      { status: 400 },
    );
  }
}