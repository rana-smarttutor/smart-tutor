import { copy, del, list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

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

function getExtension(name: string) {
  const index = name.lastIndexOf(".");

  return index === -1 ? "" : name.slice(index).toLowerCase();
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

function isValidBookPath(pathname: string) {
  return (
    pathname.startsWith("digital-library/books/") &&
    pathname.toLowerCase().endsWith(".pdf")
  );
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

  return blobs.find((blob) => blob.pathname === pathname);
}

async function findThumbnail(pathname: string, token: string) {
  if (!isValidBookPath(pathname)) {
    return undefined;
  }

  const key = pathname
    .replace("digital-library/books/", "")
    .replace(/\.pdf$/i, "");

  const { blobs } = await list({
    prefix: `digital-library/thumbnails/${key}`,
    token,
  });

  return blobs[0];
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!(await authorizeManager())) {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can edit materials.",
        },
        { status: 403 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "BLOB_READ_WRITE_TOKEN is missing.",
        },
        { status: 500 }
      );
    }

    const { bookId } = await context.params;
    const oldPathname = decodeURIComponent(bookId);

    if (!isValidBookPath(oldPathname)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid library material.",
        },
        { status: 400 }
      );
    }

    const currentBook = await findMaterial(oldPathname, token);

    if (!currentBook) {
      return NextResponse.json(
        {
          success: false,
          message: "Material not found.",
        },
        { status: 404 }
      );
    }

    const currentThumbnail = await findThumbnail(oldPathname, token);
    const body = (await request.json()) as EditMaterialBody;

    const title = String(body.title || "").trim();
    const price = String(body.price || "0").trim();
    const safeTitle = safeBookName(title);
    const storedPrice = normalizeStoredPrice(price);
    const assetKey = String(body.assetKey || "").trim();

    if (!title || !safeTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "Book name is required.",
        },
        { status: 400 }
      );
    }

    const expectedEnding = `__${storedPrice}__${safeTitle}`;

    if (!assetKey || !assetKey.endsWith(expectedEnding)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid material update information.",
        },
        { status: 400 }
      );
    }

    const targetPdfPath = `digital-library/books/${assetKey}.pdf`;
    const uploadedPdfPath = body.uploadedPdf?.pathname || "";

    let newBook: {
      pathname: string;
      url: string;
      downloadUrl?: string;
    };

    if (uploadedPdfPath) {
      if (
        !isValidBookPath(uploadedPdfPath) ||
        uploadedPdfPath !== targetPdfPath ||
        !body.uploadedPdf?.url
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid uploaded PDF information.",
          },
          { status: 400 }
        );
      }

      newBook = {
        pathname: uploadedPdfPath,
        url: body.uploadedPdf.url,
        downloadUrl: body.uploadedPdf.downloadUrl || body.uploadedPdf.url,
      };
    } else {
      const copiedBook = await copy(oldPathname, targetPdfPath, {
        access: "public",
        addRandomSuffix: false,
        token,
      });

      newBook = {
        pathname: copiedBook.pathname,
        url: copiedBook.url,
        downloadUrl: copiedBook.downloadUrl || copiedBook.url,
      };
    }

    let thumbnailUrl: string | undefined;
    const uploadedThumbnailPath = body.uploadedThumbnail?.pathname || "";

    if (uploadedThumbnailPath) {
      if (
        !isValidThumbnailPath(uploadedThumbnailPath) ||
        !uploadedThumbnailPath.includes(`/thumbnails/${assetKey}`) ||
        !body.uploadedThumbnail?.url
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid uploaded thumbnail information.",
          },
          { status: 400 }
        );
      }

      thumbnailUrl = body.uploadedThumbnail.url;
    } else if (currentThumbnail) {
      const currentExtension =
        getExtension(currentThumbnail.pathname) || ".jpg";

      const copiedThumbnail = await copy(
        currentThumbnail.pathname,
        `digital-library/thumbnails/${assetKey}${currentExtension}`,
        {
          access: "public",
          addRandomSuffix: false,
          token,
        }
      );

      thumbnailUrl = copiedThumbnail.url;
    }

    const oldFilesToDelete = [oldPathname];

    if (currentThumbnail) {
      oldFilesToDelete.push(currentThumbnail.pathname);
    }

    await del(oldFilesToDelete, {
      token,
    });

    return NextResponse.json({
      success: true,
      book: {
        title,
        price: formatDisplayPrice(storedPrice),
        fileName: `${safeTitle}.pdf`,
        pathname: newBook.pathname,
        url: newBook.url,
        downloadUrl: newBook.downloadUrl || newBook.url,
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
      { status: 500 }
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
        { status: 403 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "BLOB_READ_WRITE_TOKEN is missing.",
        },
        { status: 500 }
      );
    }

    const { bookId } = await context.params;
    const pathname = decodeURIComponent(bookId);

    if (!isValidBookPath(pathname)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid library material.",
        },
        { status: 400 }
      );
    }

    const thumbnail = await findThumbnail(pathname, token);
    const targets = [pathname];

    if (thumbnail) {
      targets.push(thumbnail.pathname);
    }

    await del(targets, {
      token,
    });

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
      { status: 500 }
    );
  }
}