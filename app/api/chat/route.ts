import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createChatMessage,
  createChatFlag,
  getMessagesForRole,
  getUsersForAdmin,
} from "@/lib/data-store";
import { sanitizeTextareaInput } from "@/lib/validation";
import { validateChatContent } from "@/lib/chat-validation";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Login is required." }, { status: 401 });
  }

  const messages = await getMessagesForRole(session.role, session.id);

  const chatMessages = messages.filter((message) => message.channel === "Chat");

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
          (user.role === "admin" || user.role === "educator") &&
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
        if (left.role === "admin" && right.role !== "admin") return -1;
        if (right.role === "admin" && left.role !== "admin") return 1;

        return left.name.localeCompare(right.name);
      });
  }

  return NextResponse.json({
    messages: chatMessages,
    contacts,
  });
}
export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required to send messages." },
      { status: 401 },
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
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.receiverId || !body.receiverRole || !body.body?.trim()) {
    return NextResponse.json(
      { error: "Receiver, role, and message body are required." },
      { status: 400 },
    );
  }

  const content = sanitizeTextareaInput(body.body, 500);

  if (!content) {
    return NextResponse.json(
      { error: "Message body is required." },
      { status: 400 },
    );
  }

  const validRoles = ["student", "educator", "admin"];
  if (!validRoles.includes(body.receiverRole)) {
    return NextResponse.json(
      { error: "Invalid receiver role." },
      { status: 400 },
    );
  }

  // Server-side content validation — reject BEFORE creating message
  const validation = validateChatContent(content);
  if (validation.hasSensitiveContent) {
    // Still create a flag for audit trail
    try {
      await createChatFlag({
        messageId: `blocked-${Date.now()}`,
        senderId: session.id,
        receiverId: body.receiverId,
        flaggedBy: session.id,
        reason: validation.reasons[0]?.type ?? "other",
        reasonDetail: validation.reasons
          .map((r) => `${r.type}: ${r.detail}`)
          .join("; "),
      });
    } catch {
      /* flag is optional */
    }
    return NextResponse.json(
      {
        error: "Message blocked: sensitive content detected.",
        reasons: validation.reasons.map((r) => `${r.type}: ${r.detail}`),
      },
      { status: 400 },
    );
  }

  const message = await createChatMessage({
    senderId: session.id,
    senderName: session.name ?? "Unknown",
    senderRole: session.role,
    receiverId: body.receiverId,
    receiverRole: body.receiverRole as "student" | "educator" | "admin",
    body: content,
  });

  return NextResponse.json({ message }, { status: 201 });
}
