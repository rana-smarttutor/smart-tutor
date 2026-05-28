import { list } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCurrentRole() {
  const cookieStore = await cookies();

  const role =
    cookieStore.get("role")?.value ||
    cookieStore.get("userRole")?.value ||
    cookieStore.get("smart_tutors_role")?.value ||
    cookieStore.get("smart-tutors-role")?.value ||
    cookieStore.get("accountRole")?.value ||
    "student";

  return role.toLowerCase();
}

async function isUserLoggedIn() {
  const cookieStore = await cookies();

  return Boolean(
    cookieStore.get("session")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("token")?.value ||
      cookieStore.get("smart_tutors_session")?.value ||
      cookieStore.get("smart-tutors-session")?.value ||
      cookieStore.get("userRole")?.value ||
      cookieStore.get("role")?.value
  );
}

function canManageLibrary(role: string) {
  return ["admin", "educator"].includes(role);
}

function parseBlobName(pathname: string) {
  const rawName = pathname.replace("digital-library/", "");
  const parts = rawName.split("-");

  const maybePrice = parts[1] || "free";
  const hasPricePart = maybePrice === "free" || /^\d+$/.test(maybePrice);

  const rawPrice = hasPricePart ? maybePrice : "free";
  const fileName = hasPricePart
    ? parts.slice(2).join("-") || rawName
    : parts.slice(1).join("-") || rawName;

  const price =
    rawPrice === "free" || Number(rawPrice) <= 0
      ? "Free"
      : `₹${Number(rawPrice).toLocaleString("en-IN")}`;

  const title = fileName.replace(/\.[^/.]+$/, "").replace(/-/g, " ");

  return { fileName, title, price };
}

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "BLOB_READ_WRITE_TOKEN is missing. Add it in .env.local and restart npm run dev.",
          books: [],
        },
        { status: 500 }
      );
    }

    const role = await getCurrentRole();
    const canManage = canManageLibrary(role);
    const loggedIn = await isUserLoggedIn();

    const { blobs } = await list({
      prefix: "digital-library/",
      token,
    });

    const books = blobs
      .filter((blob) => blob.pathname.toLowerCase().endsWith(".pdf"))
      .map((blob) => {
        const parsed = parseBlobName(blob.pathname);

        return {
          id: encodeURIComponent(blob.pathname),
          title: parsed.title,
          price: parsed.price,
          fileName: parsed.fileName,
          pathname: blob.pathname,
          url: blob.url,
          downloadUrl: blob.downloadUrl || blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        };
      });

    return NextResponse.json({
      success: true,
      canManage,
      isLoggedIn: loggedIn,
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