import { NextResponse } from "next/server";

import type { SessionUser, StaffPayoutAuditAction } from "@/lib/types";
import { getStaffPayoutAuditLogs } from "@/lib/data-store";

export const runtime = "nodejs";

type SessionPayload = {
  user?: SessionUser;
  session?: SessionUser;
  data?: { user?: SessionUser };
};

function readSession(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as SessionPayload;
  const candidate = data.user ?? data.session ?? data.data?.user ?? payload;
  if (!candidate || typeof candidate !== "object") return null;
  const user = candidate as Partial<SessionUser>;
  if (
    typeof user.id !== "string" || !user.id ||
    (user.role !== "admin" && user.role !== "educator" && user.role !== "student" && user.role !== "parent")
  ) return null;
  return user as SessionUser;
}

async function getRequestSession(request: Request) {
  const response = await fetch(new URL("/api/auth/session", request.url), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return readSession(payload);
}

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const staffId = url.searchParams.get("staffId") || undefined;
    const action = url.searchParams.get("action") as StaffPayoutAuditAction | null;
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo = url.searchParams.get("dateTo") || undefined;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;

    const logs = await getStaffPayoutAuditLogs({
      staffId,
      action: action || undefined,
      dateFrom,
      dateTo,
      limit,
    });

    return NextResponse.json({ ok: true, logs });
  } catch (error) {
    console.error("Staff payout audit-log GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load audit logs." }, { status: 500 });
  }
}
