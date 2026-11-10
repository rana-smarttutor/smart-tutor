import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import { findLibraryBook } from "@/lib/library-book-repository";

import { isPrivateLibraryBookPath } from "@/lib/library-private-storage";

import { isPaidLibraryBook } from "@/lib/library-book-pricing";
import { hasPurchasedLibraryBook } from "@/lib/library-book-purchases";

import { DIGITAL_LIBRARY_LOCKED } from "@/lib/digital-library-lockdown";

import { getR2Book, isValidR2BookKey } from "@/lib/cloudflare-r2";

import {
  downloadMegaFileBuffer,
  getMegaPublicLinkForNodeId,
  getMegaStorage,
} from "@/lib/mega";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MEGA_DOWNLOAD_BYTES = 200 * 1024 * 1024;

// =====================================================
// RESPONSE HELPERS
// =====================================================

function fail(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function isValidBookPath(pathname: string): boolean {
  return (
    pathname.length > 0 &&
    pathname.length <= 500 &&
    /^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(pathname)
  );
}

function pdfHeaders(): HeadersInit {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="smartiq-library-book.pdf"',
    "Cache-Control": "private, no-store, no-transform",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  };
}

// =====================================================
// DOWNLOAD ENDPOINT
// =====================================================

export async function GET(request: Request): Promise<Response> {
  try {
    // -----------------------------------------------
    // 1. AUTHENTICATION
    // -----------------------------------------------

    const session = await getSessionUser();

    if (!session) {
      return fail("Please log in to download books.", 401);
    }

    const role = String(session.role || "").toLowerCase();

    const canManage = role === "admin" || role === "educator";

    if (!canManage && role !== "student") {
      return fail("Digital Library download access denied.", 403);
    }

    // -----------------------------------------------
    // 2. VALIDATE BOOK PATHNAME
    // -----------------------------------------------

    const { searchParams } = new URL(request.url);

    const pathname = String(searchParams.get("pathname") || "").trim();

    if (!isValidBookPath(pathname)) {
      return fail("Invalid library book pathname.", 400);
    }

    // -----------------------------------------------
    // 3. VERIFY BOOK IS IN THE RETAINED 52
    // -----------------------------------------------

    // IMPORTANT:
    // findLibraryBook() enforces the fixed
    // retained-book allowlist and excludes
    // soft-deleted records.
    //
    // Reject unwanted books BEFORE evaluating
    // subscription or lockdown state.
    //
    // Never accept an R2 key directly from
    // the browser.
    const book = await findLibraryBook(pathname);

    if (!book) {
      return fail("Library book not found.", 404);
    }

    // -----------------------------------------------
    // 4. STUDENT DOWNLOAD PERMISSIONS
    // -----------------------------------------------

    if (!canManage) {
      // Keep all student full downloads blocked
      // during the R2 migration.
      if (DIGITAL_LIBRARY_LOCKED) {
        return fail(
          "Library downloads are temporarily disabled during migration.",
          503,
        );
      }

      // After migration, only paid-category books require ownership.
      if (isPaidLibraryBook(book.categoryId)) {
        const hasPurchased = await hasPurchasedLibraryBook(
          String(session.id),
          book.pathname,
        );

        if (!hasPurchased) {
          return fail(
            "Purchase this book for ₹49 to access the full PDF.",
            403,
          );
        }
      }
    }

    // Admin and educator retain their
    // existing bypass for subscription
    // and migration lockdown.
    //
    // The 47-book allowlist still applies
    // to everyone.

    // ==============================================
    // 5. CLOUDFLARE R2
    // ==============================================

    if (book.storageProvider === "r2") {
      const key = String(book.r2ObjectKey || "");

      if (!isValidR2BookKey(key)) {
        return fail("Invalid R2 PDF reference.", 409);
      }

      let object;

      try {
        object = await getR2Book(key);
      } catch (error) {
        const status = (
          error as {
            $metadata?: {
              httpStatusCode?: number;
            };
          }
        )?.$metadata?.httpStatusCode;

        if (status === 404) {
          return fail("R2 PDF not found.", 404);
        }

        throw error;
      }

      if (!object.Body) {
        return fail("R2 PDF is unavailable.", 404);
      }

      const stream = object.Body.transformToWebStream();

      const headers = new Headers(pdfHeaders());

      if (
        typeof object.ContentLength === "number" &&
        Number.isSafeInteger(object.ContentLength) &&
        object.ContentLength > 0
      ) {
        headers.set("Content-Length", String(object.ContentLength));
      }

      return new Response(stream, {
        status: 200,
        headers,
      });
    }

    // ==============================================
    // 6. LEGACY PRIVATE VERCEL BLOB
    // ==============================================

    if (book.storageProvider === "vercel-private") {
      const privatePathname = book.privateBlobPathname;

      if (!privatePathname || !isPrivateLibraryBookPath(privatePathname)) {
        return fail("Invalid private book reference.", 409);
      }

      const token = process.env.LIBRARY_PRIVATE_BLOB_READ_WRITE_TOKEN;

      if (!token) {
        return fail("Private storage is not configured.", 503);
      }

      const result = await get(privatePathname, {
        access: "private",
        token,
      });

      if (!result || result.statusCode !== 200 || !result.stream) {
        return fail("Private PDF unavailable.", 404);
      }

      return new Response(result.stream, {
        status: 200,
        headers: pdfHeaders(),
      });
    }

    // ==============================================
    // 7. LEGACY MEGA STORAGE
    // ==============================================

    if (book.storageProvider === "mega") {
      const nodeId = String(book.megaNodeId || "");

      if (!/^[a-zA-Z0-9_-]+$/.test(nodeId)) {
        return fail("Invalid MEGA book reference.", 409);
      }

      const storage = await getMegaStorage();

      const file =
        storage.files?.[nodeId] ||
        storage.root.children?.find(
          (item: { nodeId?: string }) => String(item.nodeId || "") === nodeId,
        );

      if (!file) {
        return fail("MEGA PDF unavailable.", 404);
      }

      const size = Number(file.size || 0);

      if (
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > MAX_MEGA_DOWNLOAD_BYTES
      ) {
        return fail("This PDF exceeds the secure download size limit.", 413);
      }

      const downloadUrl = await getMegaPublicLinkForNodeId(nodeId);

      if (!downloadUrl) {
        return fail("MEGA file link unavailable.", 404);
      }

      // Legacy compatibility:
      // The MEGA share URL is never sent
      // directly to the browser.
      const buffer = await downloadMegaFileBuffer(downloadUrl);

      if (
        buffer.byteLength !== size ||
        buffer.byteLength > MAX_MEGA_DOWNLOAD_BYTES
      ) {
        return fail("Invalid MEGA PDF size.", 502);
      }

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: pdfHeaders(),
      });
    }

    return fail("Unsupported library storage provider.", 409);
  } catch (error) {
    console.error(
      "Digital Library download error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to download this library book.", 500);
  }
}
