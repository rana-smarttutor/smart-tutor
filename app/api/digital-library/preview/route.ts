import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

import { getSessionUser } from "@/lib/auth";

import {
  findLibraryBook,
  type LibraryBookRecord,
} from "@/lib/library-book-repository";

import { isPrivateLibraryBookPath } from "@/lib/library-private-storage";

import { getR2Book, isValidR2BookKey } from "@/lib/cloudflare-r2";

import { getMegaStorage } from "@/lib/mega";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_SOURCE_BYTES = 200 * 1024 * 1024;
const MAX_PREVIEW_PAGES = 5;

// =====================================================
// HTTP ERRORS
// =====================================================

class PreviewHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PreviewHttpError";
  }
}

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

// =====================================================
// VALIDATION
// =====================================================

function isValidBookPath(pathname: string) {
  return (
    pathname.length > 0 &&
    pathname.length <= 500 &&
    /^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(pathname)
  );
}

function validatePdfBytes(bytes: Buffer) {
  if (bytes.length === 0 || bytes.length > MAX_SOURCE_BYTES) {
    throw new Error("PDF exceeds the preview size limit.");
  }

  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Invalid PDF content.");
  }

  return bytes;
}

// =====================================================
// CLOUDFLARE R2
// =====================================================

async function readR2Pdf(book: LibraryBookRecord): Promise<Buffer> {
  const key = String(book.r2ObjectKey || "");

  if (!isValidR2BookKey(key)) {
    throw new Error("Invalid R2 PDF reference.");
  }

  const object = await getR2Book(key);

  if (!object.Body) {
    throw new Error("R2 PDF is unavailable.");
  }

  if (
    typeof object.ContentLength === "number" &&
    (object.ContentLength <= 0 || object.ContentLength > MAX_SOURCE_BYTES)
  ) {
    throw new Error("PDF exceeds the preview size limit.");
  }

  const bytes = Buffer.from(await object.Body.transformToByteArray());

  return validatePdfBytes(bytes);
}

// =====================================================
// PRIVATE VERCEL BLOB
// =====================================================

async function readPrivateVercelPdf(book: LibraryBookRecord): Promise<Buffer> {
  const pathname = String(book.privateBlobPathname || "");

  if (!isPrivateLibraryBookPath(pathname)) {
    throw new Error("Invalid private PDF reference.");
  }

  const token = process.env.LIBRARY_PRIVATE_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("Private PDF storage is not configured.");
  }

  const result = await get(pathname, {
    access: "private",
    token,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Private PDF is unavailable.");
  }

  const reader = result.stream.getReader();

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > MAX_SOURCE_BYTES) {
        await reader.cancel();

        throw new Error("PDF exceeds the preview size limit.");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return validatePdfBytes(
    Buffer.concat(
      chunks.map((chunk) => Buffer.from(chunk)),
      total,
    ),
  );
}

// =====================================================
// MEGA
// =====================================================

async function readMegaPdf(book: LibraryBookRecord): Promise<Buffer> {
  const nodeId = String(book.megaNodeId || "");

  if (!/^[a-zA-Z0-9_-]+$/.test(nodeId)) {
    throw new Error("Invalid MEGA node ID.");
  }

  const storage = await getMegaStorage();

  const file =
    storage.files?.[nodeId] ||
    storage.root.children?.find(
      (item: { nodeId?: string }) => String(item.nodeId || "") === nodeId,
    );

  if (!file) {
    throw new Error("MEGA PDF is unavailable.");
  }

  const expectedSize = Number(file.size || 0);

  if (
    !Number.isSafeInteger(expectedSize) ||
    expectedSize <= 0 ||
    expectedSize > MAX_SOURCE_BYTES
  ) {
    throw new Error("MEGA PDF exceeds the preview size limit.");
  }

  const bytes = Buffer.from(await file.downloadBuffer());

  if (bytes.length !== expectedSize) {
    throw new Error("Incomplete MEGA PDF download.");
  }

  return validatePdfBytes(bytes);
}

// =====================================================
// STORAGE ROUTING
// =====================================================

