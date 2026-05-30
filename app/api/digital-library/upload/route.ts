import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeBookName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
}

function getExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) return "";

  return name.slice(dotIndex).toLowerCase();
}

function normalizeStoredPrice(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits || Number(digits) <= 0) {
    return "free";
  }

  return String(Number(digits));
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "student").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can upload library materials.",
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

    const formData = await request.formData();

    const title = String(formData.get("title") || "").trim();
    const price = String(formData.get("price") || "").trim();
    const file = formData.get("file") as File | null;
    const thumbnail = formData.get("thumbnail") as File | null;

    if (!title || !file || !thumbnail || price === "") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Book name, PDF upload, thumbnail upload and price are required.",
        },
        { status: 400 }
      );
    }

    const validPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!validPdf) {
      return NextResponse.json(
        {
          success: false,
          message: "Book upload must be a PDF file.",
        },
        { status: 400 }
      );
    }

    const thumbnailExtension = getExtension(thumbnail.name);

    const validThumbnail =
      [".png", ".jpg", ".jpeg", ".webp"].includes(thumbnailExtension) &&
      (/^image\/(png|jpeg|webp)$/.test(thumbnail.type) ||
        thumbnail.type === "");

    if (!validThumbnail) {
      return NextResponse.json(
        {
          success: false,
          message: "Thumbnail must be PNG, JPG or WEBP.",
        },
        { status: 400 }
      );
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

    const id = Date.now().toString();
    const storedPrice = normalizeStoredPrice(price);
    const assetKey = `${id}__${storedPrice}__${safeTitle}`;

    const bookBlob = await put(
      `digital-library/books/${assetKey}.pdf`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
        token,
      }
    );

    const thumbnailBlob = await put(
      `digital-library/thumbnails/${assetKey}${thumbnailExtension}`,
      thumbnail,
      {
        access: "public",
        addRandomSuffix: false,
        token,
      }
    );

    return NextResponse.json({
      success: true,
      book: {
        title,
        price:
          storedPrice === "free"
            ? "Free"
            : `₹${Number(storedPrice).toLocaleString("en-IN")}`,
        fileName: `${safeTitle}.pdf`,
        pathname: bookBlob.pathname,
        url: bookBlob.url,
        downloadUrl: bookBlob.downloadUrl || bookBlob.url,
        thumbnailUrl: thumbnailBlob.url,
      },
    });
  } catch (error) {
    console.error("Digital library upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload material.",
      },
      { status: 500 }
    );
  }
}