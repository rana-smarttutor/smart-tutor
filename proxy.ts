import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicPagePath } from "@/lib/access-routes";

const COOKIE = "smart_tutor_session";
const SECRET = process.env.SESSION_SECRET || "smart_tutor_dev_fallback_secret_32_chars_long";

function hasSignedCookie(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const expected = createHmac("sha256", SECRET).update(parts[0]).digest("base64url");
  const received = Buffer.from(parts[1], "utf8");
  const correct = Buffer.from(expected, "utf8");
  return received.length === correct.length && timingSafeEqual(received, correct);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = hasSignedCookie(request.cookies.get(COOKIE)?.value);

  if (!signedIn && !isPublicPagePath(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    url.searchParams.set("reason", "login_required");
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};