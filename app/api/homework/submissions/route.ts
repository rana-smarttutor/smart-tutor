import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  getHomeworkById,
  getStudentDirectory,
  getSubmissionForStudent,
  getSubmissionsForHomework,
  gradeHomeworkSubmission,
  submitHomework,
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

  if (!content && !attachmentUrl) {
    return NextResponse.json(
      { error: "Write a response or upload a homework file." },
      { status: 400 },
    );
  }
const homework =
  await getHomeworkById(homeworkId);

if (!homework) {
  return NextResponse.json(
    {
      error:
        "The selected homework could not be found.",
    },
    { status: 404 },
  );
}

if (
  homework.assignedStudentIds?.length &&
  !homework.assignedStudentIds.includes(
    session.id,
  )
) {
  return NextResponse.json(
    {
      error:
        "This homework was not assigned to you.",
    },
    { status: 403 },
  );
}
  const submission = await submitHomework({
    homeworkId,
    studentId: session.id,
    studentName: session.name,
    content: content || undefined,
    attachmentUrl: attachmentUrl || undefined,
  });

  await logAction({
    action: "create",
    category: "homework",
    details: `Homework submission created for homework ${homeworkId}`,
    path: "/api/homework/submissions",
    method: "POST",
    request,
    session,
    metadata: { homeworkId, submissionId: submission?.id },
  });

  return NextResponse.json({ submission }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const homeworkId = sanitizeTextInput(
    url.searchParams.get("homeworkId") ?? "",
    80,
  );

  if (!homeworkId) {
    return NextResponse.json(
      { error: "homeworkId query parameter is required." },
      { status: 400 },
    );
  }

  // Students can load only their own submission. This is needed so the
  // demo task remains submitted after a page refresh.
  if (session.role === "student") {
    const submission = await getSubmissionForStudent(
      homeworkId,
      session.id,
    );

    return NextResponse.json({
      submissions: submission ? [submission] : [],
    });
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only students, educators, and admins can view submissions." },
      { status: 403 },
    );
  }

  const submissions = await getSubmissionsForHomework(homeworkId);

  if (session.role === "admin") {
    return NextResponse.json({ submissions });
  }

  // An educator sees submissions only from students assigned to them.
  const assignedStudents = await getStudentDirectory(session.id);
  const assignedStudentIds = new Set(
    assignedStudents.map((student) => student.id),
  );

  return NextResponse.json({
    submissions: submissions.filter((submission) =>
      assignedStudentIds.has(submission.studentId),
    ),
  });
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

  if (!graded) {
    return NextResponse.json(
      { error: "Submission was not found." },
      { status: 404 },
    );
  }

  await logAction({
    action: "update",
    category: "homework",
    details: `Homework submission graded: ${submissionId}`,
    path: "/api/homework/submissions",
    method: "PATCH",
    request,
    session,
    metadata: { submissionId, marks, gradedBy: session.id },
  });

  return NextResponse.json({ submission: graded });
}