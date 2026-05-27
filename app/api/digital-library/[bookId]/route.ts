import { getSessionUser } from "@/lib/auth";
import { getLibraryBookById } from "@/lib/data-store";

export const runtime = "nodejs";

function buildContentDisposition(filename: string) {
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ bookId: string }> },
) {
  const session = await getSessionUser();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { bookId } = await context.params;
  const book = await getLibraryBookById(bookId);

  if (!book || !book.audience.includes(session.role)) {
    return new Response("Not found", { status: 404 });
  }

  if (!book.storageUrl) {
    return new Response("Library file is missing its storage URL.", { status: 500 });
  }

  try {
    const response = await fetch(book.storageUrl);

    if (!response.ok) {
      return new Response("Failed to fetch file from storage.", { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const fileName = book.fileName || `${book.title}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": buildContentDisposition(fileName),
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Length": String(buffer.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Digital library proxy error:", error);
    return new Response("Failed to load the library PDF.", { status: 500 });
  }
}
