import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getDigitalLibraryBooks } from "@/lib/digital-library-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "student").toLowerCase();
    const canManage = role === "admin" || role === "educator";
    const isLoggedIn = Boolean(session);
    const canAccessPdf = canManage || isLoggedIn;

    const books = await getDigitalLibraryBooks(canAccessPdf);

    return NextResponse.json({
      success: true,
      canManage,
      isLoggedIn,
      role,
      books,
    });
  } catch (error) {
    console.error("Digital library list error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load digital library.",
        books: [],
      },
      { status: 500 },
    );
  }
}