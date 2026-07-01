import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "smart_tutor_session";
const CRAWLER_PATTERN = /bot|crawler|spider|scraper|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|twitterbot|applebot|anthropic|bytespider|perplexity/i;

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/courses",
  "/library",
  "/placements",
  "/contact",
  "/mock-test",
  "/quiz-arena",
  "/student-performance",
  "/application-submitted",
  "/waiting-approval",
  "/_next",
  "/api",
  "/favicon",
];

const ROUTE_PREFIXES = PUBLIC_ROUTES.map((r) => r + "/");

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStaticAsset(pathname: string): boolean {
  return /\.(png|svg|ico|webp|jpg|jpeg|gif|apk|css|js|json|xml|txt)$/.test(pathname);
}

function isCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERN.test(userAgent);
}

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";

  const isPublic = isPublicPath(pathname) || isStaticAsset(pathname);

  // Crawlers always pass through (SEO)
  if (!sessionCookie && !isPublic && !isCrawler(userAgent)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged-in users skip login/signup
  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
