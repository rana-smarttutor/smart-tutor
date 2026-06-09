import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getPreviewPath(bookPathname: string) {
  if (bookPathname.startsWith("digital-library/books/")) {
    return bookPathname
      .replace("digital-library/books/", "digital-library/previews/")
      .replace(/\.pdf$/i, ".preview.pdf");
  }

  return bookPathname
    .replace("digital-library/", "digital-library/previews/old-")
    .replace(/\.pdf$/i, ".preview.pdf");
}

function isValidBookPath(pathname: string) {
  return (
    pathname.startsWith("digital-library/books/") ||
    /^digital-library\/[^/]+\.pdf$/i.test(pathname)
  );
}

async function getOrCreatePreview(pathname: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  if (!pathname || !pathname.toLowerCase().endsWith(".pdf")) {
    throw new Error("Invalid PDF path.");
  }

  if (!isValidBookPath(pathname)) {
    throw new Error("This file cannot be previewed.");
  }

  const previewPath = getPreviewPath(pathname);

  const { blobs } = await list({
    prefix: "digital-library/",
    token,
  });

  const existingPreview = blobs.find((blob) => blob.pathname === previewPath);

  if (existingPreview) {
    return existingPreview.url;
  }

  const originalBlob = blobs.find((blob) => blob.pathname === pathname);

  if (!originalBlob) {
    throw new Error("Original PDF was not found.");
  }

  const pdfResponse = await fetch(originalBlob.url, {
    cache: "no-store",
  });

  if (!pdfResponse.ok) {
    throw new Error("Unable to read original PDF.");
  }

  const pdfBytes = await pdfResponse.arrayBuffer();

  const sourcePdf = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
  });

  const previewPdf = await PDFDocument.create();

  const pageCount = Math.min(sourcePdf.getPageCount(), 5);

  if (pageCount <= 0) {
    throw new Error("This PDF has no pages to preview.");
  }

  const pageIndexes = Array.from({ length: pageCount }, (_, index) => index);
  const copiedPages = await previewPdf.copyPages(sourcePdf, pageIndexes);

  for (const page of copiedPages) {
    previewPdf.addPage(page);
  }

  const previewBytes = await previewPdf.save({
    useObjectStreams: true,
  });

  const previewBlob = await put(previewPath, Buffer.from(previewBytes), {
    access: "public",
    token,
    contentType: "application/pdf",
    allowOverwrite: true,
  });

  return previewBlob.url;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname") || "";

    const previewUrl = await getOrCreatePreview(pathname);

    return NextResponse.redirect(previewUrl);
  } catch (error) {
    console.error("PDF preview GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to open PDF preview.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to preview this PDF.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      pathname?: string;
    };

    const previewUrl = await getOrCreatePreview(String(body.pathname || ""));

    return NextResponse.json({
      success: true,
      previewUrl,
    });
  } catch (error) {
    console.error("PDF preview POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF preview.",
      },
      { status: 500 },
    );
  }
}