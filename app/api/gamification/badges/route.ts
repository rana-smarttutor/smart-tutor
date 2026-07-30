import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  createGamificationBadge,
  getAllGamificationBadges,
} from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";
import type { BadgeCriteriaType } from "@/lib/types";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  const badges = await getAllGamificationBadges();
  return NextResponse.json({ badges });
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

  const name = sanitizeTextInput(body.name as string, 80);
  const icon = sanitizeTextInput(body.icon as string, 20) || "🏆";
  const description = sanitizeTextareaInput(body.description as string, 300);
  const criteriaType = (body.criteriaType as BadgeCriteriaType) || "points_threshold";
  const criteriaValue = Math.max(1, Number(body.criteriaValue) || 100);
  const color = sanitizeTextInput(body.color as string, 10) || "#F59E0B";

  if (!name) {
    return NextResponse.json(
      { error: "Badge name is required." },
      { status: 400 },
    );
  }

  const badge = await createGamificationBadge({
    name,
    icon,
    description: description || undefined,
    criteriaType,
    criteriaValue,
    color,
  });

  await logAction({
    action: "create",
    category: "other",
    details: `Gamification badge "${name}" created`,
    path: "/api/gamification/badges",
    method: "POST",
    request,
    session,
    metadata: { badgeId: badge.id, name, criteriaType, criteriaValue },
  });

  return NextResponse.json({ badge }, { status: 201 });
}
