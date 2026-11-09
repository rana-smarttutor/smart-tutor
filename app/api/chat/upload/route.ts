import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { uploadR2Asset } from "@/lib/r2-asset-storage";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 20MB limit." },
        { status: 413 },
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `chat-uploads/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const useR2 = process.env.R2_CHAT_UPLOADS === "true";
    let url: string;

    if (useR2) {
      if (!/^[a-zA-Z0-9]+$/.test(ext)) {
        return NextResponse.json(
          { error: "Invalid attachment extension." },
          { status: 400 },
        );
      }

      const uploaded = await uploadR2Asset(fileName, file);
      url = `/api/r2/chat/file?pathname=${encodeURIComponent(uploaded.pathname)}`;
    } else {
      const blob = await put(fileName, file, {
        access: "public",
        contentType: file.type,
      });
      url = blob.url;
    }

    return NextResponse.json({
      url,
      name: file.name,
      type: file.type,
      size: file.size,
      messageId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "File upload failed." },
      { status: 500 },
    );
  }
}
