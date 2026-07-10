import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllChatMessagesForAdmin,
  getChatFlags,
  getAllBlockedChats,
} from "@/lib/data-store";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const [messages, flags, blocks] = await Promise.all([
    getAllChatMessagesForAdmin(),
    getChatFlags(),
    getAllBlockedChats(),
  ]);

  return NextResponse.json({ messages, flags, blocks });
}
