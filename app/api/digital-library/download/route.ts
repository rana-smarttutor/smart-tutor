import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMetadataPathForBook, type MegaBookMetadata } from "@/lib/digital-library-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function resolveBookDownload(pathname: string, token: string) {
  const metadataPath = getMetadataPathForBook(pathname);

  if (!metadataPath) {
    return NextResponse.json(
      {
        success: false,
        message: "This book is not available for Mega download.",
      },
      { status: 404 },
    );
  }

  const metadataBlob = await findExactBlob(metadataPath, token);

  if (!metadataBlob) {
    return NextResponse.json({
      success: false,
      message: "Book metadata not found. Please add the Mega link in metadata first.",
    });
  }

  const metadata = await readJsonBlob<MegaBookMetadata>(metadataBlob.url);

  if (!metadata.megaDownloadUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "Mega download link is missing for this book.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    redirectUrl: metadata.megaDownloadUrl,
  });
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.redirect(
        new URL(
          `/login?callbackUrl=${encodeURIComponent("/library")}`,
          request.url,
        ),
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
    }

    const { searchParams } = new URL(request.url);
    const pathname = String(searchParams.get("pathname") || "").trim();

    if (!pathname) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing book pathname.",
        },
        { status: 400 },
      );
    }

    return await resolveBookDownload(pathname, token);
  } catch (error) {
    console.error("Digital library download error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to open book download.",
      },
      { status: 500 },
    );
  }
}
