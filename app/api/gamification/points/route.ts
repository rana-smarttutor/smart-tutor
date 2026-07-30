import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { awardGamificationPoints } from "@/lib/data-store";
import { sanitizeTextInput } from "@/lib/validation";
import type { GamificationActivity } from "@/lib/types";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "educator"])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const studentId = sanitizeTextInput(body.studentId as string, 80);
  const points = Math.max(1, Math.min(1000, Number(body.points) || 10));
  const activity = (body.activity as GamificationActivity) || "manual";
  const description = sanitizeTextInput(body.description as string, 500);

  if (!studentId) {
    return NextResponse.json(
      { error: "Student ID is required." },
      { status: 400 },
    );
  }

  const entry = await awardGamificationPoints({
    studentId,
    points,
    activity,
    description: description || undefined,
    awardedBy: session.id,
    awardedByName: session.name,
  });

  await logAction({
    action: "create",
    category: "other",
    details: `${points} gamification points awarded to student ${studentId}`,
    path: "/api/gamification/points",
    method: "POST",
    request,
    session,
    metadata: { studentId, points, activity, description },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
