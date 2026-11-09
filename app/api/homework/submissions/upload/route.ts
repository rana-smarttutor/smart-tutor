import { put } from "@vercel/blob";
import { uploadR2Asset } from "@/lib/r2-asset-storage";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS =
  /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|png|jpg|jpeg|webp|txt)$/i;

function safeFileName(fileName: string) {
  const extension = fileName.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "";
  const baseName = fileName
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80);

  return `${baseName || "homework"}${extension.toLowerCase()}`;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Login is required." },
        { status: 401 },
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          error: "Only students can upload homework submissions.",
        },
        { status: 403 },
      );
    }

    const useR2 = process.env.R2_HOMEWORK_UPLOADS === "true";
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!useR2 && !token) {
      return NextResponse.json(
        {
          success: false,
          error: "Homework file storage is not configured.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Choose a homework file to upload." },
        { status: 400 },
      );
    }

    if (!ALLOWED_EXTENSIONS.test(uploadedFile.name)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Upload a PDF, Word, PowerPoint, Excel, image, or text file.",
        },
        { status: 400 },
      );
    }

    if (uploadedFile.size <= 0 || uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "The homework file must be 10 MB or smaller.",
        },
        { status: 400 },
      );
    }

    const fileName = safeFileName(uploadedFile.name);
    const pathname = `homework-submissions/${session.id}/${Date.now()}-${fileName}`;

    let url: string;
    let storedPathname: string;

    if (useR2) {
      const uploaded = await uploadR2Asset(pathname, uploadedFile);
      storedPathname = uploaded.pathname;
      url = `/api/r2/homework/file?pathname=${encodeURIComponent(storedPathname)}`;
    } else {
      const blob = await put(pathname, uploadedFile, {
        access: "public",
        addRandomSuffix: true,
        token,
      });
      url = blob.url;
      storedPathname = blob.pathname;
    }

    return NextResponse.json({
      success: true,
      url,
      pathname: storedPathname,
      fileName: uploadedFile.name,
      storageProvider: useR2 ? "r2" : "vercel",
    });
  } catch (error) {
    console.error("Homework submission upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload homework file.",
      },
      { status: 500 },
    );
  }
}