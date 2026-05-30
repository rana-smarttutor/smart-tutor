import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function displayPrice(rawPrice: string) {
  if (rawPrice === "free" || Number(rawPrice) <= 0) {
    return "Free";
  }

  return `₹${Number(rawPrice).toLocaleString("en-IN")}`;
}

function parseNewBookPath(pathname: string) {
  const value = pathname
    .replace("digital-library/books/", "")
    .replace(/\.pdf$/i, "");

  const [id, rawPrice = "free", ...titleParts] = value.split("__");
  const storedTitle = titleParts.join("__");

  return {
    thumbnailKey: `${id}__${rawPrice}__${storedTitle}`,
    title: storedTitle.replace(/-/g, " "),
    fileName: `${storedTitle}.pdf`,
    price: displayPrice(rawPrice),
  };
}

function parseOldBookPath(pathname: string) {
  const rawName = pathname.replace("digital-library/", "");
  const parts = rawName.split("-");

  const possibleTimestamp = parts[0] || "";
  const hasTimestamp = /^\d{10,}$/.test(possibleTimestamp);

  const possiblePrice = hasTimestamp ? parts[1] || "free" : "free";
  const hasPrice =
    possiblePrice === "free" || /^\d+$/.test(possiblePrice);

  const fileName =
    hasTimestamp && hasPrice
      ? parts.slice(2).join("-") || rawName
      : hasTimestamp
      ? parts.slice(1).join("-") || rawName
      : rawName;

  return {
    title: fileName.replace(/\.[^/.]+$/, "").replace(/-/g, " "),
    fileName,
    price: hasTimestamp && hasPrice ? displayPrice(possiblePrice) : "Free",
  };
}

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "BLOB_READ_WRITE_TOKEN is missing.",
          books: [],
        },
        { status: 500 }
      );
    }

    const session = await getSessionUser();

    const role = String(session?.role || "student").toLowerCase();
    const canManage = role === "admin" || role === "educator";
    const isLoggedIn = Boolean(session);
    const canAccessPdf = canManage || isLoggedIn;

    const { blobs } = await list({
      prefix: "digital-library/",
      token,
    });

    const thumbnailMap = new Map(
      blobs
        .filter((blob) =>
          blob.pathname.startsWith("digital-library/thumbnails/")
        )
        .map((blob) => {
          const thumbnailKey = blob.pathname
            .replace("digital-library/thumbnails/", "")
            .replace(/\.(png|jpg|jpeg|webp)$/i, "");

          return [thumbnailKey, blob.url];
        })
    );

    const newBooks = blobs
      .filter(
        (blob) =>
          blob.pathname.startsWith("digital-library/books/") &&
          blob.pathname.toLowerCase().endsWith(".pdf")
      )
      .map((blob) => {
        const parsed = parseNewBookPath(blob.pathname);

        return {
          id: encodeURIComponent(blob.pathname),
          title: parsed.title,
          price: parsed.price,
          fileName: parsed.fileName,
          pathname: blob.pathname,
          url: canAccessPdf ? blob.url : undefined,
          downloadUrl: canAccessPdf
            ? blob.downloadUrl || blob.url
            : undefined,
          thumbnailUrl: thumbnailMap.get(parsed.thumbnailKey),
          uploadedAt: blob.uploadedAt,
        };
      });

    const oldBooks = blobs
      .filter((blob) => /^digital-library\/[^/]+\.pdf$/i.test(blob.pathname))
      .map((blob) => {
        const parsed = parseOldBookPath(blob.pathname);

        return {
          id: encodeURIComponent(blob.pathname),
          title: parsed.title,
          price: parsed.price,
          fileName: parsed.fileName,
          pathname: blob.pathname,
          url: canAccessPdf ? blob.url : undefined,
          downloadUrl: canAccessPdf
            ? blob.downloadUrl || blob.url
            : undefined,
          thumbnailUrl: undefined,
          uploadedAt: blob.uploadedAt,
        };
      });

    const books = [...newBooks, ...oldBooks].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() -
        new Date(a.uploadedAt).getTime()
    );

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
      { status: 500 }
    );
  }
}