import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PDF_BYTES = 20 * 1024 * 1024;

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

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return fail("Only admins and educators can upload library PDFs.", 403);
    }

    // Keep legacy private Vercel PDF uploads
    // disabled while existing books are
    // being migrated to Cloudflare R2.
    //
    // Do not enable this flag during
    // the R2 database cutover.
    if (process.env.LIBRARY_ALLOW_LEGACY_PDF_UPLOADS !== "true") {
      return fail(
        "New PDF uploads are temporarily paused during Cloudflare R2 migration.",
        503,
      );
    }

    const token = process.env.LIBRARY_PRIVATE_BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return fail("Private PDF storage is not configured.", 503);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);

    if (
      !Number.isFinite(contentLength) ||
      contentLength > MAX_PDF_BYTES + 1024 * 1024
    ) {
      return fail("PDF exceeds the current 20 MB limit.", 413);
    }

    const form = await request.formData();

    const file = form.get("file");

    if (!(file instanceof File)) {
      return fail("Select a PDF file.", 400);
    }

    if (
      file.size <= 0 ||
      file.size > MAX_PDF_BYTES ||
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return fail("Only PDF files up to 20 MB are supported.", 400);
    }

    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());

    const validPdf =
      header.length === 5 &&
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46 &&
      header[4] === 0x2d;

    if (!validPdf) {
      return fail("Invalid PDF file signature.", 400);
    }

    const pathname = `digital-library/private-books/${randomUUID()}.pdf`;

    const result = await put(pathname, file, {
      access: "private",
      token,
      addRandomSuffix: false,
      contentType: "application/pdf",
    });

    // Private Blob URLs and access tokens
    // must never be returned to the browser.
    return NextResponse.json(
      {
        success: true,
        pathname: result.pathname,
        message: "PDF uploaded to private storage.",
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Library private upload error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to upload private PDF.", 500);
  }
}
