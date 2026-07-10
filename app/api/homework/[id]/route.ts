import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  getHomeworkById,
  updateHomework,
  deleteHomework,
} from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getHomeworkById(id);
  if (!existing) {
    return NextResponse.json({ error: "Homework not found." }, { status: 404 });
  }

  if (session.role === "educator" && existing.createdBy !== session.id) {
    return NextResponse.json(
      { error: "You can only edit your own homework." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = sanitizeTextInput(body.title as string, 120);
  if (body.description !== undefined) updates.description = sanitizeTextareaInput(body.description as string, 2000);
  if (body.subject !== undefined) updates.subject = sanitizeTextInput(body.subject as string, 60);
  if (body.hwType !== undefined) updates.hwType = body.hwType;
  if (body.maxMarks !== undefined) updates.maxMarks = Math.max(1, Math.min(1000, Number(body.maxMarks) || 10));
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
  if (body.allowLateSubmission !== undefined) updates.allowLateSubmission = body.allowLateSubmission === true;

  const updated = await updateHomework(id, updates);
  return NextResponse.json({ homework: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getHomeworkById(id);
  if (!existing) {
    return NextResponse.json({ error: "Homework not found." }, { status: 404 });
  }

  if (session.role === "educator" && existing.createdBy !== session.id) {
    return NextResponse.json(
      { error: "You can only delete your own homework." },
      { status: 403 },
    );
  }

  await deleteHomework(id);
  return NextResponse.json({ ok: true });
}
