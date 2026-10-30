import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import bcrypt from "bcryptjs";
import {
  ADMIN_ABSOLUTE_MS,
  ADMIN_SESSION_PREFIX,
  createAdminSession,
  validateAdminSession,
  revokeAdminSession,
} from "@/lib/admin-sessions";

import { findUserById } from "@/lib/data-store";
import type { Role, SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "smart_tutor_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "smart_tutor_dev_fallback_secret_32_chars_long";

const BCRYPT_ROUNDS = 10;

export function isBcryptHash(value: string): boolean {
  return /^\$2[abxy]\$\d{2}\$/.test(value);
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function comparePassword(
  candidate: string,
  stored: string,
): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(candidate, stored);
  }
  return candidate === stored;
}

function signId(id: string) {
  return createHmac("sha256", SESSION_SECRET).update(id).digest("base64url");
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  // New, database-backed admin sessions.
  if (sessionCookie.startsWith(ADMIN_SESSION_PREFIX)) {
    const userId = await validateAdminSession(sessionCookie);

    if (!userId) {
      return null;
    }

    const user = await findUserById(userId);

    if (
      !user ||
      user.role !== "admin" ||
      (user.status && user.status !== "active") ||
      user.deletedAt
    ) {
      return null;
    }

    return user;
  }

  // Legacy session support is retained for non-admin users.
  const [id, signature] = sessionCookie.split(".");

  if (!id || !signature || signId(id) !== signature) {
    return null;
  }

  const user = await findUserById(id);

  // Never permit an old-style cookie to authenticate an admin.
  if (!user || user.role === "admin") {
    return null;
  }

  return user;
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

export async function createAdminSessionResponse(user: SessionUser) {
  if (
    user.role !== "admin" ||
    (user.status && user.status !== "active") ||
    user.deletedAt
  ) {
    throw new Error("Invalid administrator session request.");
  }

  const token = await createAdminSession(user.id);

  const response = NextResponse.json({ user });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_ABSOLUTE_MS / 1000,
  });

  response.headers.set("Cache-Control", "no-store");

  return response;
}

export async function revokeCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token?.startsWith(ADMIN_SESSION_PREFIX)) {
    await revokeAdminSession(token);
  }
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
