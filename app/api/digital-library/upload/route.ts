import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

function getExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.slice(lastDot).toLowerCase();
}

function removeExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return fileName;
  return fileName.slice(0, lastDot);
}

function normalizePriceForStorage(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits || Number(digits) <= 0) return "free";
  return String(Number(digits));
}

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

function canManageLibrary(role: string) {
  return ["admin", "educator"].includes(role);
}

export async function POST(request: Request) {
  try {
    const role = await getCurrentRole();

    if (!canManageLibrary(role)) {
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
          message:
            "BLOB_READ_WRITE_TOKEN is missing. Add it in .env.local and restart npm run dev.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") || "").trim();
    const price = String(formData.get("price") || "").trim();

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file uploaded.",
        },
        { status: 400 }
      );
    }

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF files are allowed in the digital library.",
        },
        { status: 400 }
      );
    }

    const originalExtension = getExtension(file.name) || ".pdf";
    const originalNameWithoutExtension = removeExtension(file.name);
    const baseName = safeFileName(title || originalNameWithoutExtension);

    if (!baseName) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file name.",
        },
        { status: 400 }
      );
    }

    const priceForStorage = normalizePriceForStorage(price);
    const finalFileName = `${baseName}${originalExtension}`;
    const pathname = `digital-library/${Date.now()}-${priceForStorage}-${finalFileName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      token,
    });

    return NextResponse.json({
      success: true,
      book: {
        title: title || originalNameWithoutExtension,
        price:
          priceForStorage === "free"
            ? "Free"
            : `₹${Number(priceForStorage).toLocaleString("en-IN")}`,
        fileName: finalFileName,
        originalFileName: file.name,
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl || blob.url,
        contentType: file.type,
      },
    });
  } catch (error) {
    console.error("Digital library upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to upload file.",
      },
      { status: 500 }
    );
  }
}