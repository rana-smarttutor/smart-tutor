import { del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    bookId: string;
  }>;
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
  if (!pathname.startsWith("digital-library/books/")) {
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

    const valid =
      (oldPathname.startsWith("digital-library/books/") &&
        oldPathname.toLowerCase().endsWith(".pdf")) ||
      /^digital-library\/[^/]+\.pdf$/i.test(oldPathname);

    if (!valid) {
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

    const formData = await request.formData();

    const title = String(formData.get("title") || "").trim();
    const price = String(formData.get("price") || "0").trim();

    const pdfValue = formData.get("file");
    const thumbnailValue = formData.get("thumbnail");

    const newPdf =
      pdfValue instanceof File && pdfValue.size > 0
        ? pdfValue
        : null;

    const newThumbnail =
      thumbnailValue instanceof File && thumbnailValue.size > 0
        ? thumbnailValue
        : null;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Book name is required.",
        },
        { status: 400 }
      );
    }

    if (
      newPdf &&
      newPdf.type !== "application/pdf" &&
      !newPdf.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Book upload must be a PDF file.",
        },
        { status: 400 }
      );
    }

    if (newThumbnail) {
      const ext = getExtension(newThumbnail.name);

      if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
        return NextResponse.json(
          {
            success: false,
            message: "Thumbnail must be PNG, JPG or WEBP.",
          },
          { status: 400 }
        );
      }
    }

    const safeTitle = safeBookName(title);

    if (!safeTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid book name.",
        },
        { status: 400 }
      );
    }

    const storedPrice = normalizeStoredPrice(price);
    const key = `${Date.now()}__${storedPrice}__${safeTitle}`;

    let pdfBody: Blob | File;

    if (newPdf) {
      pdfBody = newPdf;
    } else {
      const pdfResponse = await fetch(currentBook.url);

      if (!pdfResponse.ok) {
        throw new Error("Unable to retrieve current PDF.");
      }

      pdfBody = await pdfResponse.blob();
    }

    const newBook = await put(
      `digital-library/books/${key}.pdf`,
      pdfBody,
      {
        access: "public",
        addRandomSuffix: false,
        token,
      }
    );

    let thumbnailUrl: string | undefined;

    if (newThumbnail) {
      const thumb = await put(
        `digital-library/thumbnails/${key}${getExtension(
          newThumbnail.name
        )}`,
        newThumbnail,
        {
          access: "public",
          addRandomSuffix: false,
          token,
        }
      );

      thumbnailUrl = thumb.url;
    } else if (currentThumbnail) {
      const response = await fetch(currentThumbnail.url);

      if (response.ok) {
        const body = await response.blob();
        const ext = getExtension(currentThumbnail.pathname) || ".png";

        const thumb = await put(
          `digital-library/thumbnails/${key}${ext}`,
          body,
          {
            access: "public",
            addRandomSuffix: false,
            token,
          }
        );

        thumbnailUrl = thumb.url;
      }
    }

    const removeTargets = [oldPathname];

    if (currentThumbnail) {
      removeTargets.push(currentThumbnail.pathname);
    }

    await del(removeTargets, {
      token,
    });

    return NextResponse.json({
      success: true,
      book: {
        title,
        price:
          storedPrice === "free"
            ? "Free"
            : `₹${Number(storedPrice).toLocaleString("en-IN")}`,
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

    const valid =
      (pathname.startsWith("digital-library/books/") &&
        pathname.toLowerCase().endsWith(".pdf")) ||
      /^digital-library\/[^/]+\.pdf$/i.test(pathname);

    if (!valid) {
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