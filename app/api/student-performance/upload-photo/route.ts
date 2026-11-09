import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { getSessionUser } from "@/lib/auth";
import { uploadR2Asset } from "@/lib/r2-asset-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return fail("Unauthorized.", 401);
    }

    const role = String(session.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return fail(
        "Only admins and educators can upload student photos.",
        403,
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("No photo file was uploaded.", 400);
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return fail("Student photo must be 2 MB or smaller.", 400);
    }

    const extension = MIME_EXTENSIONS[file.type];

    if (!extension) {
      return fail(
        "Only PNG, JPG and WEBP images are allowed.",
        400,
      );
    }

    const suppliedExtension =
      file.name.split(".").pop()?.toLowerCase();

    const validExtensions =
      file.type === "image/jpeg"
        ? ["jpg", "jpeg"]
        : [extension];

    if (!validExtensions.includes(suppliedExtension || "")) {
      return fail("Invalid photo file extension.", 400);
    }

    const pathname =
      `student-performance/photos/${randomUUID()}.${extension}`;

    // R2 rollout is opt-in. The existing Vercel
    // workflow remains active until explicitly enabled.
    if (process.env.R2_STUDENT_PHOTO_UPLOADS === "true") {
      const uploaded = await uploadR2Asset(pathname, file);

      // No public bucket URL is returned.
      const url =
        `/api/r2/student-performance/photo?pathname=${encodeURIComponent(uploaded.pathname)}`;

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
          },
        },
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return fail("Photo storage is not configured.", 503);
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
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Student Performance photo upload error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to upload student photo.", 500);
  }
}