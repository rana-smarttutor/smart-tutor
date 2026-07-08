import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { deleteTest, updateTest } from "@/lib/data-store";
import { sanitizeIdList, sanitizeOptions, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ testId: string }> },
) {
  const session = await getSessionUser();
  const { testId } = await params;

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: {
    title?: string;
    status?: string;
    summary?: string;
    assignedUserIds?: string[];
    questions?: {
      id?: string;
      prompt?: string;
      options?: string[];
    }[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const title = body.title !== undefined ? sanitizeTextInput(body.title, 80) : undefined;
  const summary = body.summary !== undefined ? sanitizeTextareaInput(body.summary, 220) : undefined;
  const status = body.status !== undefined ? sanitizeTextInput(body.status, 30) : undefined;
  const assignedUserIds = body.assignedUserIds !== undefined ? sanitizeIdList(body.assignedUserIds, 50) : undefined;
  const questions = body.questions !== undefined
    ? body.questions.map((q, i) => ({
        id: sanitizeTextInput(q.id, 40) || `q-${i + 1}`,
        prompt: sanitizeTextInput(q.prompt, 120) || `Question ${i + 1}`,
        options: sanitizeOptions(q.options),
      }))
    : undefined;

  if (questions && questions.some((q) => ![2, 4].includes(q.options.length))) {
    return NextResponse.json(
      { error: "Each question must have 2 or 4 options." },
      { status: 400 },
    );
  }

  const updated = await updateTest(testId, {
    title,
    summary,
    status,
    assignedUserIds,
    questions,
  });

  if (!updated) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  return NextResponse.json({ test: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
) {
  const session = await getSessionUser();
  const { testId } = await params;

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const deleted = await deleteTest(testId);

  if (!deleted) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
