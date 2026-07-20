import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_EXTENSIONS =
  /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|png|jpg|jpeg|webp|txt)$/i;

function safeFileName(fileName: string) {
  const extension =
    fileName.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "";

  const baseName = fileName
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80);

  return `${baseName || "homework-document"}${extension.toLowerCase()}`;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Login is required.",
        },
        { status: 401 },
      );
    }

    if (session.role !== "educator") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only faculty members can upload homework documents.",
        },
        { status: 403 },
      );
    }

    const token =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Homework document storage is not configured.",
        },
        { status: 500 },
      );
    }

    const formData =
      await request.formData();

    const uploadedFile =
      formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Choose a homework document to upload.",
        },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_EXTENSIONS.test(
        uploadedFile.name,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Upload a PDF, Word, PowerPoint, Excel, image, or text file.",
        },
        { status: 400 },
      );
    }

    if (
      uploadedFile.size <= 0 ||
      uploadedFile.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
error:
  "The homework document must be 4 MB or smaller.",
        },
        { status: 400 },
      );
    }

    const fileName =
      safeFileName(uploadedFile.name);

    const pathname =
      `homework-attachments/${session.id}/${Date.now()}-${fileName}`;

    const blob = await put(
      pathname,
      uploadedFile,
      {
        access: "public",
        addRandomSuffix: true,
        token,
      },
    );

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      fileName: uploadedFile.name,
    });
  } catch (error) {
    console.error(
      "Faculty homework document upload error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the homework document.",
      },
      { status: 500 },
    );
  }
}