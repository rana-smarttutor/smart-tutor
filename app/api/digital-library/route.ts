import { NextRequest, NextResponse } from "next/server";
import { Storage } from "megajs";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { 
  getLibraryBooksForRole, 
  createLibraryBook, 
  deleteLibraryBook 
} from "@/lib/data-store";
import { Role } from "@/lib/types";

export const runtime = "nodejs";

async function getMegaStorage() {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    throw new Error("Mega.nz credentials missing in environment variables.");
  }

  return new Storage({ email, password }).ready;
}

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

    const storage = await getMegaStorage();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const megaFile = await storage.upload(file.name, buffer).complete;
    const link = await megaFile.link({});

    const book = await createLibraryBook({
      title,
      author: author || "Unknown",
      category: category || "General",
      description: description || "",
      megaFileId: megaFile.nodeId || "",
      megaFileName: file.name,
      megaFileUrl: link,
      audience,
      createdBy: session.name,
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error: any) {
    console.error("Mega.nz upload error:", error);
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
    const book = await deleteLibraryBook(id);

    if (!book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    // Optionally delete from Mega.nz as well
    // const storage = await getMegaStorage();
    // const file = storage.at(book.megaFileId);
    // if (file) await file.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
