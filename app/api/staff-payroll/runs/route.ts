import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit-log";
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

    const dataStore = await import("@/lib/data-store");

    if (session.role === "admin") {
      const { searchParams } = new URL(request.url);
      const monthParam = searchParams.get("month");
      const yearParam = searchParams.get("year");
      const month = monthParam ? Number(monthParam) : undefined;
      const year = yearParam ? Number(yearParam) : undefined;

      const runs = await (dataStore as any).getPayrollRuns(month, year);
      return NextResponse.json({ runs });
    }

    if (session.role === "educator") {
      const runs = await (dataStore as any).getPayrollRunsForFaculty(session.id);
      return NextResponse.json({ runs });
    }

    return NextResponse.json(
      { error: "You do not have access to payroll runs." },
      { status: 403 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payroll runs.",
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
        { error: "Only administrators can create payroll runs." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.month !== "number" || body.month < 1 || body.month > 12) {
      return NextResponse.json(
        { error: "A valid month (1-12) is required." },
        { status: 400 },
      );
    }

    if (typeof body.year !== "number" || body.year < 2020) {
      return NextResponse.json(
        { error: "A valid year is required." },
        { status: 400 },
      );
    }

    if (typeof body.workingDays !== "number" || body.workingDays < 1) {
      return NextResponse.json(
        { error: "workingDays must be a positive number." },
        { status: 400 },
      );
    }

    const dataStore = await import("@/lib/data-store");

    const run = await (dataStore as any).createPayrollRun({
      month: body.month,
      year: body.year,
      workingDays: body.workingDays,
      createdBy: session.id,
    });

    await logAction({
      action: "create",
      category: "payroll",
      details: `Payroll run created for ${body.month}/${body.year}`,
      path: "/api/staff-payroll/runs",
      method: "POST",
      request,
      session,
      metadata: { month: body.month, year: body.year, workingDays: body.workingDays },
    });

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payroll run.",
      },
      { status: 400 },
    );
  }
}
