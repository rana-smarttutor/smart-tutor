import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can view salary advances." },
        { status: 403 },
      );
    }

    const dataStore = await import("@/lib/data-store");
    const advances = await (dataStore as any).getSalaryAdvances();

    return NextResponse.json({ advances });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load salary advances.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can create salary advances." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.userId !== "string" || !body.userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 },
      );
    }

    if (typeof body.userName !== "string" || !body.userName) {
      return NextResponse.json(
        { error: "userName is required." },
        { status: 400 },
      );
    }

    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json(
        { error: "A valid positive amount is required." },
        { status: 400 },
      );
    }

    if (typeof body.reason !== "string" || !body.reason) {
      return NextResponse.json(
        { error: "reason is required." },
        { status: 400 },
      );
    }

    const dataStore = await import("@/lib/data-store");

    const advance = await (dataStore as any).createSalaryAdvance({
      userId: body.userId,
      userName: body.userName,
      amount: body.amount,
      reason: body.reason,
      createdBy: session.id,
    });

    return NextResponse.json({ advance }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create salary advance.",
      },
      { status: 400 },
    );
  }
}
