import "server-only";

import { getR2Asset } from "@/lib/r2-asset-storage";

export type R2FileResponseOptions = {
  key: string;
  contentType: string;
  maxBytes: number;
  disposition?: "inline" | "attachment";
};

export async function createPrivateR2FileResponse({
  key,
  contentType,
  maxBytes,
  disposition = "inline",
}: R2FileResponseOptions): Promise<Response> {
  const object = await getR2Asset(key);

  if (!object.Body) {
    return new Response("File not found.", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const length = object.ContentLength;

  if (
    typeof length !== "number" ||
    !Number.isSafeInteger(length) ||
    length <= 0 ||
    length > maxBytes
  ) {
    return new Response("Invalid file size.", {
      status: 413,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // Read with a strict size limit, including when R2
  // returns an unexpected body length.
  const chunks: Uint8Array[] = [];
  let total = 0;

  for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
    total += chunk.byteLength;

    if (total > maxBytes) {
      return new Response("File exceeds the allowed size.", {
        status: 413,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    chunks.push(chunk);
  }

  if (total !== length) {
    return new Response("Incomplete file.", {
      status: 502,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const bytes = Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    total,
  );

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      "Content-Disposition":
        `${disposition}; filename="smartiq-file"`,
      "Cache-Control": "private, no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}