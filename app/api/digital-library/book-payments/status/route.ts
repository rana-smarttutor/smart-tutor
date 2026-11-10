import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { findLibraryBook } from "@/lib/library-book-repository";
import {
  getLibraryBookPricePaise,
  isPaidLibraryBook,
} from "@/lib/library-book-pricing";
import { hasPurchasedLibraryBook } from "@/lib/library-book-purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  try {
    const pathname = String(
      new URL(request.url).searchParams.get("pathname") || "",
    ).trim();

    if (
      pathname.length > 500 ||
      !/^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(pathname)
    ) {
      return respond(
        { success: false, message: "Invalid book reference." },
        400,
      );
    }

    const book = await findLibraryBook(pathname);

    if (!book) {
      return respond({ success: false, message: "Book not found." }, 404);
    }

    const paid = isPaidLibraryBook(book.categoryId);
    const pricePaise = getLibraryBookPricePaise(book.categoryId);

    const session = await getSessionUser();
    const role = String(session?.role || "guest").toLowerCase();
    const canManage = role === "admin" || role === "educator";
    const isStudent = role === "student";

    const purchased =
      paid && isStudent && session
        ? await hasPurchasedLibraryBook(String(session.id), pathname)
        : false;

    return respond({
      success: true,
      pathname: book.pathname,
      pricePaise,
      currency: "INR",
      isPaid: paid,
      isLoggedIn: Boolean(session),
      canManage,
      purchased,
      hasAccess: Boolean(session) && (!paid || canManage || purchased),
    });
  } catch (error) {
    console.error(
      "Book purchase status error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond(
      {
        success: false,
        message: "Unable to check book access.",
      },
      500,
    );
  }
}
