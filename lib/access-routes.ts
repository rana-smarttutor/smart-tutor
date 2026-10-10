
const PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/admission",
  "/application-submitted",
  "/waiting-approval",

  // Public website pages
  "/courses",
  "/mock-test",
  "/quiz-arena",
  "/library",
  "/digital-library",
  "/exam-updates",
  "/contact",
  "/placements",

  // Career counselling
  // Covers public child pages such as /about-you
  "/career-counselling",

  // Local tutor landing pages
  "/home-tutor-panvel",
  "/home-tutor-vashi",
  "/home-tutor-navi-mumbai",

  // Legal pages
  "/privacy",
  "/terms",
  "/eula",

  // Public videos
  "/videos",
];

const ASSET =
  /\.(?:png|svg|ico|webp|jpe?g|gif|avif|apk|css|js|json|xml|txt|pdf|mp4|webm|m4v|mov|ogg|woff2?|ttf|otf|map)$/i;

// Pages that should not appear in search engines.
const NO_INDEX = [
  "/login",
  "/signup",
  "/application-submitted",
  "/waiting-approval",
  "/dashboard",
  "/admin",
  "/student-performance",
  "/my-profile",
];

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function matchesPathOrChild(
  path: string,
  base: string,
): boolean {
  return (
    path === base ||
    (base !== "/" && path.startsWith(`${base}/`))
  );
}

export function isPublicPagePath(
  pathname: string,
): boolean {
  const path = normalizePath(pathname);

  // Public videos
  if (
    path === "/videos" ||
    path.startsWith("/videos/")
  ) {
    return true;
  }

  if (
    PUBLIC.some((item) =>
      matchesPathOrChild(path, item),
    )
  ) {
    return true;
  }

  // APIs must perform their own authentication checks.
  return (
    path === "/api" ||
    path.startsWith("/api/") ||
    path === "/_next" ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/site.webmanifest" ||
    ASSET.test(path)
  );
}

// Used by proxy.ts to mark private routes as noindex.
export function shouldNoIndexPath(
  pathname: string,
): boolean {
  const path = normalizePath(pathname);

  if (
    path === "/api" ||
    path.startsWith("/api/") ||
    path === "/_next" ||
    path.startsWith("/_next/")
  ) {
    return true;
  }

  return NO_INDEX.some((item) =>
    matchesPathOrChild(path, item),
  );
}

export function safeReturnPath(
  value: string | null | undefined,
): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return null;
  }

  try {
    const url = new URL(
      value,
      "https://smartiqinstitute.in",
    );

    if (
      url.origin !== "https://smartiqinstitute.in" ||
      url.pathname === "/login" ||
      url.pathname === "/signup"
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function requiresStudentRole(
  pathname: string,
): boolean {
  return (
    pathname === "/quiz-arena" ||
    pathname.startsWith("/quiz-arena/")
  );
}
