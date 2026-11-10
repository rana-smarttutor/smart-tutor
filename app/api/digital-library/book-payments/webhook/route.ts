import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";
import {
  getLibraryBookPurchaseCollection,
  prepareLibraryBookPurchaseIndexes,
} from "@/lib/library-book-purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookOrder = {
  studentId: string;
  bookPathname: string;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: "pending" | "paid" | "failed" | "review_required";
  createdAt: Date;
  updatedAt: Date;
};

type Payment = {
  id: string;
  order_id: string;
  status: string;
  captured?: boolean;
  amount: number;
  currency: string;
  created_at: number;
};

function reply(message: string, status = 200) {
  return NextResponse.json(
    { success: status < 400, message },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export async function POST(request: Request) {
  try {
    if (
      process.env.LIBRARY_BOOK_TEST_PAYMENTS_ENABLED !== "true"
    ) {
      return reply("Book payment processing disabled.", 503);
    }

    const webhookSecret =
      process.env.RAZORPAY_LIBRARY_BOOK_WEBHOOK_SECRET;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      !webhookSecret ||
      !keyId?.startsWith("rzp_test_") ||
      !keySecret
    ) {
      return reply("Webhook configuration incomplete.", 503);
    }

    const signature =
      request.headers.get("x-razorpay-signature") || "";

    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return reply("Invalid signature.", 401);
    }

    const rawBody = await request.text();

    const expected = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest();

    const received = Buffer.from(signature, "hex");

    if (
      received.length !== expected.length ||
      !timingSafeEqual(expected, received)
    ) {
      return reply("Invalid webhook signature.", 401);
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "payment.captured") {
      return reply("Event ignored.");
    }

    const entity = event.payload?.payment?.entity;

    const paymentId = String(entity?.id || "");
    const orderId = String(entity?.order_id || "");

    if (
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^order_[a-zA-Z0-9]+$/.test(orderId)
    ) {
      return reply("Invalid payment event.", 400);
    }

    const db = await getMongoDatabase();

    const orders = db.collection<BookOrder>(
      "digital_library_book_payment_orders",
    );

    const order = await orders.findOne({
      razorpayOrderId: orderId,
    });

    // This endpoint processes only individual-book orders.
    if (!order) {
      return reply("Unrelated Razorpay order ignored.");
    }

    if (
      order.amountPaise !== 4900 ||
      order.currency !== "INR" ||
      !order.studentId ||
      !order.bookPathname
    ) {
      return reply("Local order mismatch.", 409);
    }

    // Independently confirm the captured payment.
    const authorization = Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString("base64");

    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${authorization}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!paymentResponse.ok) {
      return reply("Payment confirmation unavailable.", 503);
    }

    const payment =
      (await paymentResponse.json()) as Payment;

    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.amount !== 4900 ||
      payment.currency !== "INR" ||
      !Number.isSafeInteger(payment.created_at) ||
      payment.created_at <= 0
    ) {
      return reply("Captured payment mismatch.", 409);
    }

    await prepareLibraryBookPurchaseIndexes();

    const purchases = await getLibraryBookPurchaseCollection();

    const existing = await purchases.findOne({
      studentId: order.studentId,
      bookPathname: order.bookPathname,
    });

    if (existing) {
      if (
        existing.razorpayOrderId !== orderId ||
        existing.razorpayPaymentId !== paymentId
      ) {
        // A second captured payment for the same book
        // must be reviewed rather than silently consumed.
        await orders.updateOne(
          { razorpayOrderId: orderId },
          {
            $set: {
              status: "review_required",
              razorpayPaymentId: paymentId,
              updatedAt: new Date(),
            },
          },
        );

        console.error(
          "Duplicate captured library book payment requires review:",
          orderId,
        );

        return reply("Duplicate payment recorded for review.");
      }
    } else {
      const now = new Date();

      try {
        await purchases.insertOne({
          studentId: order.studentId,
          bookPathname: order.bookPathname,
          amountPaise: 4900,
          currency: "INR",
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          status: "paid",
          purchasedAt: new Date(payment.created_at * 1000),
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        // Another verified callback may have inserted
        // the same purchase simultaneously.
        const concurrent = await purchases.findOne({
          studentId: order.studentId,
          bookPathname: order.bookPathname,
        });

        if (
          concurrent?.razorpayOrderId !== orderId ||
          concurrent?.razorpayPaymentId !== paymentId ||
          concurrent?.status !== "paid"
        ) {
          throw error;
        }
      }
    }

    await orders.updateOne(
      {
        razorpayOrderId: orderId,
        $or: [
          { status: "pending" },
          {
            status: "paid",
            razorpayPaymentId: paymentId,
          },
        ],
      },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: paymentId,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Book payment processed.",
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error(
      "Book payment webhook error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // Non-2xx response allows Razorpay to retry.
    return reply("Webhook processing failed.", 503);
  }
}