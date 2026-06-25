import { copy, del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  DIGITAL_LIBRARY_BOOK_PREFIX,
  getBookAssetKey,
  getLibraryDownloadRoute,
  getMetadataPathForBook,
  getThumbnailPathForAssetKey,
  isBookPath,
  type MegaBookMetadata,
} from "@/lib/digital-library-storage";
import { deleteMegaFileByNodeId } from "@/lib/mega";

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

function isValidThumbnailPath(pathname: string) {
  return (
    pathname.startsWith("digital-library/thumbnails/") &&
    /\.(png|jpg|jpeg|webp)$/i.test(pathname)
  );
}

async function authorizeManager() {
  const session = await getSessionUser();
  const role = String(session?.role || "student").toLowerCase();

  return role === "admin" || role === "educator";
}

async function findMaterial(pathname: string, token: string) {
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

async function findThumbnail(pathname: string, token: string) {
  const assetKey = getBookAssetKey(pathname);

  if (!assetKey) {
    return undefined;
  }

  const { blobs } = await list({
    prefix: `digital-library/thumbnails/${assetKey}`,
    token,
  });

  return blobs[0];
}

async function loadMetadata(pathname: string, token: string) {
  const metadataPath = getMetadataPathForBook(pathname);

  if (!metadataPath) {
    return null;
  }

  const metadataBlob = await findMaterial(metadataPath, token);

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
    !isValidThumbnailPath(thumbnailPath) ||
    !thumbnailPath.includes(`/thumbnails/${assetKey}`) ||
    !uploadedThumbnail.url
  ) {
    throw new Error("Invalid uploaded thumbnail information.");
  }

  return uploadedThumbnail;
}

