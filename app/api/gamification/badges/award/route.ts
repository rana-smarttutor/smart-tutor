import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { awardBadgeToStudent } from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

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
  const badgeId = sanitizeTextInput(body.badgeId as string, 80);
  const reason = sanitizeTextareaInput(body.reason as string, 300);

  if (!studentId || !badgeId) {
    return NextResponse.json(
      { error: "Student ID and Badge ID are required." },
      { status: 400 },
    );
  }

  try {
    const sb = await awardBadgeToStudent({
      studentId,
      badgeId,
      reason: reason || undefined,
      awardedBy: session.id,
    });
    await logAction({
      action: "create",
      category: "other",
      details: `Badge ${badgeId} awarded to student ${studentId}`,
      path: "/api/gamification/badges/award",
      method: "POST",
      request,
      session,
      metadata: { studentId, badgeId, reason },
    });
    return NextResponse.json({ studentBadge: sb }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
