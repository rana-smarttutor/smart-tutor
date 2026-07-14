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

    if (session.role === "admin") {
      return NextResponse.json(
        {
          error:
            "Administrators should use the main payroll runs endpoint.",
          redirect: "/api/staff-payroll/runs",
        },
        { status: 303 },
      );
    }

    if (session.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can access faculty payroll views." },
        { status: 403 },
      );
    }

    const dataStore = await import("@/lib/data-store");
    const runs = await (dataStore as any).getPayrollRunsForFaculty(session.id);

    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load faculty payroll data.",
      },
      { status: 500 },
    );
  }
}
