import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  DIGITAL_LIBRARY_BOOK_PREFIX,
  DIGITAL_LIBRARY_METADATA_PREFIX,
  getBookAssetKey,
  getLibraryDownloadRoute,
  getMetadataPathForBook,
  getThumbnailPathForAssetKey,
  isBookPath,
  type MegaBookMetadata,
} from "@/lib/digital-library-storage";
import { getDigitalLibraryBooks } from "@/lib/digital-library-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  uploadedPdf?: UploadedBlobInfo | null;
  uploadedThumbnail?: UploadedBlobInfo | null;
};

function safeBookName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
}

function normalizeStoredPrice(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  return !digits || Number(digits) <= 0
    ? "free"
    : String(Number(digits));
}

function formatDisplayPrice(value: string) {
  return value === "free"
    ? "Free"
    : `₹${Number(value).toLocaleString("en-IN")}`;
}

async function authorizeManager() {
  const session = await getSessionUser();
  const role = String(session?.role || "student").toLowerCase();

  return role === "admin" || role === "educator";
}

async function findBlob(pathname: string, token: string) {
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
    throw new Error("Unable to read stored library metadata.");
  }

  return (await response.json()) as T;
}

async function loadExistingMetadata(pathname: string, token: string) {
  const metadataPath = getMetadataPathForBook(pathname);

  if (!metadataPath) {
    return null;
  }

  const metadataBlob = await findBlob(metadataPath, token);

  if (!metadataBlob) {
    return null;
  }

  return {
    blob: metadataBlob,
    record: await readJsonBlob<MegaBookMetadata>(metadataBlob.url),
  };
}

function validateUploadedPdf(
  uploadedPdf: UploadedBlobInfo | null | undefined,
  expectedPathname: string,
) {
  if (!uploadedPdf) {
    return null;
  }

  if (uploadedPdf.pathname !== expectedPathname || !uploadedPdf.url) {
    throw new Error("Invalid uploaded PDF information.");
  }

  return uploadedPdf;
}

function validateUploadedThumbnail(
  uploadedThumbnail: UploadedBlobInfo | null | undefined,
  assetKey: string,
) {
  if (!uploadedThumbnail) {
    return null;
  }

  const thumbnailPath = uploadedThumbnail.pathname || "";

  if (
    !thumbnailPath.startsWith("digital-library/thumbnails/") ||
    !thumbnailPath.includes(`/thumbnails/${assetKey}`) ||
    !uploadedThumbnail.url
  ) {
    throw new Error("Invalid uploaded thumbnail information.");
  }

  return uploadedThumbnail;
}

async function saveMetadataRecord(
  token: string,
  pathname: string,
  record: MegaBookMetadata,
) {
  const metadataPath = getMetadataPathForBook(pathname);

  if (!metadataPath) {
    throw new Error("Invalid library material.");
  }

  await put(metadataPath, JSON.stringify(record, null, 2), {
    access: "public",
    token,
    contentType: "application/json",
    allowOverwrite: true,
  });
}

function createMetadataRecord(
  pathname: string,
  body: SaveMaterialBody,
  uploadedPdf: UploadedBlobInfo,
  uploadedThumbnail: UploadedBlobInfo | null,
  previous?: MegaBookMetadata | null,
): MegaBookMetadata {
  const now = new Date().toISOString();
  const safeTitle = safeBookName(String(body.title || ""));
  const assetKey = String(body.assetKey || "").trim();
  const uploadedAt = previous?.uploadedAt || now;

  return {
    pathname,
    title: String(body.title || "").trim(),
    description: String(body.description || previous?.description || "").trim(),
    price: formatDisplayPrice(normalizeStoredPrice(String(body.price || "0"))),
    fileName: `${safeTitle || previous?.title || "book"}.pdf`,
    categoryId: String(body.categoryId || previous?.categoryId || ""),
    categoryLabel: String(body.categoryLabel || previous?.categoryLabel || ""),
    thumbnailUrl: uploadedThumbnail?.url || previous?.thumbnailUrl,
    thumbnailPathname:
      uploadedThumbnail?.pathname || previous?.thumbnailPathname || undefined,
    blobUrl: uploadedPdf.url || previous?.blobUrl || "",
    blobPathname: uploadedPdf.pathname || previous?.blobPathname || "",
    megaDownloadUrl: previous?.megaDownloadUrl || "",
    megaNodeId: previous?.megaNodeId || "",
    megaFileName: previous?.megaFileName || "",
    uploadedAt,
    updatedAt: now,
    storageType: previous?.storageType || "blob",
  };
}

export async function GET() {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "student").toLowerCase();
    const canManage = role === "admin" || role === "educator";
    const isLoggedIn = Boolean(session);
    const canAccessPdf = canManage || isLoggedIn;

    const books = await getDigitalLibraryBooks(canAccessPdf);

    return NextResponse.json({
      success: true,
      canManage,
      isLoggedIn,
      role,
      books,
    });
  } catch (error) {
    console.error("Digital library list error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load digital library.",
        books: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await authorizeManager())) {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can upload library materials.",
        },
        { status: 403 },
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "BLOB_READ_WRITE_TOKEN is missing.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as SaveMaterialBody;
    const title = String(body.title || "").trim();
    const safeTitle = safeBookName(title);
    const storedPrice = normalizeStoredPrice(String(body.price || "0"));
    const description = String(body.description || "").trim();
    const categoryId = String(body.categoryId || "school-learning").trim();
    const categoryLabel = String(body.categoryLabel || "").trim();
    const assetKey = String(body.assetKey || "").trim();
    const pathname = `${DIGITAL_LIBRARY_BOOK_PREFIX}${assetKey}.pdf`;

    if (!title || !safeTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "Book name is required.",
        },
        { status: 400 },
      );
    }

    if (!assetKey || !pathname.startsWith(DIGITAL_LIBRARY_BOOK_PREFIX)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid material identifier.",
        },
        { status: 400 },
      );
    }

    const uploadedPdf = validateUploadedPdf(body.uploadedPdf, pathname);

    if (!uploadedPdf) {
      return NextResponse.json(
        {
          success: false,
          message: "A Mega uploaded PDF is required to create a book.",
        },
        { status: 400 },
      );
    }

    const uploadedThumbnail = validateUploadedThumbnail(
      body.uploadedThumbnail,
      assetKey,
    );

    const record: MegaBookMetadata = {
      pathname,
      title,
      description,
      price: formatDisplayPrice(storedPrice),
      fileName: `${safeTitle}.pdf`,
      categoryId,
      categoryLabel,
      thumbnailUrl: uploadedThumbnail?.url,
      thumbnailPathname: uploadedThumbnail?.pathname,
      blobUrl: uploadedPdf.url || "",
      blobPathname: uploadedPdf.pathname || "",
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storageType: "blob",
    };

    await saveMetadataRecord(token, pathname, record);

    return NextResponse.json({
      success: true,
      message: "Material saved successfully.",
      book: {
        ...record,
        downloadUrl: getLibraryDownloadRoute(record.pathname),
      },
    });
  } catch (error) {
    console.error("Digital library create error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to save material.",
      },
      { status: 500 },
    );
  }
}
