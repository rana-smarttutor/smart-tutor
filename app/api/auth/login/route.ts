import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import { findUserByCredentials } from "@/lib/data-store";
import type { Role } from "@/lib/types";
import {
  sanitizePasswordInput,
  sanitizeTextInput,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginPayload = {
  login?: string;
  email?: string;
  password?: string;
  role?: string;
};

function normalizeLoginRole(value?: string): Role | null {
  const normalizedRole = value?.trim().toLowerCase();

  if (normalizedRole === "student") {
    return "student";
  }

  if (normalizedRole === "parent") {
    return "parent";
  }

  // The login UI calls it Faculty,
  // but MongoDB stores the role as educator.
  if (
    normalizedRole === "faculty" ||
    normalizedRole === "educator"
  ) {
    return "educator";
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  if (normalizedRole === "counsellor") {
    return "counsellor";
  }

  return null;
}

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
  ).toLowerCase();

  const password = sanitizePasswordInput(
    body.password,
  );

  const selectedRole = normalizeLoginRole(
    body.role,
  );

  if (!login || !password) {
    return NextResponse.json(
      {
        error: "Email or mobile number and password are required.",
      },
      {
        status: 400,
      },
    );
  }

  if (!selectedRole) {
    return NextResponse.json(
      {
        error: "Select Student, Parent, or Faculty before logging in.",
      },
      {
        status: 400,
      },
    );
  }

  const user = await findUserByCredentials(
    login,
    password,
    selectedRole,
  );

  if (!user) {
    const roleLabel =
      selectedRole === "educator"
        ? "Faculty"
        : selectedRole === "parent"
          ? "Parent"
          : selectedRole === "student"
            ? "Student"
            : selectedRole;

    return NextResponse.json(
      {
        error: `These credentials do not belong to a ${roleLabel} account. Select the correct account type and try again.`,
      },
      {
        status: 401,
      },
    );
  }

  if (user.status && user.status !== "active") {
    const isRejected =
      user.status === "rejected";

    const roleLabel =
      user.role === "educator"
        ? "faculty"
        : "account";

    return NextResponse.json(
      {
        error: isRejected
          ? `Your ${roleLabel} request was rejected by admin.`
          : `Your ${roleLabel} is waiting for admin approval.`,

        pendingApproval:
          !isRejected,

        redirectTo:
          isRejected
            ? "/login"
            : "/application-submitted",
      },
      {
        status:
          isRejected
            ? 403
            : 200,
      },
    );
  }

  return createSessionResponse(user);
}