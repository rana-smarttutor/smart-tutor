import { NextResponse } from "next/server";

import {
  saveLibraryBook,
  toPublicLibraryBook,
} from "@/lib/library-book-repository";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";

import { DIGITAL_LIBRARY_BOOK_PREFIX } from "@/lib/digital-library-storage";

import { verifyPrivateLibraryBook } from "@/lib/library-private-storage";

import {
  getHybridLibraryCatalog,
  getHybridLibraryCatalogStatus,
} from "@/lib/library-hybrid-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =====================================================
// TYPES
// =====================================================

type UploadedBlobInfo = {
  pathname?: string;
  url?: string;
  downloadUrl?: string;
};

type SaveMaterialBody = {
  title?: string;
  price?: string;
  description?: string;
  categoryId?: string;
  categoryLabel?: string;
  assetKey?: string;
  privatePdfPathname?: string;
  uploadedThumbnail?: UploadedBlobInfo | null;
};

// =====================================================
// HELPERS
// =====================================================

function safeBookName(name: string) {
  return name
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

function isValidAssetKey(value: string) {
  return (
    value.length > 0 && value.length <= 450 && /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

function validateUploadedThumbnail(
  uploadedThumbnail: UploadedBlobInfo | null | undefined,
  assetKey: string,
) {
  if (!uploadedThumbnail) {
    return null;
  }

  const pathname = String(uploadedThumbnail.pathname || "");

  const expectedPrefix = `digital-library/thumbnails/${assetKey}`;

  const validPathname =
    pathname.length <= 600 &&
    pathname.startsWith(expectedPrefix) &&
    new RegExp(
      `^digital-library/thumbnails/${assetKey}\\.(png|jpg|jpeg|webp)$`,
      "i",
    ).test(pathname);

  if (!validPathname || !uploadedThumbnail.url) {
    throw new Error("Invalid uploaded thumbnail information.");
  }

  return uploadedThumbnail;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

// =====================================================
// GET - DIGITAL LIBRARY CATALOGUE
// =====================================================

export async function GET() {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "guest").toLowerCase();

    const canManage = role === "admin" || role === "educator";

    const isLoggedIn = Boolean(session);

    const status = await getHybridLibraryCatalogStatus();

    // Never expose an invalid or incomplete
    // catalogue and never fall back to public
    // Vercel Blob listings.
    //
    // The status helper supports both:
    // 1. The complete legacy catalogue before
    //    the database cutover.
    // 2. The 52-book R2 catalogue afterwards.
    const catalogAvailable =
      status.invalid === 0 &&
      (status.migrationComplete || status.r2MigrationComplete);

    if (!catalogAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: "Digital Library catalogue is being verified.",
          books: [],
          canManage,
          isLoggedIn,
          role,
          catalogSource: "mongodb",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const books = await getHybridLibraryCatalog();

    return NextResponse.json(
      {
        success: true,
        canManage,
        isLoggedIn,
        role,
        books,
        catalogSource: "mongodb",
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Digital Library catalogue error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return errorResponse("Unable to load Digital Library.", 500);
  }
}

// =====================================================
// POST - LEGACY BOOK REGISTRATION
// =====================================================

// New PDF registration remains disabled unless
// LIBRARY_ALLOW_LEGACY_PDF_UPLOADS=true.
//
// Do NOT enable that flag during the R2 cutover.
// This endpoint is not an R2 upload implementation.

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return errorResponse("Access denied.", 403);
    }

    if (process.env.LIBRARY_ALLOW_LEGACY_PDF_UPLOADS !== "true") {
      return errorResponse(
        "New library book registration is paused during storage migration.",
        503,
      );
    }

    const body = (await request.json()) as SaveMaterialBody;

    const title = String(body.title || "").trim();

    const description = String(body.description || "").trim();

    const assetKey = String(body.assetKey || "").trim();

    const privatePdfPathname = String(body.privatePdfPathname || "").trim();

    if (!title || !safeBookName(title)) {
      return errorResponse("A valid book title is required.", 400);
    }

    if (!isValidAssetKey(assetKey)) {
      return errorResponse("Invalid book identifier.", 400);
    }

    if (!privatePdfPathname) {
      return errorResponse("Upload a private PDF first.", 400);
    }

    // Verify the legacy private storage
    // object before registering its record.
    await verifyPrivateLibraryBook(privatePdfPathname);

    const thumbnail = validateUploadedThumbnail(
      body.uploadedThumbnail,
      assetKey,
    );

    const now = new Date();

    const pathname = `${DIGITAL_LIBRARY_BOOK_PREFIX}${assetKey}.pdf`;

    const book = {
      pathname,
      title,
      description,
      price: formatDisplayPrice(
        normalizeStoredPrice(String(body.price || "0")),
      ),
      fileName: `${safeBookName(title)}.pdf`,
      categoryId: String(body.categoryId || "school-learning").trim(),
      categoryLabel: String(body.categoryLabel || "").trim(),
      thumbnailUrl: thumbnail?.url || "",
      thumbnailPathname: thumbnail?.pathname || "",
      storageProvider: "vercel-private" as const,
      privateBlobPathname: privatePdfPathname,
      uploadedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      migratedAt: now,
    };

    await saveLibraryBook(book);

    await logAction({
      action: "create",
      category: "library",
      details: `Digital library material created: ${title}`,
      path: "/api/digital-library",
      method: "POST",
      request,
      session,
      metadata: {
        title,
        assetKey,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Book saved to MongoDB.",
        book: toPublicLibraryBook(book),
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Digital Library registration error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    const message = error instanceof Error ? error.message : "";

    const duplicate =
      message.includes("already exists") || message.includes("E11000");

    return errorResponse(
      duplicate
        ? "A book with this identifier already exists."
        : "Unable to save this book. Verify private storage access.",
      duplicate ? 409 : 500,
    );
  }
}