async function loadBookBytes(book: LibraryBookRecord): Promise<Buffer> {
  if (book.storageProvider === "r2") {
    return readR2Pdf(book);
  }

  if (book.storageProvider === "vercel-private") {
    return readPrivateVercelPdf(book);
  }

  if (book.storageProvider === "mega") {
    return readMegaPdf(book);
  }

  throw new Error("Unsupported PDF storage provider.");
}

// =====================================================
// BOOK RESOLUTION AND FIVE-PAGE PREVIEW
// =====================================================

async function buildPreviewBytes(pathname: string): Promise<Uint8Array> {
  if (!isValidBookPath(pathname)) {
    throw new PreviewHttpError("Invalid library book pathname.", 400);
  }

  // IMPORTANT:
  // findLibraryBook() now enforces the verified
  // 52-book MongoDB allowlist.
  //
  // Hidden, archived and nonexistent books
  // are rejected BEFORE any PDF is downloaded.
  const book = await findLibraryBook(pathname);

  if (!book) {
    throw new PreviewHttpError("Library book not found.", 404);
  }

  const sourceBytes = await loadBookBytes(book);

  const source = await PDFDocument.load(sourceBytes, {
    ignoreEncryption: true,
  });

  const pageCount = Math.min(source.getPageCount(), MAX_PREVIEW_PAGES);

  if (pageCount <= 0) {
    throw new PreviewHttpError("This PDF has no pages to preview.", 422);
  }

  const preview = await PDFDocument.create();

  const pages = await preview.copyPages(
    source,
    Array.from({ length: pageCount }, (_, index) => index),
  );

  for (const page of pages) {
    preview.addPage(page);
  }

  return preview.save({
    useObjectStreams: true,
  });
}

// =====================================================
// PDF RESPONSE
// =====================================================

function previewResponse(bytes: Uint8Array): Response {
  const output = new Uint8Array(bytes);

  return new Response(output, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="smartiq-preview.pdf"',
      "Cache-Control": "private, no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

// =====================================================
// AUTHORIZATION
// =====================================================

async function authorizePreview() {
  const session = await getSessionUser();

  if (!session) {
    return {
      allowed: false as const,
      status: 401,
      message: "Please log in to preview books.",
    };
  }

  const role = String(session.role || "").toLowerCase();

  if (role !== "student" && role !== "admin" && role !== "educator") {
    return {
      allowed: false as const,
      status: 403,
      message: "Digital Library preview access denied.",
    };
  }

  // Students can preview up to five pages
  // without an active subscription.
  // Full PDF download checks are separate.
  return {
    allowed: true as const,
  };
}

// =====================================================
// ERROR HANDLING
// =====================================================

function handlePreviewError(error: unknown, method: "GET" | "POST") {
  if (error instanceof PreviewHttpError) {
    return fail(error.message, error.status);
  }

  console.error(
    `Digital Library preview ${method} error:`,
    error instanceof Error ? error.message : "Unknown error",
  );

  // Do not expose storage credentials,
  // internal exceptions or bucket details.
  return fail("Unable to generate the PDF preview.", 500);
}

// =====================================================
// GET
// =====================================================

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await authorizePreview();

    if (!auth.allowed) {
      return fail(auth.message, auth.status);
    }

    const url = new URL(request.url);

    const pathname = String(url.searchParams.get("pathname") || "").trim();

    if (!isValidBookPath(pathname)) {
      return fail("Invalid library book pathname.", 400);
    }

    const bytes = await buildPreviewBytes(pathname);

    return previewResponse(bytes);
  } catch (error) {
    return handlePreviewError(error, "GET");
  }
}

// =====================================================
// POST
// =====================================================

export async function POST(request: Request): Promise<Response> {
  try {
    const auth = await authorizePreview();

    if (!auth.allowed) {
      return fail(auth.message, auth.status);
    }

    const body = await request.json().catch(() => null);

    const pathname = String(body?.pathname || "").trim();

    if (!isValidBookPath(pathname)) {
      return fail("Invalid library book pathname.", 400);
    }

    const bytes = await buildPreviewBytes(pathname);

    return previewResponse(bytes);
  } catch (error) {
    return handlePreviewError(error, "POST");
  }
}
