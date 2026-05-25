import { Storage } from "megajs";

import { getSessionUser } from "@/lib/auth";
import { getLibraryBookById } from "@/lib/data-store";

export const runtime = "nodejs";

async function getMegaStorage() {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    throw new Error("Mega.nz credentials missing in environment variables.");
  }

  return new Storage({ email, password }).ready;
}

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

  if (!book.megaFileId) {
    return new Response("Library file is missing its Mega file id.", { status: 500 });
  }

  try {
    const storage = await getMegaStorage();
    let file = storage.files[book.megaFileId];

    if (!file) {
      await storage.reload(true);
      file = storage.files[book.megaFileId];
    }

    if (!file) {
      return new Response("The requested library file could not be found in Mega.", {
        status: 404,
      });
    }

    const buffer = await file.downloadBuffer({});
    const fileName = book.megaFileName || `${book.title}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": buildContentDisposition(fileName),
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Length": String(buffer.length),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Digital library proxy error:", error);
    return new Response("Failed to load the library PDF.", { status: 500 });
  }
}
