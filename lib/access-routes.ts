const PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/application-submitted",
  "/waiting-approval",

  /*
   * Public browsing.
   * Protected actions can still
   * require authentication separately.
   */
  "/courses",
  "/mock-test",
  "/quiz-arena",
  "/library",

  /*
   * Homepage/public videos.
   */
  "/videos",
];

const ASSET =
  /\.(?:png|svg|ico|webp|jpe?g|gif|avif|apk|css|js|json|xml|txt|pdf|mp4|webm|m4v|mov|ogg|woff2?|ttf|otf|map)$/i;

/*
 * Pages that should not appear
 * in Google/search engines.
 */
const NO_INDEX = [
  "/login",
  "/signup",
  "/application-submitted",
  "/waiting-approval",
  "/dashboard",
  "/student-performance",
];

function normalizePath(
  pathname: string,
) {
  return (
    pathname.replace(
      /\/+$/,
      "",
    ) || "/"
  );
}

function matchesPathOrChild(
  path: string,
  base: string,
) {
  return (
    path === base ||
    (
      base !== "/" &&
      path.startsWith(
        `${base}/`,
      )
    )
  );
}

export function isPublicPagePath(
  pathname: string,
): boolean {
  const path =
    normalizePath(
      pathname,
    );

  /*
   * Explicitly allow the
   * public video directory.
   */
  if (
    path ===
      "/videos" ||
    path.startsWith(
      "/videos/",
    )
  ) {
    return true;
  }

  if (
    PUBLIC.some(
      (item) =>
        matchesPathOrChild(
          path,
          item,
        ),
    )
  ) {
    return true;
  }

  return (
    path === "/api" ||
    path.startsWith(
      "/api/",
    ) ||
    path === "/_next" ||
    path.startsWith(
      "/_next/",
    ) ||
    path ===
      "/favicon.ico" ||
    path ===
      "/robots.txt" ||
    path ===
      "/sitemap.xml" ||
    path ===
      "/site.webmanifest" ||
    ASSET.test(path)
  );
}

/*
 * Used by proxy.ts.
 *
 * This must remain exported because
 * proxy.ts imports this function.
 */
export function shouldNoIndexPath(
  pathname: string,
): boolean {
  const path =
    normalizePath(
      pathname,
    );

  if (
    path === "/api" ||
    path.startsWith(
      "/api/",
    ) ||
    path === "/_next" ||
    path.startsWith(
      "/_next/",
    )
  ) {
    return true;
  }

  return NO_INDEX.some(
    (item) =>
      matchesPathOrChild(
        path,
        item,
      ),
  );
}

export function safeReturnPath(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    !value ||
    !value.startsWith(
      "/",
    ) ||
    value.startsWith(
      "//",
    ) ||
    value.includes(
      "\\",
    ) ||
    /[\u0000-\u001f]/.test(
      value,
    )
  ) {
    return null;
  }

  try {
    const url =
      new URL(
        value,
        "https://smartiqinstitute.in",
      );

    if (
      url.origin !==
        "https://smartiqinstitute.in" ||
      url.pathname ===
        "/login" ||
      url.pathname ===
        "/signup"
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
    pathname ===
      "/quiz-arena" ||
    pathname.startsWith(
      "/quiz-arena/",
    )
  );
}