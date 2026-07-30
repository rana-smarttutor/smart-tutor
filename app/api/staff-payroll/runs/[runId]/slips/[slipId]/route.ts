import { NextResponse } from "next/server";
import { logAction } from "@/lib/audit-log";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    runId: string;
    slipId: string;
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

    const { runId, slipId } = await context.params;

    if (!runId || !slipId) {
      return NextResponse.json(
        { error: "Run ID and Slip ID are required." },
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

    const slip = run.slips.find((s: any) => s.id === slipId);

    if (!slip) {
      return NextResponse.json(
        { error: "Payroll slip not found." },
        { status: 404 },
      );
    }

    if (session.role !== "admin" && slip.userId !== session.id) {
      return NextResponse.json(
        { error: "You do not have access to this slip." },
        { status: 403 },
      );
    }

    return NextResponse.json({ slip, run });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payroll slip.",
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
        { error: "Only administrators can update payroll slips." },
        { status: 403 },
      );
    }

    const { runId, slipId } = await context.params;

    if (!runId || !slipId) {
      return NextResponse.json(
        { error: "Run ID and Slip ID are required." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const dataStore = await import("@/lib/data-store");

    const result = await (dataStore as any).updatePayrollSlip(runId, slipId, {
      presentDays: typeof body.presentDays === "number" ? body.presentDays : undefined,
      grossPay: typeof body.grossPay === "number" ? body.grossPay : undefined,
      pfDeduction: typeof body.pfDeduction === "number" ? body.pfDeduction : undefined,
      tdsDeduction: typeof body.tdsDeduction === "number" ? body.tdsDeduction : undefined,
      advanceRecovery: typeof body.advanceRecovery === "number" ? body.advanceRecovery : undefined,
      netPay: typeof body.netPay === "number" ? body.netPay : undefined,
      paidAmount: typeof body.paidAmount === "number" ? body.paidAmount : undefined,
      paidDate: typeof body.paidDate === "string" ? body.paidDate : undefined,
      paymentMode: typeof body.paymentMode === "string" ? body.paymentMode : undefined,
      transactionRef: typeof body.transactionRef === "string" ? body.transactionRef : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Payroll run or slip not found." },
        { status: 404 },
      );
    }

    const updatedSlip = result.slips.find((s: any) => s.id === slipId);

    await logAction({
      action: "update",
      category: "payroll",
      details: `Payroll slip ${slipId} in run ${runId} updated`,
      path: "/api/staff-payroll/runs/[runId]/slips/[slipId]",
      method: "PATCH",
      request,
      session,
      metadata: { runId, slipId },
    });

    return NextResponse.json({ slip: updatedSlip, run: result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update payroll slip.",
      },
      { status: 400 },
    );
  }
}
