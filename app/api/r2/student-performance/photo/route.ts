import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import { getR2AssetKey } from "@/lib/r2-asset-storage";
import { createPrivateR2FileResponse } from "@/lib/r2-asset-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHOTO_PATTERN =
  /^(?:student-performance\/photos\/[a-zA-Z0-9_-]+|signup\/photo\/[a-f0-9-]{36})\.(png|jpg|jpeg|webp)$/i;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function getContentType(pathname: string): string {
  const extension = pathname.split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";

  return "image/jpeg";
}

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getSessionUser();

    if (!session) {
      return fail("Login required.", 401);
    }

    const role = String(session.role || "").toLowerCase();

    if (
      (role !== "admin" && role !== "educator") ||
      (session.status && session.status !== "active") ||
      session.verified === false
    ) {
      return fail("Access denied.", 403);
    }

    const url = new URL(request.url);

    const pathname = String(
      url.searchParams.get("pathname") || "",
    ).trim();

    if (
      pathname.length > 500 ||
      !PHOTO_PATTERN.test(pathname)
    ) {
      return fail("Invalid photo pathname.", 400);
    }

    const expectedUrl =
      `/api/r2/student-performance/photo?pathname=${encodeURIComponent(pathname)}`;

    const db = await getMongoDatabase();

    const savedReport = await db.collection("performanceReports").findOne(
      { "student.photo": expectedUrl },
      { projection: { _id: 1 } },
    );

    if (!savedReport) {
      return fail("Photo not found.", 404);
    }

    const key = getR2AssetKey(pathname);

    return await createPrivateR2FileResponse({
      key,
      contentType: getContentType(pathname),
      maxBytes: MAX_PHOTO_BYTES,
      disposition: "inline",
    });
  } catch (error) {
    const status = (
      error as {
        $metadata?: {
          httpStatusCode?: number;
        };
      }
    )?.$metadata?.httpStatusCode;

    if (status === 404) {
      return fail("Photo not found.", 404);
    }

    console.error(
      "R2 student photo access error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to retrieve photo.", 500);
  }
}