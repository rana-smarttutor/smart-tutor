import { NextResponse } from "next/server";

import * as dataStore from "@/lib/data-store";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    payoutId: string;
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

function getOptionalNumber(
  body: Record<string, unknown>,
  key:
    | "basePay"
    | "perClassRate"
    | "completedClasses"
    | "bonus"
    | "deductions"
    | "paidAmount",
) {
  if (body[key] === undefined) {
    return undefined;
  }

  const value = Number(body[key]);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a valid non-negative number.`);
  }

  return value;
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
        { error: "Only administrators can update teacher payouts." },
        { status: 403 },
      );
    }

    const { payoutId } = await context.params;

    if (!payoutId) {
      return NextResponse.json(
        { error: "Payout ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const payout = await (dataStore as any).updateTeacherPayout(payoutId, {
      month: typeof body.month === "string" ? body.month : undefined,
      basePay: getOptionalNumber(body, "basePay"),
      perClassRate: getOptionalNumber(body, "perClassRate"),
      completedClasses: getOptionalNumber(body, "completedClasses"),
      bonus: getOptionalNumber(body, "bonus"),
      deductions: getOptionalNumber(body, "deductions"),
      paidAmount: getOptionalNumber(body, "paidAmount"),
      payoutDate:
        typeof body.payoutDate === "string" ? body.payoutDate : undefined,
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Teacher payout record was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ payout });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update teacher payout.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
        { error: "Only administrators can delete teacher payouts." },
        { status: 403 },
      );
    }

    const { payoutId } = await context.params;

    if (!payoutId) {
      return NextResponse.json(
        { error: "Payout ID is required." },
        { status: 400 },
      );
    }

    await dataStore.deleteTeacherPayout(payoutId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete teacher payout.",
      },
      { status: 500 },
    );
  }
}