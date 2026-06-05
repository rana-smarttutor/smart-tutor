import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getExtension(fileName: string, contentType: string) {
  const extensionFromName = fileName.split(".").pop()?.toLowerCase();

  if (
    extensionFromName &&
    ["png", "jpg", "jpeg", "webp"].includes(extensionFromName)
  ) {
    return extensionFromName === "jpeg" ? "jpg" : extensionFromName;
  }

  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";

  return "";
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const role = String(session.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admin and educator users can upload student photos.",
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No photo file was uploaded.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Student photo must be smaller than 2 MB.",
        },
        { status: 400 },
      );
    }

    const validTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only PNG, JPG and WEBP images are allowed.",
        },
        { status: 400 },
      );
    }

    const extension = getExtension(file.name, file.type);

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid photo file extension.",
        },
        { status: 400 },
      );
    }

    const blobPath = `student-performance/photos/${randomUUID()}.${extension}`;

    const blob = await put(blobPath, file, {
      access: "public",
      token,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Student photo upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload student photo.",
      },
      { status: 500 },
    );
  }
}