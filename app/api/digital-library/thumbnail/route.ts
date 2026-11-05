import { NextResponse } from "next/server";

import { findLibraryBook } from "@/lib/library-book-repository";
import { getR2Thumbnail, isValidR2ThumbnailKey } from "@/lib/cloudflare-r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fail(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isValidBookPath(pathname: string): boolean {
  return (
    pathname.length <= 500 &&
    /^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(pathname)
  );
}

function getImageContentType(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";

    case "jpg":
    case "jpeg":
      return "image/jpeg";

    case "webp":
      return "image/webp";

    default:
      throw new Error("Unsupported library thumbnail format.");
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const pathname = String(url.searchParams.get("pathname") || "").trim();

    if (!isValidBookPath(pathname)) {
      return fail("Invalid Digital Library book reference.", 400);
    }

    // Resolve the thumbnail through an active
    // MongoDB book record.
    //
    // The browser cannot provide arbitrary R2 keys.
    // Soft-deleted books are automatically excluded.
    const book = await findLibraryBook(pathname);

    if (!book) {
      return fail("Library book not found.", 404);
    }

    if (book.storageProvider !== "r2") {
      return fail("R2 thumbnail is not active for this book.", 404);
    }

    const key = String(book.r2ThumbnailKey || "");

    if (!isValidR2ThumbnailKey(key)) {
      return fail("Thumbnail unavailable.", 404);
    }

    let object;

    try {
      object = await getR2Thumbnail(key);
    } catch (error) {
      const status = (
        error as {
          $metadata?: {
            httpStatusCode?: number;
          };
        }
      )?.$metadata?.httpStatusCode;

      if (status === 404) {
        return fail("Thumbnail not found.", 404);
      }

      throw error;
    }

    if (!object.Body) {
      return fail("Thumbnail unavailable.", 404);
    }

    const headers = new Headers({
      "Content-Type": getImageContentType(key),
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    });

    if (
      typeof object.ContentLength === "number" &&
      Number.isSafeInteger(object.ContentLength) &&
      object.ContentLength > 0
    ) {
      headers.set("Content-Length", String(object.ContentLength));
    }

    return new Response(object.Body.transformToWebStream(), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(
      "Digital Library thumbnail error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to load book thumbnail.", 500);
  }
}
