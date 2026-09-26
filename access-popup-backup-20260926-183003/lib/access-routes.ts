const PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/application-submitted",
  "/waiting-approval",

  // Public browsing - protected actions still require login.
  "/courses",
  "/mock-test",
  "/quiz-arena",
  "/library",
];

const ASSET = /\.(?:png|svg|ico|webp|jpe?g|gif|avif|apk|css|js|json|xml|txt|pdf|woff2?|ttf|otf|map)$/i;

export function isPublicPagePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (PUBLIC.some((item) => item === path || (item !== "/" && path.startsWith(`${item}/`)))) {
    return true;
  }
  return (
    path === "/api" || path.startsWith("/api/") ||
    path === "/_next" || path.startsWith("/_next/") ||
    path === "/favicon.ico" || path === "/robots.txt" ||
    path === "/sitemap.xml" || path === "/site.webmanifest" ||
    ASSET.test(path)
  );
}

export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") ||
      value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return null;
  }
  try {
    const url = new URL(value, "https://smartiqinstitute.in");
    if (url.origin !== "https://smartiqinstitute.in" ||
        url.pathname === "/login" || url.pathname === "/signup") {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function requiresStudentRole(pathname: string): boolean {
  return pathname === "/quiz-arena" || pathname.startsWith("/quiz-arena/");
}