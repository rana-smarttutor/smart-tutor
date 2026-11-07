import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isPublicPagePath } from "@/lib/access-routes";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { ADMIN_SESSION_PREFIX } from "@/lib/admin-sessions";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "smart_tutor_dev_fallback_secret_32_chars_long";

/**
 * Redirect legacy catalogue query URLs to their
 * corresponding permanent SEO-friendly pages.
 *
 * Keep this mapping independent of the course library:
 * proxy.ts should not import the client-facing
 * course registry or its dependencies.
 */
const LEGACY_COURSE_KEY_REDIRECTS: Record<string, string> = {
  // School tuition
  "class-6-additional": "/courses/class-6-tuition",
  "class-7-additional": "/courses/class-7-tuition",
  "class-8-additional": "/courses/class-8-tuition",
  "class-9-additional": "/courses/class-9-tuition",
  "class-10-additional": "/courses/class-10-tuition",

  // Class 11 and 12 group keys contain multiple programmes.
  // Use the school hub rather than guessing a stream.
  "class-11-additional": "/courses/school-tuition",
  "class-12-additional": "/courses/school-tuition",

  // Entrance examinations
  "mht-cet-exams": "/courses/mht-cet",
  "mba-exams": "/courses/entrance-exams",
  "llb-exams": "/courses/entrance-exams",
  "gate-postgraduate-technical-exams": "/courses/gate",

  // Government examinations
  "banking-exams": "/courses/banking-exams",
  ssc: "/courses/ssc-coaching",
  "railways-exams": "/courses/railway-exams",
  "police-army-bharti": "/courses/police-bharti",
  "upsc-civil-services": "/courses/upsc-coaching",
  "state-psc-exams": "/courses/mpsc-coaching",
  "defence-paramilitary-exams": "/courses/nda-cds-afcat",
  "teaching-academic-exams": "/courses/government-exams",
  "regulatory-insurance-exams": "/courses/government-exams",

  // Skills
  "skills-communication": "/courses/skill-courses",
  "skills-tech-future": "/courses/skill-courses",
  "skills-career": "/courses/skill-courses",
  "skills-global": "/courses/skill-courses",
  "skills-arts-hobby": "/courses/skill-courses",
  "skills-creative-digital": "/courses/skill-courses",
};

const LEGACY_COURSE_TAB_REDIRECTS: Record<string, string> = {
  "class 6": "/courses/class-6-tuition",
  "class 7": "/courses/class-7-tuition",
  "class 8": "/courses/class-8-tuition",
  "class 9": "/courses/class-9-tuition",
  "class 10": "/courses/class-10-tuition",
  "class 11": "/courses/class-11-tuition",
  "class 12": "/courses/class-12-tuition",
  "class 6-8": "/courses/school-tuition",
  "class 9-10": "/courses/school-tuition",
  "class 11-12": "/courses/school-tuition",
  "govt exams": "/courses/government-exams",
  skills: "/courses/skill-courses",
};

function hasSignedLegacyCookie(value: string | undefined): boolean {
  if (!value) return false;

  const parts = value.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return false;
  }

  const expected = createHmac("sha256", SESSION_SECRET)
    .update(parts[0])
    .digest("base64url");

  const received = Buffer.from(parts[1], "utf8");
  const correct = Buffer.from(expected, "utf8");

  return (
    received.length === correct.length && timingSafeEqual(received, correct)
  );
}

function getLegacyCourseRedirect(request: NextRequest): URL | null {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname !== "/courses") {
    return null;
  }

  // The current enquiry integration uses this parameter.
  // It must always be allowed to reach the catalogue.
  if (searchParams.has("enquire")) {
    return null;
  }

  const legacyKey = searchParams.get("key")?.trim().toLowerCase();

  if (legacyKey) {
    const destination = LEGACY_COURSE_KEY_REDIRECTS[legacyKey];

    if (destination) {
      return new URL(destination, request.url);
    }

    // An unknown key should retain the catalogue.
    // Never guess the destination.
    return null;
  }

  const legacyTab = searchParams.get("tab")?.trim().toLowerCase();

  if (legacyTab) {
    const destination = LEGACY_COURSE_TAB_REDIRECTS[legacyTab];

    if (destination) {
      return new URL(destination, request.url);
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Perform canonical legacy redirects before
  // authentication checks and normal page handling.
  const courseRedirect = getLegacyCourseRedirect(request);

  if (courseRedirect) {
    return NextResponse.redirect(courseRedirect, 301);
  }

  if (!isPublicPagePath(pathname)) {
    const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;

    let signedIn = false;

    if (cookieValue?.startsWith(ADMIN_SESSION_PREFIX)) {
      // Verify database-backed administrator sessions.
      const adminSession = await getSessionUser();

      signedIn = Boolean(
        adminSession &&
        adminSession.role === "admin" &&
        (!adminSession.status || adminSession.status === "active") &&
        !adminSession.deletedAt,
      );
    } else {
      // Preserve compatibility with existing student,
      // educator, staff and parent signed sessions.
      signedIn = hasSignedLegacyCookie(cookieValue);
    }

    if (!signedIn) {
      const url = new URL("/login", request.url);

      url.searchParams.set("next", `${pathname}${search}`);

      url.searchParams.set("reason", "login_required");

      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");

  response.headers.set("X-Frame-Options", "DENY");

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
