import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import { findLibraryBook } from "@/lib/library-book-repository";
import {
  getLibraryBookPricePaise,
  isPaidLibraryBook,
} from "@/lib/library-book-pricing";
import { hasPurchasedLibraryBook } from "@/lib/library-book-purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookPaymentOrder = {
  studentId: string;
  bookPathname: string;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string;
  status: "pending" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
  razorpayPaymentId?: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) return fail("Please log in.", 401);

    if (String(session.role).toLowerCase() !== "student") {
      return fail("Student access required.", 403);
    }

    // Keep this separate from historical subscription switches.
    if (process.env.LIBRARY_BOOK_TEST_PAYMENTS_ENABLED !== "true") {
      return fail("Book payments are not enabled yet.", 503);
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId?.startsWith("rzp_test_") || !keySecret) {
      return fail("Razorpay test credentials are required.", 503);
    }

    const body = await request.json().catch(() => null);
    const pathname = String(body?.pathname || "").trim();

    if (
      pathname.length > 500 ||
      !/^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(
        pathname,
      )
    ) {
      return fail("Invalid book identifier.", 400);
    }

    const book = await findLibraryBook(pathname);

    if (!book) return fail("Book not found.", 404);

    if (!isPaidLibraryBook(book.categoryId)) {
      return fail("This book is free. No payment is required.", 409);
    }

    const amountPaise = getLibraryBookPricePaise(book.categoryId);

    if (amountPaise !== 4900) {
      return fail("Invalid book price.", 409);
    }

    const alreadyOwned = await hasPurchasedLibraryBook(
      String(session.id),
      pathname,
    );

    if (alreadyOwned) {
      return fail("You have already purchased this book.", 409);
    }

    const db = await getMongoDatabase();

    const orders = db.collection<BookPaymentOrder>(
      "digital_library_book_payment_orders",
    );

    const pendingOrder = await orders.findOne(
      {
        studentId: String(session.id),
        bookPathname: pathname,
        status: "pending",
      },
      { sort: { createdAt: -1 } },
    );

    if (pendingOrder) {
      return fail(
        "An earlier payment for this book is still pending. Please verify it before paying again.",
        409,
      );
    }

    await orders.createIndex(
      { razorpayOrderId: 1 },
      { unique: true, name: "unique_book_payment_order" },
    );

    await orders.createIndex(
      { studentId: 1, bookPathname: 1, createdAt: -1 },
      { name: "student_book_payment_history" },
    );

    const receipt =
      `bk_${randomUUID().replace(/-/g, "").slice(0, 28)}`;

    const authorization = Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString("base64");

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            purpose: "digital_library_book",
            studentId: String(session.id),
            bookPathname: pathname,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      return fail("Unable to create Razorpay order.", 502);
    }

    const razorpayOrder =
      (await response.json()) as RazorpayOrder;

    if (
      !/^order_[a-zA-Z0-9]+$/.test(razorpayOrder.id) ||
      razorpayOrder.amount !== amountPaise ||
      razorpayOrder.currency !== "INR" ||
      razorpayOrder.status !== "created"
    ) {
      return fail("Invalid Razorpay order response.", 502);
    }

    const now = new Date();

    await orders.insertOne({
      studentId: String(session.id),
      bookPathname: pathname,
      amountPaise,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: razorpayOrder.id,
        keyId,
        amount: amountPaise,
        currency: "INR",
        bookPathname: pathname,
        bookTitle: book.title,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error(
      "Book order creation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to prepare book purchase.", 500);
  }
}