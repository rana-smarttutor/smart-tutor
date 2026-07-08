import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { createMessage, getMessagesForRole, getStudentDirectory, findFullUserById } from "@/lib/data-store";
import { sanitizeIdList, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to read message boards." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    messages: await getMessagesForRole(session.role, session.id),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to post messages." },
      { status: 401 },
    );
  }

  if (!hasAnyRole(session, ["student", "educator", "admin"])) {
    return NextResponse.json(
      { error: "Only educators and admins can post institute messages." },
      { status: 403 },
    );
  }

  // Check if chat is disabled for this user
  const senderRecord = await findFullUserById(session.id);
  if (senderRecord?.profile?.chatDisabled) {
    return NextResponse.json(
      { error: "Your chat access has been disabled by the institute." },
      { status: 403 },
    );
  }

  let body: {
    title?: string;
    body?: string;
    channel?: string;
    audience?: ("student" | "educator" | "admin")[];
    userIds?: string[];
    targetMode?: "everyone" | "selected-students";
    expiresAt?: string | null;
  };

  try {
    body = (await request.json()) as {
      title?: string;
      body?: string;
      channel?: string;
      audience?: ("student" | "educator" | "admin")[];
      userIds?: string[];
      targetMode?: "everyone" | "selected-students";
      expiresAt?: string | null;
    };
  } catch {
    return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
  }

  const title = sanitizeTextInput(body.title, 80);
  const content = sanitizeTextareaInput(body.body, 280);
  const channel = sanitizeTextInput(body.channel, 40);
  const userIds = sanitizeIdList(body.userIds, 50);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  if (!title || !content || !channel) {
    return NextResponse.json(
      { error: "Title, message body, and channel are required." },
      { status: 400 },
    );
  }

  // ---- Role-based audience restrictions ----
  let audience = body.audience ?? [];

  if (session.role === "student") {
    // Students may only send to "educator" (their assigned faculty) or "admin"
    const canSendToEducator =
      audience.length === 1 &&
      audience[0] === "educator" &&
      userIds.length > 0;
    const canSendToAdmin =
      audience.length === 1 &&
      audience[0] === "admin" &&
      userIds.length > 0;

    if (!canSendToEducator && !canSendToAdmin) {
      return NextResponse.json(
        { error: "Students can only send messages to their assigned faculty or to admin." },
        { status: 403 },
      );
    }

    // Verify student is only targeting their own assigned faculty
    if (canSendToEducator) {
      const studentRecord = await findFullUserById(session.id);
      const assignedIds = studentRecord?.assignedFacultyIds ?? [];
      const hasUnauthorized = userIds.some((uid) => !assignedIds.includes(uid));
      if (hasUnauthorized) {
        return NextResponse.json(
          { error: "You may only send messages to your assigned faculty members." },
          { status: 403 },
        );
      }
    }
  }

  if (session.role === "educator") {
    // Educators may send to "admin" or to "student" (their assigned students)
    const canSendToAdmin =
      audience.length === 1 &&
      audience[0] === "admin" &&
      userIds.length > 0;

    const canSendToStudent =
      audience.length === 1 &&
      audience[0] === "student";

    if (!canSendToAdmin && !canSendToStudent) {
      return NextResponse.json(
        { error: "Educators can only send messages to admin or to their assigned students." },
        { status: 403 },
      );
    }

    // When sending to students without specific userIds, resolve to assigned students
    if (canSendToStudent && !userIds.length) {
      const assignedStudents = await getStudentDirectory(session.id);
      // body.userIds stays empty; we store resolved userIds
      // but keep original audience so the message is scoped properly
    }
  }

  if (session.role !== "admin" && audience.includes("student") && audience.includes("educator") && audience.includes("admin")) {
    return NextResponse.json(
      { error: "Only admins can send messages to all roles." },
      { status: 403 },
    );
  }
  // ---- End role-based restrictions ----

  // Sender must always be able to see their own messages
  if (!audience.includes(session.role as "student" | "educator" | "admin")) {
    audience.push(session.role as "student" | "educator" | "admin");
  }

  if (userIds.length === 0 && body.targetMode === "selected-students") {
    return NextResponse.json(
      { error: "Select at least one registered student for a targeted message." },
      { status: 400 },
    );
  }

  let resolvedUserIds = userIds;
  if (session.role === "educator" && audience.includes("student") && !userIds.length) {
    const assignedStudents = await getStudentDirectory(session.id);
    resolvedUserIds = assignedStudents.map((s) => s.id);
  }

  // Sender must always see their own messages
  if (!resolvedUserIds.includes(session.id)) {
    resolvedUserIds.push(session.id);
  }

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Choose a valid expiry time." }, { status: 400 });
  }

  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Expiry time must be in the future." }, { status: 400 });
  }

  const message = await createMessage({
    title,
    body: content,
    channel,
    author: session.name,
    audience,
    userIds: resolvedUserIds,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  });

  return NextResponse.json({ message }, { status: 201 });
}
