import { NextResponse } from "next/server";

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
    role: "admin" | "educator";
    status?: string;
    verified?: boolean;
  }> = [];

  if (session.role === "student") {
    const users = await getUsersForAdmin();

    contacts = users
      .filter(
        (user) =>
          (user.role === "admin" ||
            user.role === "educator") &&
          user.status === "active" &&
          user.verified !== false,
      )
      .map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role as "admin" | "educator",
        status: user.status,
        verified: user.verified,
      }))
      .sort((left, right) => {
        if (
          left.role === "admin" &&
          right.role !== "admin"
        ) {
          return -1;
        }

        if (
          right.role === "admin" &&
          left.role !== "admin"
        ) {
          return 1;
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

return NextResponse.json(
  {
    message,
    blocked: false,
  },
  { status: 201 },
);
}