import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  getR2AssetKey,
  isValidAssetPathname,
} from "@/lib/r2-asset-storage";
import { createPrivateR2FileResponse } from "@/lib/r2-asset-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATH_PATTERN =
  /^signup\/(photo|photoId|cv)\/[a-f0-9-]{36}\.(png|jpg|jpeg|webp|pdf|doc|docx)$/i;

const RESPONSE_PREFIX = "/api/r2/signup/file?pathname=";

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

function fileContentType(pathname: string): string {
  const extension = pathname.split(".").pop()?.toLowerCase();

  const types: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return types[extension || ""] || "application/octet-stream";
}

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getSessionUser();

    if (!session) {
      return fail("Login required.", 401);
    }

    if (
      (session.status && session.status !== "active") ||
      session.deletedAt ||
      (session.role !== "admin" && session.verified === false)
    ) {
      return fail("Access denied.", 403);
    }

    const pathname =
      new URL(request.url).searchParams.get("pathname") || "";

    if (
      pathname.length > 300 ||
      !PATH_PATTERN.test(pathname) ||
      !isValidAssetPathname(pathname)
    ) {
      return fail("Invalid document pathname.", 400);
    }

    const parts = pathname.split("/");
    const field = parts[1];
    const extension = pathname.split(".").pop()?.toLowerCase();

    if (
      (field === "cv" &&
        !["pdf", "doc", "docx"].includes(extension || "")) ||
      (field !== "cv" &&
        !["png", "jpg", "jpeg", "webp"].includes(extension || ""))
    ) {
      return fail("Invalid document type.", 400);
    }

    const storedUrl =
      `${RESPONSE_PREFIX}${encodeURIComponent(pathname)}`;

    const db = await getMongoDatabase();

    // Never grant access merely because someone knows an R2 key.
    // The file must belong to a real, non-deleted MongoDB user.
    const owner = await db.collection("users").findOne(
      {
        deletedAt: { $exists: false },
        $or:
          field === "photo"
            ? [
                { profilePhoto: storedUrl },
                { "profile.profilePhoto": storedUrl },
              ]
            : field === "cv"
              ? [{ "profile.cvUrl": storedUrl }]
              : [
                  { "profile.photoIdFrontUrl": storedUrl },
                  { "profile.photoIdBackUrl": storedUrl },
                ],
      },
      {
        projection: {
          _id: 0,
          id: 1,
          role: 1,
          status: 1,
          verified: 1,
        },
      },
    );

    if (!owner) {
      return fail("Document not found.", 404);
    }

    // CVs and identity documents are owner/admin-only.
    // Profile photos from active, verified accounts may be
    // displayed to other authenticated users.
    // Pending-account documents remain visible to admins.
    const isAdmin = session.role === "admin";
    const isOwner = owner.id === session.id;

    const isVisibleProfilePhoto =
      field === "photo" &&
      owner.verified === true &&
      (!owner.status || owner.status === "active");

    if (!isAdmin && !isOwner && !isVisibleProfilePhoto) {
      return fail("Document not found.", 404);
    }

    const isPhoto = field !== "cv";

    return await createPrivateR2FileResponse({
      key: getR2AssetKey(pathname),
      contentType: fileContentType(pathname),
      maxBytes: 5 * 1024 * 1024,
      disposition: isPhoto ? "inline" : "attachment",
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
      return fail("Document not found.", 404);
    }

    console.error(
      "Private signup document error:",
      error instanceof Error ? error.name : "Unknown error",
    );

    return fail("Unable to retrieve document.", 500);
  }
}