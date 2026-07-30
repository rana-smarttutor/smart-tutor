import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  deleteNotificationForUser,
  updateNotificationReadState,
} from "@/lib/data-store";

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to update notifications." },
      { status: 401 },
    );
  }

  const { notificationId } = await context.params;

  if (!notificationId?.trim()) {
    return NextResponse.json(
      { error: "Notification ID is required." },
      { status: 400 },
    );
  }

  let body: {
    read?: boolean;
  };

  try {
    body = (await request.json()) as {
      read?: boolean;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid notification update payload." },
      { status: 400 },
    );
  }

  if (typeof body.read !== "boolean") {
    return NextResponse.json(
      { error: "Read status must be true or false." },
      { status: 400 },
    );
  }

  try {
    const notification = await updateNotificationReadState({
      notificationId,
      userId: session.id,
      read: body.read,
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification was not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "update",
      category: "communication",
      details: `Updated notification read status: ${notificationId} (read: ${body.read})`,
      path: `/api/notifications/${notificationId}`,
      method: "PATCH",
      request,
      session,
      metadata: { notificationId, read: body.read },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update notification.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to remove notifications." },
      { status: 401 },
    );
  }

  const { notificationId } = await context.params;

  if (!notificationId?.trim()) {
    return NextResponse.json(
      { error: "Notification ID is required." },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteNotificationForUser({
      notificationId,
      userId: session.id,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Notification was not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "delete",
      category: "communication",
      details: `Deleted notification: ${notificationId}`,
      path: `/api/notifications/${notificationId}`,
      method: "DELETE",
      request,
      session,
      metadata: { notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove notification.",
      },
      { status: 400 },
    );
  }
}