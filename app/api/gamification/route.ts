import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  getGamificationLeaderboard,
  getGamificationStats,
} from "@/lib/data-store";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (type === "stats") {
    const stats = await getGamificationStats();
    return NextResponse.json({ stats });
  }

  const batchId = url.searchParams.get("batchId") || undefined;
  const leaderboard = await getGamificationLeaderboard(batchId);
  return NextResponse.json({ leaderboard });
}
