import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import { findUserByCredentials } from "@/lib/data-store";
import { sanitizePasswordInput, sanitizeTextInput } from "@/lib/validation";
import { Role } from "@/lib/types";

export async function POST(request: Request) {
  let body: {
    login?: string;
    email?: string;
    password?: string;
    role?: Role;
  };

  try {
    body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: Role;
    };
  } catch {
    return NextResponse.json({ error: "Invalid login payload." }, { status: 400 });
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

  return createSessionResponse(user);
}
