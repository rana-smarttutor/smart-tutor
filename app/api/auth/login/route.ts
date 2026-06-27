import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import { findUserByCredentials } from "@/lib/data-store";
import type { Role } from "@/lib/types";
import { sanitizePasswordInput, sanitizeTextInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    login?: string;
    email?: string;
    password?: string;
    role?: Role;
  };

  try {
    body = (await request.json()) as {
      login?: string;
      email?: string;
      password?: string;
      role?: Role;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid login payload." },
      { status: 400 },
    );
  }

  const login = sanitizeTextInput(body.login ?? body.email, 120).toLowerCase();
  const password = sanitizePasswordInput(body.password);

  if (!login || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const user = await findUserByCredentials(login, password);

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  if (user.status && user.status !== "active") {
    const isRejected = user.status === "rejected";
    const roleLabel = user.role === "educator" ? "faculty" : "account";

    return NextResponse.json(
      {
        error: isRejected
          ? `Your ${roleLabel} request was rejected by admin.`
          : `Your ${roleLabel} is waiting for admin approval.`,
        pendingApproval: !isRejected,
        redirectTo: isRejected ? "/login" : "/application-submitted",
      },
      { status: isRejected ? 403 : 200 },
    );
  }

  return createSessionResponse(user);
}