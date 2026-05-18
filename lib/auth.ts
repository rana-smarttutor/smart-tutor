import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

import { findUserById } from "@/lib/data-store";
import type { Role, SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "smart_tutor_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "smart_tutor_dev_fallback_secret_32_chars_long";

function signId(id: string) {
  return createHmac("sha256", SESSION_SECRET).update(id).digest("base64url");
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  const [id, signature] = sessionCookie.split(".");

  if (!id || !signature || signId(id) !== signature) {
    return null;
  }

  return findUserById(id);
}

export function createSessionResponse(user: SessionUser) {
  const response = NextResponse.json({ user });
  const signedValue = `${user.id}.${signId(user.id)}`;

  response.cookies.set({
    name: SESSION_COOKIE,
    value: signedValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export function clearSessionResponse() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function hasAnyRole(
  session: SessionUser | null,
  roles: Role[],
): session is SessionUser {
  return Boolean(session && roles.includes(session.role));
}
