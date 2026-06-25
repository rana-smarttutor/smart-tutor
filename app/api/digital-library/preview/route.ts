import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

import { getSessionUser } from "@/lib/auth";
import {
  getMetadataPathForBook,
  getBookAssetKey,
  type MegaBookMetadata,
} from "@/lib/digital-library-storage";
import { downloadMegaFileBuffer } from "@/lib/mega";

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

async function findExactBlob(pathname: string, token: string) {
  const { blobs } = await list({
    prefix: pathname,
    token,
  });

  return blobs.find((blob) => blob.pathname === pathname) || null;
}

async function readJsonBlob<T>(blobUrl: string): Promise<T> {
  const response = await fetch(blobUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to read book metadata.");
  }

  return (await response.json()) as T;
}

async function getBookBytes(pathname: string, token: string) {
  const metadataPath = getMetadataPathForBook(pathname);

  if (metadataPath) {
    const metadataBlob = await findExactBlob(metadataPath, token);

    if (metadataBlob) {
      const metadata = await readJsonBlob<MegaBookMetadata>(metadataBlob.url);

      if (metadata.megaDownloadUrl) {
        return downloadMegaFileBuffer(metadata.megaDownloadUrl);
      }

      if (metadata.blobUrl) {
        const pdfResponse = await fetch(metadata.blobUrl, {
          cache: "no-store",
        });

        if (!pdfResponse.ok) {
          throw new Error("Unable to read PDF from blob storage.");
        }

        return Buffer.from(await pdfResponse.arrayBuffer());
      }
    }
  }

  const originalBlob = await findExactBlob(pathname, token);

  if (!originalBlob) {
    throw new Error("Original PDF was not found.");
  }

  const pdfResponse = await fetch(originalBlob.url, {
    cache: "no-store",
  });

  if (!pdfResponse.ok) {
    throw new Error("Unable to read original PDF.");
  }

  return Buffer.from(await pdfResponse.arrayBuffer());
}

async function buildPreviewBytes(pathname: string) {
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

  const pdfBytes = await getBookBytes(pathname, token);

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

  return previewBytes;
}

function createPreviewResponse(pdfBytes: Uint8Array) {
  const body = pdfBytes.slice().buffer;

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname") || "";

    const previewBytes = await buildPreviewBytes(pathname);

    return createPreviewResponse(previewBytes);
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

    const previewBytes = await buildPreviewBytes(String(body.pathname || ""));

    return createPreviewResponse(previewBytes);
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
