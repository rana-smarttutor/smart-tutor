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
        { error: "Only administrators can view payroll profiles." },
        { status: 403 },
      );
    }

    const dataStore = await import("@/lib/data-store");
    const profiles = await (dataStore as any).getStaffPayrollProfiles();

    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payroll profiles.",
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
        { error: "Only administrators can create payroll profiles." },
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

    if (typeof body.employmentType !== "string" || !body.employmentType) {
      return NextResponse.json(
        { error: "employmentType is required." },
        { status: 400 },
      );
    }

    if (typeof body.salaryType !== "string" || !body.salaryType) {
      return NextResponse.json(
        { error: "salaryType is required." },
        { status: 400 },
      );
    }

    const dataStore = await import("@/lib/data-store");

    const profile = await (dataStore as any).createStaffPayrollProfile({
      userId: body.userId,
      userName: body.userName,
      employeeId: typeof body.employeeId === "string" ? body.employeeId : undefined,
      employmentType: body.employmentType,
      salaryType: body.salaryType,
      monthlySalary: typeof body.monthlySalary === "number" ? body.monthlySalary : 0,
      hourlyRate: typeof body.hourlyRate === "number" ? body.hourlyRate : 0,
      perClassRate: typeof body.perClassRate === "number" ? body.perClassRate : 0,
      bankName: typeof body.bankName === "string" ? body.bankName : undefined,
      accountNumber: typeof body.accountNumber === "string" ? body.accountNumber : undefined,
      ifscCode: typeof body.ifscCode === "string" ? body.ifscCode : undefined,
      panNumber: typeof body.panNumber === "string" ? body.panNumber : undefined,
      pfEnabled: typeof body.pfEnabled === "boolean" ? body.pfEnabled : false,
      tdsEnabled: typeof body.tdsEnabled === "boolean" ? body.tdsEnabled : false,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payroll profile.",
      },
      { status: 400 },
    );
  }
}
