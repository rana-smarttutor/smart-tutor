import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import type { HomeworkItem } from "@/lib/types";
import {
  createHomework,
  findFullUserById,
  getHomeworkForStudent,
  getHomeworkForTeacher,
  getStudentDirectory,
  getSubmissionsForHomework,
} from "@/lib/data-store";
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
    const homework = await getHomeworkForStudent(
  session.id,
  batchIds,
);
    const enriched = await Promise.all(
      homework.map(async (hw) => ({
        ...hw,
        mySubmission: await getSubmissionsForHomework(hw.id).then(
          (subs) => subs.find((s) => s.studentId === session.id) ?? null,
        ),
      })),
    );
    return NextResponse.json({ homework: enriched });
  }

  return NextResponse.json({ homework: [] });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

if (session.role !== "educator") {
  return NextResponse.json(
    {
      error:
        "Only faculty members can assign homework.",
    },
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
  const allowLateSubmission = body.allowLateSubmission === true;
  const attachmentUrl = sanitizeTextInput(body.attachmentUrl as string, 500);
  const assignedStudentIds = Array.isArray(body.assignedStudentIds)
  ? [
      ...new Set(
        body.assignedStudentIds
          .map((value) =>
            sanitizeTextInput(
              typeof value === "string" ? value : "",
              120,
            ),
          )
          .filter(Boolean),
      ),
    ]
  : [];

if (assignedStudentIds.length === 0) {
  return NextResponse.json(
    {
      error: "Select at least one student before assigning the task.",
    },
    { status: 400 },
  );
}

/*
 * Do not trust student names sent from the browser.
 * Load the real students from the database.
 */
const availableStudents = (
  await getStudentDirectory()
).filter(
  (student) =>
    student.role === "student" &&
    student.status === "active" &&
    student.verified !== false,
);

const availableStudentMap = new Map(
  availableStudents.map((student) => [
    student.id,
    student,
  ]),
);

const invalidStudentIds = assignedStudentIds.filter(
  (studentId) => !availableStudentMap.has(studentId),
);

if (invalidStudentIds.length > 0) {
  return NextResponse.json(
    {
      error:
        "One or more selected students are unavailable or are not assigned to this faculty member.",
    },
    { status: 403 },
  );
}

const assignedStudentNames = assignedStudentIds
  .map(
    (studentId) =>
      availableStudentMap.get(studentId)?.name,
  )
  .filter(
    (name): name is string =>
      typeof name === "string" &&
      name.trim().length > 0,
  );

  if (!title || !dueDate) {
    return NextResponse.json(
      { error: "Title and due date are required." },
      { status: 400 },
    );
  }

const homework = await createHomework({
  assignedStudentIds,
  assignedStudentNames,

  title,
  description:
    description || undefined,
  objective:
    objective || undefined,
  keySteps,
  deliverables:
    deliverables || undefined,
  evaluationCriteria:
    evaluationCriteria || undefined,
  estimatedHours,
  taskNumber,
  subject:
    subject || undefined,
  hwType:
    hwType as HomeworkItem["hwType"],
  maxMarks,
  dueDate,
  allowLateSubmission,
  attachmentUrl:
    attachmentUrl || undefined,
  createdBy:
    session.id,
  createdByName:
    session.name,
});

  return NextResponse.json({ homework }, { status: 201 });
}
