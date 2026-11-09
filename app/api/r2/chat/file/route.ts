import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMessagesForRole } from "@/lib/data-store";
import {
  getR2AssetKey,
  isValidAssetPathname,
} from "@/lib/r2-asset-storage";
import { createPrivateR2FileResponse } from "@/lib/r2-asset-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAT_PATTERN =
  /^chat-uploads\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

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

function contentTypeFor(pathname: string): string {
  const extension = pathname.split(".").pop()?.toLowerCase();

  const types: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    webm: "audio/webm",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    ogg: "audio/ogg",
    pdf: "application/pdf",
    txt: "text/plain",
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
      session.verified === false
    ) {
      return fail("Active account required.", 403);
    }

    const pathname = new URL(request.url)
      .searchParams.get("pathname") || "";

    if (
      !isValidAssetPathname(pathname) ||
      !CHAT_PATTERN.test(pathname)
    ) {
      return fail("Invalid chat attachment.", 400);
    }

    const ownerId = pathname.split("/")[1];

    const url =
      `/api/r2/chat/file?pathname=${encodeURIComponent(pathname)}`;

    const messages = await getMessagesForRole(
      session.role,
      session.id,
    );

    // A file must be referenced in a saved chat message
    // and the current user must be an actual participant.
    const authorised = messages.some(
      (message) =>
        message.channel === "Chat" &&
        Array.isArray(message.userIds) &&
        message.userIds.includes(session.id) &&
        message.userIds.includes(ownerId) &&
        message.body.startsWith("[File: ") &&
        message.body.endsWith(`] ${url}`),
    );

    if (!authorised) {
      return fail("Attachment not found or access denied.", 404);
    }

    return createPrivateR2FileResponse({
      key: getR2AssetKey(pathname),
      contentType: contentTypeFor(pathname),
      maxBytes: 20 * 1024 * 1024,
      disposition:
        /\.(png|jpg|jpeg|webp|gif|mp3|wav|webm|m4a|mp4|ogg)$/i.test(pathname)
          ? "inline"
          : "attachment",
    });
  } catch (error) {
    const status = (
      error as {
        $metadata?: { httpStatusCode?: number };
      }
    )?.$metadata?.httpStatusCode;

    if (status === 404) {
      return fail("Attachment not found.", 404);
    }

    console.error(
      "Private chat attachment error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to retrieve attachment.", 500);
  }
}