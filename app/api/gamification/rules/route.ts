import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  createGamificationAutoAwardRule,
  getAllGamificationAutoAwardRules,
} from "@/lib/data-store";
import { sanitizeTextInput } from "@/lib/validation";
import type { AutoAwardTrigger } from "@/lib/types";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  const rules = await getAllGamificationAutoAwardRules();
  return NextResponse.json({ rules });
}

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

  const name = sanitizeTextInput(body.name as string, 120);
  const trigger = body.trigger as AutoAwardTrigger;
  const points = Math.max(1, Math.min(500, Number(body.points) || 10));
  const badgeId = sanitizeTextInput(body.badgeId as string, 80);

  if (!name || !trigger) {
    return NextResponse.json(
      { error: "Name and trigger are required." },
      { status: 400 },
    );
  }

  const rule = await createGamificationAutoAwardRule({
    name,
    trigger,
    points,
    badgeId: badgeId || undefined,
  });

  await logAction({
    action: "create",
    category: "other",
    details: `Auto-award rule "${name}" created (trigger: ${trigger})`,
    path: "/api/gamification/rules",
    method: "POST",
    request,
    session,
    metadata: { ruleId: rule.id, name, trigger, points, badgeId },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
