import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  submitHomework,
  gradeHomeworkSubmission,
  getSubmissionsForHomework,
} from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!hasAnyRole(session, ["student"])) {
    return NextResponse.json(
      { error: "Only students can submit homework." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const homeworkId = sanitizeTextInput(body.homeworkId as string, 80);
  const content = sanitizeTextareaInput(body.content as string, 5000);
  const attachmentUrl = sanitizeTextInput(body.attachmentUrl as string, 500);

  if (!homeworkId) {
    return NextResponse.json(
      { error: "Homework ID is required." },
      { status: 400 },
    );
  }

  const submission = await submitHomework({
    homeworkId,
    studentId: session.id,
    studentName: session.name,
    content: content || undefined,
    attachmentUrl: attachmentUrl || undefined,
  });

  return NextResponse.json({ submission }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators can view submissions." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const homeworkId = url.searchParams.get("homeworkId");

  if (!homeworkId) {
    return NextResponse.json(
      { error: "homeworkId query parameter is required." },
      { status: 400 },
    );
  }

  const submissions = await getSubmissionsForHomework(homeworkId);
  return NextResponse.json({ submissions });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators can grade submissions." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const submissionId = sanitizeTextInput(body.submissionId as string, 80);
  const marks = Math.max(0, Math.min(1000, Number(body.marks) || 0));
  const feedback = sanitizeTextareaInput(body.feedback as string, 1000);

  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID is required." },
      { status: 400 },
    );
  }

  const graded = await gradeHomeworkSubmission({
    submissionId,
    marks,
    feedback: feedback || undefined,
    gradedBy: session.id,
  });

  return NextResponse.json({ submission: graded });
}
