import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import { blockChat, unblockChat, getAllBlockedChats, isChatBlocked } from "@/lib/data-store";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const blocks = await getAllBlockedChats();
  return NextResponse.json({ blocks });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let body: {
    participantIds?: string[];
    action?: "block" | "unblock" | "check";
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.participantIds?.length || !body.action) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (body.action === "check") {
    const block = await isChatBlocked(body.participantIds);
    return NextResponse.json({ blocked: !!block, reason: block?.reason });
  }

  // Admin-only actions below
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  if (body.action === "block") {
    const result = await blockChat({
      participantIds: body.participantIds,
      blockedBy: session.id,
      reason: body.reason,
    });

    await logAction({
      action: "create",
      category: "communication",
      details: `Blocked chat between participants: ${body.participantIds.join(", ")}`,
      path: "/api/chat/block",
      method: "POST",
      request,
      session,
      metadata: { participantIds: body.participantIds, reason: body.reason },
    });

    return NextResponse.json({ block: result });
  } else {
    await unblockChat(body.participantIds);

    await logAction({
      action: "delete",
      category: "communication",
      details: `Unblocked chat between participants: ${body.participantIds.join(", ")}`,
      path: "/api/chat/block",
      method: "POST",
      request,
      session,
      metadata: { participantIds: body.participantIds },
    });

    return NextResponse.json({ unblocked: true });
  }
}
