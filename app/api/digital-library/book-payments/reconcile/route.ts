import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  getLibraryBookPurchaseCollection,
  prepareLibraryBookPurchaseIndexes,
} from "@/lib/library-book-purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  created_at: number;
};

type RazorpayPayments = {
  items?: RazorpayPayment[];
};

function respond(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return respond(
        { success: false, message: "Login required." },
        401,
      );
    }

    if (String(session.role).toLowerCase() !== "student") {
      return respond(
        { success: false, message: "Students only." },
        403,
      );
    }

    if (
      process.env.LIBRARY_BOOK_TEST_PAYMENTS_ENABLED !== "true"
    ) {
      return respond(
        { success: false, message: "Book payment recovery disabled." },
        503,
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId?.startsWith("rzp_test_") || !keySecret) {
      return respond(
        { success: false, message: "Test payment configuration missing." },
        503,
      );
    }

    const db = await getMongoDatabase();

    const orders = db.collection<BookOrder>(
      "digital_library_book_payment_orders",
    );

    const studentId = String(session.id);

    const pendingOrders = await orders
      .find({
        studentId,
        status: "pending",
      })
      .sort({ createdAt: 1 })
      .limit(10)
      .toArray();

    if (pendingOrders.length === 0) {
      return respond({
        success: true,
        checked: 0,
        recovered: 0,
        alreadyProcessed: 0,
        reviewRequired: 0,
        unresolved: 0,
        message: "No pending book payments.",
      });
    }

    const authorization = Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString("base64");

    let recovered = 0;
    let alreadyProcessed = 0;
    let reviewRequired = 0;
    let unresolved = 0;

    await prepareLibraryBookPurchaseIndexes();

    const purchases = await getLibraryBookPurchaseCollection();

    for (const order of pendingOrders) {
      try {
        if (
          !/^order_[a-zA-Z0-9]+$/.test(order.razorpayOrderId) ||
          order.amountPaise !== 4900 ||
          order.currency !== "INR" ||
          !order.bookPathname
        ) {
          unresolved++;
          continue;
        }

        const response = await fetch(
          `https://api.razorpay.com/v1/orders/${encodeURIComponent(
            order.razorpayOrderId,
          )}/payments`,
          {
            headers: {
              Authorization: `Basic ${authorization}`,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          unresolved++;
          continue;
        }

        const data =
          (await response.json()) as RazorpayPayments;

        const captured = (data.items || []).filter(
          (payment) =>
            /^pay_[a-zA-Z0-9]+$/.test(payment.id) &&
            payment.order_id === order.razorpayOrderId &&
            payment.status === "captured" &&
            payment.captured === true &&
            payment.amount === 4900 &&
            payment.currency === "INR" &&
            Number.isSafeInteger(payment.created_at) &&
            payment.created_at > 0,
        );

        if (captured.length === 0) {
          unresolved++;
          continue;
        }

        if (captured.length !== 1) {
          await orders.updateOne(
            {
              razorpayOrderId: order.razorpayOrderId,
              status: "pending",
            },
            {
              $set: {
                status: "review_required",
                updatedAt: new Date(),
              },
            },
          );

          reviewRequired++;
          continue;
        }

        const payment = captured[0];

        const existing = await purchases.findOne({
          studentId,
          bookPathname: order.bookPathname,
        });

        if (existing) {
          if (
            existing.razorpayOrderId !== order.razorpayOrderId ||
            existing.razorpayPaymentId !== payment.id ||
            existing.status !== "paid"
          ) {
            await orders.updateOne(
              {
                razorpayOrderId: order.razorpayOrderId,
                status: "pending",
              },
              {
                $set: {
                  status: "review_required",
                  razorpayPaymentId: payment.id,
                  updatedAt: new Date(),
                },
              },
            );

            reviewRequired++;
            continue;
          }

          alreadyProcessed++;
        } else {
          const now = new Date();

          try {
            await purchases.insertOne({
              studentId,
              bookPathname: order.bookPathname,
              amountPaise: 4900,
              currency: "INR",
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: payment.id,
              status: "paid",
              purchasedAt: new Date(payment.created_at * 1000),
              createdAt: now,
              updatedAt: now,
            });

            recovered++;
          } catch (error) {
            const concurrent = await purchases.findOne({
              studentId,
              bookPathname: order.bookPathname,
            });

            if (
              concurrent?.razorpayOrderId !== order.razorpayOrderId ||
              concurrent?.razorpayPaymentId !== payment.id ||
              concurrent?.status !== "paid"
            ) {
              throw error;
            }

            alreadyProcessed++;
          }
        }

        await orders.updateOne(
          {
            razorpayOrderId: order.razorpayOrderId,
            studentId,
            status: "pending",
          },
          {
            $set: {
              status: "paid",
              razorpayPaymentId: payment.id,
              updatedAt: new Date(),
            },
          },
        );
      } catch (error) {
        console.error(
          "Book payment reconciliation error:",
          error instanceof Error ? error.message : "Unknown error",
        );

        unresolved++;
      }
    }

    return respond({
      success: true,
      checked: pendingOrders.length,
      recovered,
      alreadyProcessed,
      reviewRequired,
      unresolved,
      message:
        unresolved > 0 || reviewRequired > 0
          ? "Some book payments still require verification or review."
          : "Book payment recovery completed.",
    });
  } catch (error) {
    console.error(
      "Book payment recovery failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond(
      {
        success: false,
        message: "Unable to recover book payments.",
      },
      500,
    );
  }
}