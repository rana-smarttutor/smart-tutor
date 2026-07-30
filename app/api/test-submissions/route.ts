import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { createTestSubmission, getTestSubmissionsForRole, gradeSubmission } from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to access submissions." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    submissions: await getTestSubmissionsForRole(session.role, session.id),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session || session.role !== "student") {
    return NextResponse.json(
      { error: "Only students can submit assigned tests." },
      { status: 403 },
    );
  }

  let body: {
    testId?: string;
    answers?: number[];
  };

  try {
    body = (await request.json()) as {
      testId?: string;
      answers?: number[];
    };
  } catch {
    return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });
  }

  const testId = sanitizeTextInput(body.testId, 60);
  const answers =
    body.answers?.map((answer) => (typeof answer === "number" && answer >= -1 ? Math.floor(answer) : -1)) ?? [];

  if (!testId) {
    return NextResponse.json({ error: "Test id is required." }, { status: 400 });
  }

  const result = await createTestSubmission({
    testId,
    studentId: session.id,
    studentName: session.name,
    answers,
  });

  if (!result) {
    return NextResponse.json({ error: "Test could not be scored." }, { status: 404 });
  }

  await logAction({
    action: "create",
    category: "exams",
    details: `Test submission created for test ${testId}`,
    path: "/api/test-submissions",
    method: "POST",
    request,
    session,
    metadata: { testId, submissionId: result.submission.id, studentId: session.id },
  });

  return NextResponse.json({ submission: result.submission }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators and admins can grade submissions." },
      { status: 403 },
    );
  }

  let body: {
    submissionId?: string;
    score?: number;
    feedback?: string;
  };

  try {
    body = (await request.json()) as {
      submissionId?: string;
      score?: number;
      feedback?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid grading payload." }, { status: 400 });
  }

  const submissionId = sanitizeTextInput(body.submissionId, 60);
  const score = typeof body.score === "number" ? Math.max(0, Math.floor(body.score)) : NaN;
  const feedback = sanitizeTextareaInput(body.feedback, 200);

  if (!submissionId || Number.isNaN(score)) {
    return NextResponse.json(
      { error: "Submission id and manual score are required." },
      { status: 400 },
    );
  }

  const result = await gradeSubmission({
    submissionId,
    score,
    feedback,
    gradedBy: session.name,
  });

  if (!result) {
    return NextResponse.json({ error: "Submission could not be graded." }, { status: 404 });
  }

  await logAction({
    action: "update",
    category: "exams",
    details: `Test submission graded: ${submissionId}`,
    path: "/api/test-submissions",
    method: "PATCH",
    request,
    session,
    metadata: { submissionId, score, gradedBy: session.name },
  });

  return NextResponse.json(result, { status: 200 });
}