function currentTargetPath(assetKey: string) {
  return `${DIGITAL_LIBRARY_BOOK_PREFIX}${assetKey}.pdf`;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!(await authorizeManager())) {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can edit materials.",
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

    const { bookId } = await context.params;
    const oldPathname = decodeURIComponent(bookId);
    const existingMetadata = await loadMetadata(oldPathname, token);
    const currentThumbnail = await findThumbnail(oldPathname, token);
    const body = (await request.json()) as EditMaterialBody;

    if (!isBookPath(oldPathname)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid library material.",
        },
        { status: 400 },
      );
    }

    const title = String(body.title || "").trim();
    const price = String(body.price || "0").trim();
    const description = String(body.description || "").trim();
    const safeTitle = safeBookName(title);
    const storedPrice = normalizeStoredPrice(price);
    const assetKey = String(body.assetKey || "").trim();
    const targetPathname = currentTargetPath(assetKey);

    if (!title || !safeTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "Book name is required.",
        },
        { status: 400 },
      );
    }

    if (!assetKey || !targetPathname.endsWith(`${safeTitle}.pdf`)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid material update information.",
        },
        { status: 400 },
      );
    }

    const uploadedPdf = validateUploadedPdf(body.uploadedPdf, targetPathname);
    const uploadedThumbnail = validateUploadedThumbnail(
      body.uploadedThumbnail,
      assetKey,
    );

    const previous = existingMetadata?.record || null;
    const nextThumbnailUrl =
      uploadedThumbnail?.url || previous?.thumbnailUrl || currentThumbnail?.url;
    const nextThumbnailPath =
      uploadedThumbnail?.pathname ||
      previous?.thumbnailPathname ||
      currentThumbnail?.pathname;

    const nextRecord: MegaBookMetadata = {
      pathname: targetPathname,
      title,
      description,
      price: formatDisplayPrice(storedPrice),
      fileName: `${safeTitle}.pdf`,
      categoryId: String(body.categoryId || previous?.categoryId || ""),
      categoryLabel: String(body.categoryLabel || previous?.categoryLabel || ""),
      thumbnailUrl: nextThumbnailUrl,
      thumbnailPathname: nextThumbnailPath,
      blobUrl:
        uploadedPdf?.url ||
        previous?.blobUrl ||
        existingMetadata?.record.blobUrl ||
        "",
      blobPathname:
        uploadedPdf?.pathname ||
        previous?.blobPathname ||
        existingMetadata?.record.blobPathname ||
        "",
      megaDownloadUrl: previous?.megaDownloadUrl || existingMetadata?.record.megaDownloadUrl || "",
      megaNodeId: previous?.megaNodeId || existingMetadata?.record.megaNodeId || "",
      megaFileName: previous?.megaFileName || existingMetadata?.record.megaFileName || "",
      uploadedAt: previous?.uploadedAt || existingMetadata?.record.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storageType: previous?.storageType || "blob",
    };

    if (existingMetadata) {
      const nextMetadataPath = getMetadataPathForBook(targetPathname);

      if (uploadedPdf && previous?.megaNodeId) {
        await deleteMegaFileByNodeId(previous.megaNodeId);
      }

      if (
        uploadedPdf?.pathname &&
        previous?.blobPathname &&
        uploadedPdf.pathname !== previous.blobPathname
      ) {
        await del(previous.blobPathname, { token });
      }

      await put(nextMetadataPath, JSON.stringify(nextRecord, null, 2), {
        access: "public",
        token,
        contentType: "application/json",
        allowOverwrite: true,
      });

      if (existingMetadata.blob.pathname !== nextMetadataPath) {
        await del(existingMetadata.blob.pathname, { token });
      }

      if (
        uploadedThumbnail &&
        currentThumbnail &&
        currentThumbnail.pathname !== uploadedThumbnail.pathname
      ) {
        await del(currentThumbnail.pathname, { token });
      }

      return NextResponse.json({
        success: true,
        book: {
          ...nextRecord,
          downloadUrl: getLibraryDownloadRoute(nextRecord.pathname),
        },
      });
    }

    const currentBook = await findMaterial(oldPathname, token);

    if (!currentBook) {
      return NextResponse.json(
        {
          success: false,
          message: "Material not found.",
        },
        { status: 404 },
      );
    }

    if (uploadedPdf) {
      await put(getMetadataPathForBook(targetPathname), JSON.stringify(nextRecord, null, 2), {
        access: "public",
        token,
        contentType: "application/json",
        allowOverwrite: true,
      });

      await del(oldPathname, { token });

      if (
        uploadedThumbnail &&
        currentThumbnail &&
        currentThumbnail.pathname !== uploadedThumbnail.pathname
      ) {
        await del(currentThumbnail.pathname, { token });
      }

      return NextResponse.json({
        success: true,
        book: {
          ...nextRecord,
          downloadUrl: getLibraryDownloadRoute(nextRecord.pathname),
        },
      });
    }

    const targetPdfPath = targetPathname;

    const copiedBook = await copy(oldPathname, targetPdfPath, {
      access: "public",
      addRandomSuffix: false,
      token,
    });

    let thumbnailUrl: string | undefined;

    if (currentThumbnail) {
      const currentExtension = currentThumbnail.pathname
        .match(/\.(png|jpg|jpeg|webp)$/i)?.[0] || ".jpg";

      const copiedThumbnail = await copy(
        currentThumbnail.pathname,
        getThumbnailPathForAssetKey(assetKey, currentExtension),
        {
          access: "public",
          addRandomSuffix: false,
          token,
        },
      );

      thumbnailUrl = copiedThumbnail.url;
    }

    await del([oldPathname, currentThumbnail?.pathname].filter(Boolean) as string[], {
      token,
    });

    return NextResponse.json({
      success: true,
      book: {
        title,
        price: formatDisplayPrice(storedPrice),
        fileName: `${safeTitle}.pdf`,
        pathname: copiedBook.pathname,
        url: copiedBook.url,
        downloadUrl: copiedBook.downloadUrl || copiedBook.url,
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error("Digital library edit error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to edit material.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    if (!(await authorizeManager())) {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can delete materials.",
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

    const { bookId } = await context.params;
    const pathname = decodeURIComponent(bookId);
    const metadata = await loadMetadata(pathname, token);
    const thumbnail = await findThumbnail(pathname, token);

    if (!isBookPath(pathname)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid library material.",
        },
        { status: 400 },
      );
    }

    if (metadata?.record.megaNodeId) {
      await deleteMegaFileByNodeId(metadata.record.megaNodeId);
    }

    if (metadata?.record.blobPathname) {
      await del(metadata.record.blobPathname, { token });
    }

    if (metadata) {
      await del(metadata.blob.pathname, { token });
    } else {
      await del(pathname, { token });
    }

    if (thumbnail?.pathname) {
      await del(thumbnail.pathname, { token });
    }

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully.",
    });
  } catch (error) {
    console.error("Digital library delete error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete material.",
      },
      { status: 500 },
    );
  }
}
