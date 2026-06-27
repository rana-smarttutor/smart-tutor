import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function getExtension(fileName: string, contentType: string, field: string) {
  if (field === "cv") {
    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
    };

    if (extMap[contentType]) return extMap[contentType];

    const extFromName = fileName.split(".").pop()?.toLowerCase();

    if (extFromName && ["pdf", "doc", "docx"].includes(extFromName))
      return extFromName;

    return "";
  }

  const extFromName = fileName.split(".").pop()?.toLowerCase();

  if (extFromName && ["png", "jpg", "jpeg", "webp"].includes(extFromName)) {
    return extFromName === "jpeg" ? "jpg" : extFromName;
  }

  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";

  return "";
}

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "BLOB_READ_WRITE_TOKEN is missing." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const field = String(formData.get("field") || "photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No file was uploaded." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File must be smaller than 5 MB." },
        { status: 400 },
      );
    }

    if (field === "cv") {
      if (!ALLOWED_CV_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: "Only PDF, DOC, and DOCX files are allowed for CV.",
          },
          { status: 400 },
        );
      }
    } else {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: "Only PNG, JPG and WEBP images are allowed." },
          { status: 400 },
        );
      }
    }

    const extension = getExtension(file.name, file.type, field);

    if (!extension) {
      return NextResponse.json(
        { success: false, message: "Invalid file extension." },
        { status: 400 },
      );
    }

    const blobPath = `signup/${field}/${randomUUID()}.${extension}`;

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
    console.error("Signup file upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload file.",
      },
      { status: 500 },
    );
  }
}
