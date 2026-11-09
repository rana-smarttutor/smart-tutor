import { put } from "@vercel/blob";
import { uploadR2Asset } from "@/lib/r2-asset-storage";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type SignupUploadField = "photo" | "photoId" | "cv";

const ALLOWED_FIELDS = new Set<string>([
  "photo",
  "photoId",
  "cv",
]);

const MIME_EXTENSIONS: Record<string, string[]> = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
};

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const rawField = formData.get("field");

    const field =
      typeof rawField === "string"
        ? rawField
        : "photo";

    if (!ALLOWED_FIELDS.has(field)) {
      return fail("Invalid upload field.", 400);
    }

    const uploadField = field as SignupUploadField;

    if (!(file instanceof File)) {
      return fail("No file was uploaded.", 400);
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return fail(
        "File must be non-empty and no larger than 5 MB.",
        400,
      );
    }

    const permittedTypes =
      uploadField === "cv" ? CV_TYPES : IMAGE_TYPES;

    if (!permittedTypes.has(file.type)) {
      return fail(
        uploadField === "cv"
          ? "Only PDF, DOC and DOCX files are allowed."
          : "Only PNG, JPG and WEBP images are allowed.",
        400,
      );
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !MIME_EXTENSIONS[file.type]?.includes(extension)
    ) {
      return fail(
        "File extension does not match its declared type.",
        400,
      );
    }

    const normalizedExtension =
      extension === "jpeg" ? "jpg" : extension;

    const pathname =
      `signup/${uploadField}/${randomUUID()}.${normalizedExtension}`;

    /*
     * Safe migration boundary:
     *
     * Anonymous registration and authenticated profile uploads
     * currently share this API.
     *
     * Until private R2 file readers, ownership checks and
     * registration-to-user association are implemented,
     * continue using the existing provider.
     *
     * Do not activate R2 here merely by adding an env flag.
     */

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token && process.env.R2_SIGNUP_UPLOADS !== "true") {
      return fail("Upload storage is unavailable.", 503);
    }

    if (process.env.R2_SIGNUP_UPLOADS === "true") {
      const uploaded = await uploadR2Asset(pathname, file);

      const url =
        `/api/r2/signup/file?pathname=${encodeURIComponent(uploaded.pathname)}`;

      return NextResponse.json(
        {
          success: true,
          url,
          pathname: uploaded.pathname,
          storageProvider: "r2",
        },
        {
          headers: {
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    const blob = await put(pathname, file, {
      access: "public",
      token,
      contentType: file.type,
    });

    return NextResponse.json(
      {
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        storageProvider: "vercel",
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Signup upload failure:",
      error instanceof Error
        ? error.name
        : "Unknown error",
    );

    return fail("Failed to upload file.", 500);
  }
}