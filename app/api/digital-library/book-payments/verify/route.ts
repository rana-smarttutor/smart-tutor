import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  getLibraryBookPurchaseCollection,
  prepareLibraryBookPurchaseIndexes,
} from "@/lib/library-book-purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookPaymentOrder = {
  studentId: string;
  bookPathname: string;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: "pending" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
};

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  created_at: number;
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) return fail("Login required.", 401);

    if (String(session.role).toLowerCase() !== "student") {
      return fail("Students only.", 403);
    }

    if (process.env.LIBRARY_BOOK_TEST_PAYMENTS_ENABLED !== "true") {
      return fail("Book payment verification is disabled.", 503);
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId?.startsWith("rzp_test_") || !keySecret) {
      return fail("Razorpay test configuration missing.", 503);
    }

    const body = await request.json().catch(() => null);

    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");

    if (
      !/^order_[a-zA-Z0-9]+$/.test(orderId) ||
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^[a-fA-F0-9]{64}$/.test(signature)
    ) {
      return fail("Invalid Razorpay payment information.", 400);
    }

    const expected = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest();

    const supplied = Buffer.from(signature, "hex");

    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      return fail("Invalid payment signature.", 400);
    }

    const db = await getMongoDatabase();

    const orders = db.collection<BookPaymentOrder>(
      "digital_library_book_payment_orders",
    );

    const order = await orders.findOne({
      razorpayOrderId: orderId,
      studentId: String(session.id),
    });

    if (!order) return fail("Payment order not found.", 404);

    if (
      order.amountPaise !== 4900 ||
      order.currency !== "INR" ||
      !order.bookPathname
    ) {
      return fail("Payment order information mismatch.", 409);
    }

    if (order.status === "paid") {
      if (order.razorpayPaymentId !== paymentId) {
        return fail("This order was already settled.", 409);
      }

      const purchases = await getLibraryBookPurchaseCollection();

      const owned = await purchases.findOne({
        studentId: order.studentId,
        bookPathname: order.bookPathname,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        status: "paid",
      });

      if (!owned) {
        return fail("Purchase record requires reconciliation.", 409);
      }

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        bookPathname: order.bookPathname,
        message: "Book purchase already verified.",
      });
    }

    if (order.status !== "pending") {
      return fail("This order cannot be completed.", 409);
    }

    // Verify with Razorpay directly, never trust client data.
    const authorization = Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString("base64");

    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${authorization}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      return fail("Razorpay payment confirmation unavailable.", 502);
    }

    const payment =
      (await response.json()) as RazorpayPayment;

    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.amount !== order.amountPaise ||
      payment.currency !== order.currency ||
      !Number.isSafeInteger(payment.created_at) ||
      payment.created_at <= 0
    ) {
      return fail("Payment has not been confirmed as captured.", 409);
    }

    await prepareLibraryBookPurchaseIndexes();

    const purchases = await getLibraryBookPurchaseCollection();

    const now = new Date();

    // Unique indexes prevent two ownership records for
    // the same student/book or Razorpay payment.
    try {
      await purchases.insertOne({
        studentId: order.studentId,
        bookPathname: order.bookPathname,
        amountPaise: order.amountPaise,
        currency: "INR",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        status: "paid",
        purchasedAt: new Date(payment.created_at * 1000),
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      const existing = await purchases.findOne({
        studentId: order.studentId,
        bookPathname: order.bookPathname,
      });

      // Safe retry for the same captured payment.
      if (
        !existing ||
        existing.razorpayOrderId !== orderId ||
        existing.razorpayPaymentId !== paymentId ||
        existing.status !== "paid"
      ) {
        throw error;
      }
    }

    const update = await orders.updateOne(
      {
        razorpayOrderId: orderId,
        studentId: order.studentId,
        status: "pending",
      },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: paymentId,
          updatedAt: now,
        },
      },
    );

    if (update.modifiedCount === 0) {
      const current = await orders.findOne({
        razorpayOrderId: orderId,
        studentId: order.studentId,
      });

      if (
        current?.status !== "paid" ||
        current.razorpayPaymentId !== paymentId
      ) {
        return fail("Payment record requires reconciliation.", 409);
      }
    }

    return NextResponse.json(
      {
        success: true,
        alreadyProcessed: false,
        bookPathname: order.bookPathname,
        message: "Payment verified. Book ownership activated.",
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Book payment verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail(
      "Unable to verify the book payment. Please do not pay again.",
      500,
    );
  }
}