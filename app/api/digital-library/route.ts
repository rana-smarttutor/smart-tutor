import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { 
  getLibraryBooksForRole, 
  createLibraryBook, 
  deleteLibraryBook,
  getLibraryBookById
} from "@/lib/data-store";
import { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const books = await getLibraryBooksForRole(session.role);
    return NextResponse.json({ books });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();

  if (!session || !hasAnyRole(session, ["admin", "educator"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const audience = JSON.parse(formData.get("audience") as string) as Role[];

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required." }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`library/${Date.now()}-${file.name}`, file, {
      access: "public", // Note: access control is handled by our API proxy
    });

    const book = await createLibraryBook({
      title,
      author: author || "Unknown",
      category: category || "General",
      description: description || "",
      storageUrl: blob.url,
      fileName: file.name,
      audience,
      createdBy: session.name,
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error: any) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();

  if (!session || !hasAnyRole(session, ["admin", "educator"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const book = await getLibraryBookById(id);
    
    if (!book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    // Delete from Vercel Blob
    if (book.storageUrl) {
      await del(book.storageUrl);
    }

    await deleteLibraryBook(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
