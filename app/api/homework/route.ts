import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  createHomework,
  getHomeworkForTeacher,
  getHomeworkForStudent,
  getHomeworkForBatch,
  getSubmissionsForHomework,
} from "@/lib/data-store";
import { getStudentDirectory, findFullUserById } from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (session.role === "educator") {
    const homework = await getHomeworkForTeacher(session.id);
    const enriched = await Promise.all(
      homework.map(async (hw) => ({
        ...hw,
        submissions: await getSubmissionsForHomework(hw.id),
      })),
    );
    return NextResponse.json({ homework: enriched });
  }

  if (session.role === "student") {
    const user = await findFullUserById(session.id);
    const batchIds = user?.program ? [user.program] : [];
    const homework = await getHomeworkForStudent(batchIds);
    const enriched = await Promise.all(
      homework.map(async (hw) => ({
        ...hw,
        mySubmission: await getSubmissionsForHomework(hw.id).then(
          (subs) => subs.find((s) => s.studentId === session.id) ?? null,
        ),
      })),
    );
    return NextResponse.json({ homework: enriched, batchIds });
  }

  return NextResponse.json({ homework: [] });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!hasAnyRole(session, ["educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators and admins can assign homework." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const title = sanitizeTextInput(body.title as string, 120);
  const description = sanitizeTextareaInput(body.description as string, 5000);
  const objective = sanitizeTextareaInput(body.objective as string, 2000);
  const keySteps = Array.isArray(body.keySteps)
    ? (body.keySteps as string[]).map((s) => sanitizeTextInput(s, 500)).filter(Boolean)
    : undefined;
  const deliverables = sanitizeTextareaInput(body.deliverables as string, 2000);
  const evaluationCriteria = sanitizeTextareaInput(body.evaluationCriteria as string, 2000);
  const estimatedHours = Math.max(1, Math.min(200, Number(body.estimatedHours) || 0)) || undefined;
  const taskNumber = body.taskNumber != null ? Math.max(1, Math.min(52, Number(body.taskNumber))) : undefined;
  const subject = sanitizeTextInput(body.subject as string, 60);
  const hwType = (body.hwType as string) ?? "homework";
  const maxMarks = Math.max(1, Math.min(1000, Number(body.maxMarks) || 10));
  const dueDate = body.dueDate as string;
  const batchId = sanitizeTextInput(body.batchId as string, 80);
  const batchName = sanitizeTextInput(body.batchName as string, 120);
  const allowLateSubmission = body.allowLateSubmission === true;
  const attachmentUrl = sanitizeTextInput(body.attachmentUrl as string, 500);

  if (!title || !dueDate || !batchId) {
    return NextResponse.json(
      { error: "Title, due date, and batch are required." },
      { status: 400 },
    );
  }

  // For educators: only allow homework for their assigned batches
  if (session.role === "educator") {
    const assignedTokens = await getStudentDirectory(session.id);
    const assignedBatchIds = [
      ...new Set(assignedTokens.map((s) => s.program).filter(Boolean)),
    ];
    if (!assignedBatchIds.includes(batchId)) {
      return NextResponse.json(
        { error: "You can only assign homework to your own batches." },
        { status: 403 },
      );
    }
  }

  const homework = await createHomework({
    title,
    description: description || undefined,
    objective: objective || undefined,
    keySteps,
    deliverables: deliverables || undefined,
    evaluationCriteria: evaluationCriteria || undefined,
    estimatedHours,
    taskNumber,
    subject: subject || undefined,
    hwType,
    maxMarks,
    dueDate,
    batchId,
    batchName: batchName || undefined,
    allowLateSubmission,
    attachmentUrl: attachmentUrl || undefined,
    createdBy: session.id,
    createdByName: session.name,
  });

  return NextResponse.json({ homework }, { status: 201 });
}
