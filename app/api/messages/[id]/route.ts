import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  deleteMessage,
  updateMessage,
} from "@/lib/data-store";
import {
  sanitizeTextInput,
  sanitizeTextareaInput,
} from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to edit messages." },
      { status: 401 },
    );
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators and admins can edit messages." },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: {
    title?: string;
    body?: string;
    channel?: string;
    expiresAt?: string | null;
  };

  try {
    body = (await request.json()) as {
      title?: string;
      body?: string;
      channel?: string;
      expiresAt?: string | null;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid update payload." },
      { status: 400 },
    );
  }

  const title = body.title !== undefined ? sanitizeTextInput(body.title, 80) : undefined;
  const content = body.body !== undefined ? sanitizeTextareaInput(body.body, 280) : undefined;
  const channel = body.channel !== undefined ? sanitizeTextInput(body.channel, 40) : undefined;

  if (title === "") {
    return NextResponse.json(
      { error: "Message title cannot be empty." },
      { status: 400 },
    );
  }

  if (content === "") {
    return NextResponse.json(
      { error: "Message body cannot be empty." },
      { status: 400 },
    );
  }

  if (channel === "") {
    return NextResponse.json(
      { error: "Message channel cannot be empty." },
      { status: 400 },
    );
  }

  const expiresAt = body.expiresAt !== undefined
    ? body.expiresAt
    : undefined;

  if (expiresAt !== undefined && expiresAt !== null) {
    const parsed = new Date(expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiry time." },
        { status: 400 },
      );
    }
  }

  const updated = await updateMessage(id, {
    title,
    body: content,
    channel,
    expiresAt,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Message not found." },
      { status: 404 },
    );
  }

  await logAction({
    action: "update",
    category: "messages",
    details: `Updated message: ${id}`,
    path: `/api/messages/${id}`,
    method: "PATCH",
    request,
    session,
    metadata: { messageId: id },
  });

  return NextResponse.json({ message: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to delete messages." },
      { status: 401 },
    );
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators and admins can delete messages." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const deleted = await deleteMessage(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Message not found." },
      { status: 404 },
    );
  }

  await logAction({
    action: "delete",
    category: "messages",
    details: `Deleted message: ${id}`,
    path: `/api/messages/${id}`,
    method: "DELETE",
    request,
    session,
    metadata: { messageId: id },
  });

  return NextResponse.json({ success: true });
}
