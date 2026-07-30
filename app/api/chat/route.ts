import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  createChatFlag,
  createChatMessage,
  getChatFlags,
  getMessagesForRole,
  getUsersForAdmin,
} from "@/lib/data-store";
import { validateChatContent } from "@/lib/chat-validation";
import { sanitizeTextareaInput } from "@/lib/validation";
import type { ManagedUser } from "@/lib/types";

const CHAT_WARNING_LIMIT = 2;
const CHAT_BLOCK_ATTEMPT = 3;

async function getPolicyViolationCount(userId: string) {
  const flags = await getChatFlags();

  return flags.filter(
    (flag) =>
      flag.senderId === userId &&
      typeof flag.messageId === "string" &&
      flag.messageId.startsWith("blocked-"),
  ).length;
}
function getStudentClassNumber(
  student: ManagedUser,
): string {
  const courseKey =
    student.profile?.courseWanted
      ?.trim()
      .toLowerCase() ?? "";

  const keyMatch = courseKey.match(
    /class[-\s]*(6|7|8|9|10|11|12)(?:-|$)/,
  );

  if (keyMatch?.[1]) {
    return keyMatch[1];
  }

  const courseTitle =
    student.profile?.courseWantedTitle
      ?.trim()
      .toLowerCase() ?? "";

  const titleMatch = courseTitle.match(
    /\bclass[\s-]*(6|7|8|9|10|11|12)(?:st|nd|rd|th)?\b/,
  );

  return titleMatch?.[1] ?? "";
}
export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required." },
      { status: 401 },
    );
  }

  const messages = await getMessagesForRole(
    session.role,
    session.id,
  );

  const chatMessages = messages.filter(
    (message) => message.channel === "Chat",
  );

let contacts: Array<{
  id: string;
  name: string;
  role: "admin" | "educator" | "student";
  status?: string;
  verified?: boolean;
}> = [];

if (session.role === "student") {
  const users = await getUsersForAdmin();

  const currentStudent = users.find(
    (user) =>
      user.id === session.id &&
      user.role === "student",
  );

  const currentStudentClass = currentStudent
    ? getStudentClassNumber(currentStudent)
    : "";

  contacts = users
    .filter((user) => {
      if (
        user.status !== "active" ||
        user.verified === false
      ) {
        return false;
      }

      if (
        user.role === "admin" ||
        user.role === "educator"
      ) {
        return true;
      }

      if (
        user.role === "student" &&
        user.id !== session.id &&
        currentStudentClass
      ) {
        return (
          getStudentClassNumber(user) ===
          currentStudentClass
        );
      }

      return false;
    })
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role as
        | "admin"
        | "educator"
        | "student",
      status: user.status,
      verified: user.verified,
    }))
    .sort((left, right) => {
      const roleOrder = {
        admin: 0,
        educator: 1,
        student: 2,
      };

      const roleDifference =
        roleOrder[left.role] -
        roleOrder[right.role];

      if (roleDifference !== 0) {
        return roleDifference;
      }

      return left.name.localeCompare(right.name);
    });
}
  let violationCount = 0;

  try {
    violationCount = await getPolicyViolationCount(
      session.id,
    );
  } catch (error) {
    console.error(
      "Unable to load chat-policy status:",
      error,
    );
  }

  return NextResponse.json({
    messages: chatMessages,
    contacts,
    chatPolicy: {
      blocked: violationCount >= CHAT_BLOCK_ATTEMPT,
      warningCount: Math.min(
        violationCount,
        CHAT_WARNING_LIMIT,
      ),
      warningLimit: CHAT_WARNING_LIMIT,
    },
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      {
        error:
          "Login is required to send messages.",
      },
      { status: 401 },
    );
  }

  /*
   * Check whether this account has already been
   * permanently blocked from chat.
   */
  let existingViolationCount: number;

  try {
    existingViolationCount =
      await getPolicyViolationCount(session.id);
  } catch (error) {
    console.error(
      "Unable to check chat-policy status:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify your chat-policy status. Please try again.",
      },
      { status: 503 },
    );
  }

  if (
    existingViolationCount >= CHAT_BLOCK_ATTEMPT
  ) {
    return NextResponse.json(
      {
        error:
          "Your chat access has been permanently blocked after repeated attempts to share restricted information.",
        blocked: true,
        blockReason:
          "Chat access was blocked after two warnings and another policy violation.",
        violationCount:
          existingViolationCount,
        warningCount: CHAT_WARNING_LIMIT,
        warningLimit: CHAT_WARNING_LIMIT,
        warningsRemaining: 0,
      },
      { status: 403 },
    );
  }

  let body: {
    receiverId?: string;
    receiverRole?: string;
    body?: string;
  };

  try {
    body = (await request.json()) as {
      receiverId?: string;
      receiverRole?: string;
      body?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 },
    );
  }

  if (
    !body.receiverId ||
    !body.receiverRole ||
    !body.body?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Receiver, role, and message body are required.",
      },
      { status: 400 },
    );
  }

  const content = sanitizeTextareaInput(
    body.body,
    500,
  );

  if (!content) {
    return NextResponse.json(
      { error: "Message body is required." },
      { status: 400 },
    );
  }

  const validRoles = [
    "student",
    "educator",
    "admin",
  ];

  if (!validRoles.includes(body.receiverRole)) {
    return NextResponse.json(
      { error: "Invalid receiver role." },
      { status: 400 },
    );
  }
