import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit-log";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

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

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { runId } = await context.params;

    if (!runId) {
      return NextResponse.json(
        { error: "Run ID is required." },
        { status: 400 },
      );
    }

    const dataStore = await import("@/lib/data-store");
    const run = await (dataStore as any).getPayrollRunById(runId);

    if (!run) {
      return NextResponse.json(
        { error: "Payroll run not found." },
        { status: 404 },
      );
    }

    if (session.role === "educator") {
      const filteredRun = {
        ...run,
        slips: run.slips.filter((s: any) => s.userId === session.id),
      };

      if (filteredRun.slips.length === 0) {
        return NextResponse.json(
          { error: "You do not have access to this payroll run." },
          { status: 403 },
        );
      }

      return NextResponse.json({ run: filteredRun });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have access to this payroll run." },
        { status: 403 },
      );
    }

    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payroll run.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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
        { error: "Only administrators can update payroll run status." },
        { status: 403 },
      );
    }

    const { runId } = await context.params;

    if (!runId) {
      return NextResponse.json(
        { error: "Run ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const validStatuses = ["approved", "finalized", "settled", "rolled_back"];
    if (typeof body.status !== "string" || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const dataStore = await import("@/lib/data-store");

    const run = await (dataStore as any).updatePayrollRunStatus(
      runId,
      body.status,
      session.id,
      typeof body.reason === "string" ? body.reason : undefined,
    );

    if (!run) {
      return NextResponse.json(
        { error: "Payroll run not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "update",
      category: "payroll",
      details: `Payroll run ${runId} status updated to ${body.status}`,
      path: "/api/staff-payroll/runs/[runId]",
      method: "PATCH",
      request,
      session,
      metadata: { runId, status: body.status, reason: body.reason },
    });

    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update payroll run status.",
      },
      { status: 400 },
    );
  }
}
