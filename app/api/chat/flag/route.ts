import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import { createChatFlag, resolveChatFlag, getChatFlags } from "@/lib/data-store";
import { validateChatContent } from "@/lib/chat-validation";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const flags = await getChatFlags();
  return NextResponse.json({ flags });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let body: {
    messageId?: string;
    senderId?: string;
    receiverId?: string;
    reason?: string;
    reasonDetail?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.messageId || !body.reason || !body.reasonDetail) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const flag = await createChatFlag({
    messageId: body.messageId,
    senderId: body.senderId || session.id,
    receiverId: body.receiverId || "",
    flaggedBy: session.id,
    reason: body.reason as "phone" | "email" | "link" | "other",
    reasonDetail: body.reasonDetail,
  });

  await logAction({
    action: "create",
    category: "communication",
    details: `Created chat flag for sender ${flag.senderId}: ${flag.reason}`,
    path: "/api/chat/flag",
    method: "POST",
    request,
    session,
    metadata: { flagId: flag.id, senderId: flag.senderId, reason: flag.reason },
  });

  return NextResponse.json({ flag }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: {
    flagId?: string;
    status?: "allowed" | "blocked";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.flagId || !body.status) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const result = await resolveChatFlag(body.flagId, {
    status: body.status,
    resolvedBy: session.id,
  });

  if (!result) {
    return NextResponse.json({ error: "Flag not found." }, { status: 404 });
  }

  await logAction({
    action: "update",
    category: "communication",
    details: `Resolved chat flag ${body.flagId} as ${body.status}`,
    path: "/api/chat/flag",
    method: "PATCH",
    request,
    session,
    metadata: { flagId: body.flagId, status: body.status },
  });

  return NextResponse.json({ flag: result });
}
