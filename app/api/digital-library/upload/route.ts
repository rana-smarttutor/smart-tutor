import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadPayload = {
  assetType?: "book" | "thumbnail";
  description?: string;
};

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

function isValidThumbnailPath(pathname: string): boolean {
  return (
    pathname.length <= 600 &&
    /^digital-library\/thumbnails\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/i.test(
      pathname,
    )
  );
}

function fail(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return fail(
        "Only admins and educators can upload library materials.",
        403,
      );
    }

    // Client uploads to Vercel Blob are retained
    // temporarily for legacy thumbnail support.
    //
    // All PDF uploads through this route are
    // disabled during the Cloudflare R2 migration.
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return fail("Library thumbnail storage is not configured.", 503);
    }

    const body = (await request.json()) as HandleUploadBody;

    const response = await handleUpload({
      request,
      body,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload: UploadPayload = {};

        try {
          payload = clientPayload
            ? (JSON.parse(clientPayload) as UploadPayload)
            : {};
        } catch {
          throw new Error("Invalid upload information.");
        }

        if (
          payload.assetType === "book" ||
          pathname.toLowerCase().endsWith(".pdf")
        ) {
          throw new Error(
            "Digital Library PDF uploads are paused during Cloudflare R2 migration.",
          );
        }

        if (
          payload.assetType !== "thumbnail" ||
          !isValidThumbnailPath(pathname)
        ) {
          throw new Error(
            "Only valid library thumbnail uploads are supported.",
          );
        }

        return {
          access: "public",
          addRandomSuffix: false,

          allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],

          maximumSizeInBytes: MAX_THUMBNAIL_BYTES,

          tokenPayload: JSON.stringify({
            assetType: "thumbnail",
            pathname,
          }),
        };
      },

      onUploadCompleted: async () => {
        // This callback does not create or
        // modify MongoDB book records.
      },
    });

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      "Library upload API error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail(
      error instanceof Error
        ? error.message
        : "Unable to prepare library upload.",
      400,
    );
  }
}