if (
  session.role === "student" &&
  body.receiverRole === "student"
) {
  if (body.receiverId === session.id) {
    return NextResponse.json(
      {
        error:
          "You cannot send a chat message to yourself.",
      },
      { status: 400 },
    );
  }

  const users = await getUsersForAdmin();

  const senderStudent = users.find(
    (user) =>
      user.id === session.id &&
      user.role === "student",
  );

  const receiverStudent = users.find(
    (user) =>
      user.id === body.receiverId &&
      user.role === "student",
  );

  if (!senderStudent || !receiverStudent) {
    return NextResponse.json(
      {
        error:
          "Student account could not be verified.",
      },
      { status: 403 },
    );
  }

  if (
    receiverStudent.status !== "active" ||
    receiverStudent.verified === false
  ) {
    return NextResponse.json(
      {
        error:
          "This student is not currently available for chat.",
      },
      { status: 403 },
    );
  }

  const senderClass =
    getStudentClassNumber(senderStudent);

  const receiverClass =
    getStudentClassNumber(receiverStudent);

  if (
    !senderClass ||
    !receiverClass ||
    senderClass !== receiverClass
  ) {
    return NextResponse.json(
      {
        error:
          "Students can only chat with other students from the same class.",
      },
      { status: 403 },
    );
  }
}
  /*
   * Validate before creating the message.
   * Restricted messages never reach createChatMessage().
   */
  const validation =
    validateChatContent(content);

if (validation.hasSensitiveContent) {
  try {
    await createChatFlag({
      messageId: `blocked-${session.id}-${Date.now()}`,
      senderId: session.id,
      receiverId: body.receiverId,
      flaggedBy: session.id,
      reason: validation.reasons[0]?.type ?? "other",
      reasonDetail: validation.reasons
        .map((reason) => `${reason.type}: ${reason.detail}`)
        .join("; "),
    });
  } catch (error) {
    console.error("Unable to save chat-policy violation:", error);

    return NextResponse.json(
      {
        error:
          "The restricted message was blocked, but the warning could not be recorded. Please try again.",
      },
      { status: 503 },
    );
  }

  /*
   * The current attempt has now been stored as a flag.
   * Read the count again so the response uses the saved total.
   */
  let violationCount = existingViolationCount + 1;

  try {
    violationCount = await getPolicyViolationCount(session.id);
  } catch (error) {
    console.error(
      "Unable to reload chat-policy violation count:",
      error,
    );
  }

  const blocked = violationCount >= CHAT_BLOCK_ATTEMPT;

  if (blocked) {
    return NextResponse.json(
      {
        error:
          "Your chat access has been blocked after repeated attempts to share restricted information.",
        reasons: validation.reasons.map(
          (reason) => reason.detail,
        ),
        blocked: true,
        blockReason:
          "Chat access was blocked after two warnings and a third policy violation.",
        violationCount,
        warningCount: CHAT_WARNING_LIMIT,
        warningLimit: CHAT_WARNING_LIMIT,
        warningsRemaining: 0,
      },
      { status: 403 },
    );
  }

  const warningCount = Math.min(
    violationCount,
    CHAT_WARNING_LIMIT,
  );

  const warningsRemaining = Math.max(
    0,
    CHAT_WARNING_LIMIT - warningCount,
  );

  return NextResponse.json(
    {
      error:
        warningCount === 1
          ? "Restricted information detected. This is warning 1 of 2."
          : "Restricted information detected. This is warning 2 of 2. Another attempt will block your chat access.",
      reasons: validation.reasons.map(
        (reason) => reason.detail,
      ),
      blocked: false,
      violationCount,
      warningCount,
      warningLimit: CHAT_WARNING_LIMIT,
      warningsRemaining,
    },
    { status: 400 },
  );
}

/*
 * Only valid messages reach this point.
 */
const message = await createChatMessage({
  senderId: session.id,
  senderName: session.name ?? "Unknown",
  senderRole: session.role,
  receiverId: body.receiverId,
  receiverRole: body.receiverRole as
    | "student"
    | "educator"
    | "admin",
  body: content,
});

await logAction({
  action: "create",
  category: "communication",
  details: `Sent chat message to ${body.receiverRole} (${body.receiverId})`,
  path: "/api/chat",
  method: "POST",
  request,
  session,
  metadata: { messageId: message.id, receiverId: body.receiverId, receiverRole: body.receiverRole },
});

return NextResponse.json(
  {
    message,
    blocked: false,
  },
  { status: 201 },
);
}