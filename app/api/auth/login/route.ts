import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import { findUserByCredentials } from "@/lib/data-store";
import {
  sanitizePasswordInput,
  sanitizeTextInput,
} from "@/lib/validation";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginPayload = {
  login?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginPayload;

  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid login payload.",
      },
      {
        status: 400,
      },
    );
  }

  const login = sanitizeTextInput(
    body.login ?? body.email,
    120,
  )
    .trim()
    .toLowerCase();

  const password = sanitizePasswordInput(
    body.password,
  );

  if (!login || !password) {
    return NextResponse.json(
      {
        error:
          "Email or mobile number and password are required.",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Authenticate using credentials only.
   *
   * Student, Parent and Faculty cards on the login page
   * are decorative and do not decide the account role.
   */
  const user = await findUserByCredentials(
    login,
    password,
    undefined as any,
  );

  if (!user) {
    return NextResponse.json(
      {
        error:
          "The email/mobile number or password is incorrect.",
      },
      {
        status: 401,
      },
    );
  }

  if (user.status && user.status !== "active") {
    const isRejected =
      user.status === "rejected";

    const accountLabel =
      user.role === "educator"
        ? "faculty account"
        : "account";

    return NextResponse.json(
      {
        error: isRejected
          ? `Your ${accountLabel} request was rejected by admin.`
          : `Your ${accountLabel} is waiting for admin approval.`,

        pendingApproval: !isRejected,

        redirectTo: isRejected
          ? "/login"
          : "/application-submitted",
      },
      {
        status: isRejected ? 403 : 200,
      },
    );
  }

  /*
   * createSessionResponse uses user.role from MongoDB.
   *
   * Admin credentials create an admin session.
   * Student credentials create a student session.
   * Faculty credentials create an educator session.
   * Parent credentials create a parent session.
   */
  await logAction({
    action: "login",
    category: "auth",
    details: `User ${user.email} (${user.name || user.id}) logged in`,
    path: "/api/auth/login",
    method: "POST",
    request,
    session: user,
  });

  return createSessionResponse(user);
}