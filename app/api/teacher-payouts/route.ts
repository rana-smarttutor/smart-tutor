import { NextResponse } from "next/server";

// Import data-store dynamically inside handlers to avoid static import errors
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";

type SessionPayload = {
  user?: SessionUser;
  session?: SessionUser;
  data?: {
    user?: SessionUser;
  };
};

function readSession(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as SessionPayload;
  const candidate = data.user ?? data.session ?? data.data?.user ?? payload;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const user = candidate as Partial<SessionUser>;

  if (
    typeof user.id !== "string" ||
    !user.id ||
    (user.role !== "admin" &&
      user.role !== "educator" &&
      user.role !== "student" &&
      user.role !== "parent")
  ) {
    return null;
  }

  return user as SessionUser;
}

async function getRequestSession(request: Request) {
  const response = await fetch(new URL("/api/auth/session", request.url), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  return readSession(payload);
}

function canViewPayouts(role: SessionUser["role"]) {
  return role === "admin" || role === "educator";
}

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (!canViewPayouts(session.role)) {
      return NextResponse.json(
        { error: "You do not have access to teacher payouts." },
        { status: 403 },
      );
    }

    const dataStore = await import("@/lib/data-store");

    // The data-store module may not implement getTeacherPayoutsForRole in all environments.
    const getTeacherPayoutsForRole = (dataStore as any).getTeacherPayoutsForRole;

    if (typeof getTeacherPayoutsForRole !== "function") {
      return NextResponse.json(
        { error: "getTeacherPayoutsForRole not implemented in data-store." },
        { status: 501 },
      );
    }

    const payouts = await getTeacherPayoutsForRole(session.role, session.id);

    return NextResponse.json({ payouts });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load teacher payouts.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    // The data-store module does not export createTeacherPayout.
    // Return 501 Not Implemented to indicate the endpoint is unavailable.
    return NextResponse.json(
      { error: "createTeacherPayout not implemented in data-store." },
      { status: 501 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create teacher payout.",
      },
      { status: 400 },
    );
  }
}