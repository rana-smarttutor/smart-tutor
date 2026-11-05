import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import {
  findLibraryBook,
  updateLibraryBookDetails,
  toPublicLibraryBook,
  softDeleteLibraryBook,
} from "@/lib/library-book-repository";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";

import { getBookAssetKey, isBookPath } from "@/lib/digital-library-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    bookId: string;
  }>;
};

type UploadedBlobInfo = {
  pathname?: string;
  url?: string;
  downloadUrl?: string;
};

type EditMaterialBody = {
  title?: string;
  price?: string;
  description?: string;
  categoryId?: string;
  categoryLabel?: string;
  assetKey?: string;
  uploadedPdf?: UploadedBlobInfo | null;
  privatePdfPathname?: string;
  uploadedThumbnail?: UploadedBlobInfo | null;
};

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
      },
    },
  );
}

function safeBookName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function normalizeStoredPrice(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  return !digits || Number(digits) <= 0 ? "free" : String(Number(digits));
}

function formatDisplayPrice(value: string) {
  return value === "free"
    ? "Free"
    : `₹${Number(value).toLocaleString("en-IN")}`;
}

async function findExactBlob(pathname: string, token: string) {
  const { blobs } = await list({
    prefix: pathname,
    token,
  });

  return blobs.find((blob) => blob.pathname === pathname) || null;
}

async function verifyThumbnail(
  uploaded: UploadedBlobInfo,
  assetKey: string,
  token: string,
) {
  const pathname = String(uploaded.pathname || "");

  const expectedPrefix = `digital-library/thumbnails/${assetKey}`;

  if (
    !assetKey ||
    pathname.length > 600 ||
    !pathname.startsWith(expectedPrefix) ||
    !new RegExp(
      `^digital-library/thumbnails/${assetKey}\\.(png|jpg|jpeg|webp)$`,
      "i",
    ).test(pathname)
  ) {
    throw new Error("Invalid thumbnail pathname.");
  }

  const stored = await findExactBlob(pathname, token);

  if (!stored || stored.url !== uploaded.url) {
    throw new Error("Uploaded thumbnail could not be verified.");
  }

  return {
    pathname: stored.pathname,
    url: stored.url,
  };
}

async function getBookPath(context: RouteContext) {
  const { bookId } = await context.params;

  // Next.js may already supply a decoded route
  // parameter. Support either representation.
  let pathname = bookId;

  try {
    pathname = decodeURIComponent(bookId);
  } catch {
    return null;
  }

  return isBookPath(pathname) ? pathname : null;
}

// =============================================
// PATCH - UPDATE BOOK DETAILS
// =============================================

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return fail("Only admins and educators can edit books.", 403);
    }

    const pathname = await getBookPath(context);

    if (!pathname) {
      return fail("Invalid book identifier.", 400);
    }

    const existing = await findLibraryBook(pathname);

    if (!existing) {
      return fail("Book not found in MongoDB.", 404);
    }

    const body = (await request.json()) as EditMaterialBody;

    if (body.uploadedPdf || body.privatePdfPathname) {
      return fail(
        "PDF replacement is currently disabled during migration.",
        409,
      );
    }

    const title = String(body.title ?? existing.title).trim();

    if (!title || !safeBookName(title)) {
      return fail("A valid book title is required.", 400);
    }

    let thumbnailUrl = existing.thumbnailUrl || "";

    let thumbnailPathname = existing.thumbnailPathname || "";

    if (body.uploadedThumbnail) {
      // New thumbnails for R2 books require a
      // dedicated R2 upload and verification
      // workflow. Do not save a legacy Blob
      // thumbnail against an R2 book.
      if (existing.storageProvider === "r2") {
        return fail("R2 thumbnail replacement is not enabled yet.", 409);
      }

      const token = process.env.BLOB_READ_WRITE_TOKEN;

      if (!token) {
        return fail("Thumbnail storage is unavailable.", 503);
      }

      const assetKey = getBookAssetKey(pathname);

      if (!assetKey) {
        return fail("Invalid book asset key.", 400);
      }

      const verified = await verifyThumbnail(
        body.uploadedThumbnail,
        assetKey,
        token,
      );

      thumbnailUrl = verified.url;
      thumbnailPathname = verified.pathname;
    }

    const changes = {
      title,
      description: String(
        body.description ?? existing.description ?? "",
      ).trim(),
      price:
        body.price === undefined
          ? existing.price
          : formatDisplayPrice(normalizeStoredPrice(String(body.price))),
      fileName: `${safeBookName(title)}.pdf`,
      categoryId: String(body.categoryId ?? existing.categoryId ?? "").trim(),
      categoryLabel: String(
        body.categoryLabel ?? existing.categoryLabel ?? "",
      ).trim(),
      thumbnailUrl,
      thumbnailPathname,
    };

    const updated = await updateLibraryBookDetails(pathname, changes);

    if (!updated) {
      return fail("Book update could not be saved.", 409);
    }

    const saved = await findLibraryBook(pathname);

    if (!saved) {
      return fail("Book not found after update.", 500);
    }

    await logAction({
      action: "update",
      category: "library",
      details: `Digital library material updated: ${title}`,
      path: `/api/digital-library/${encodeURIComponent(pathname)}`,
      method: "PATCH",
      request,
      session,
      metadata: {
        pathname,
        title,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Book updated in MongoDB.",
        book: toPublicLibraryBook(saved),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Digital Library PATCH error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to update this library book.", 500);
  }
}

// =============================================
// DELETE - SOFT ARCHIVE ONLY
// =============================================

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (String(session?.role || "").toLowerCase() !== "admin") {
      return fail("Only admins can delete books.", 403);
    }

    const pathname = await getBookPath(context);

    if (!pathname) {
      return fail("Invalid book identifier.", 400);
    }

    const existing = await findLibraryBook(pathname);

    if (!existing) {
      return fail("Book not found or already archived.", 404);
    }

    // This affects only the MongoDB book
    // record. Never delete physical files
    // from Cloudflare R2, Vercel or MEGA.
    const deleted = await softDeleteLibraryBook(pathname);

    if (!deleted) {
      return fail("Book could not be archived.", 409);
    }

    await logAction({
      action: "delete",
      category: "library",
      details: `Digital library book archived: ${pathname}`,
      path: `/api/digital-library/${encodeURIComponent(pathname)}`,
      method: "DELETE",
      request,
      session,
      metadata: {
        pathname,
        softDeleted: true,
        physicalFileDeleted: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Book archived successfully. Original PDF and thumbnail files were retained.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Digital Library DELETE error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to archive this library book.", 500);
  }
}
