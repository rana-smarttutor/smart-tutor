import "server-only";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import { findUserById } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ORDERS = 250;

type OrderRecord = {
  studentId?: string;
  bookPathname?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amountPaise?: number;
  currency?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type PurchaseRecord = {
  studentId?: string;
  bookPathname?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amountPaise?: number;
  currency?: string;
  status?: string;
  purchasedAt?: Date | string;
};

type BookRecord = {
  pathname?: string;
  title?: string;
};

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function safeDate(value?: Date | string): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return respond({ success: false, message: "Login required." }, 401);
    }

    if (session.role !== "admin") {
      return respond(
        { success: false, message: "Admin access required." },
        403,
      );
    }

    const db = await getMongoDatabase();

    const orderCollection = db.collection<OrderRecord>(
      "digital_library_book_payment_orders",
    );

    const purchaseCollection = db.collection<PurchaseRecord>(
      "digital_library_book_purchases",
    );

    const bookCollection = db.collection<BookRecord>("digital_library_books");

    const [orders, totalOrders, paidSummary] = await Promise.all([
      orderCollection
        .find({})
        .sort({ createdAt: -1, _id: -1 })
        .limit(MAX_ORDERS)
        .toArray(),

      orderCollection.countDocuments({}),

      purchaseCollection
        .aggregate<{
          _id: null;
          count: number;
          amountPaise: number;
        }>([
          {
            $match: {
              status: "paid",
              currency: "INR",
              amountPaise: 4900,
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amountPaise: { $sum: "$amountPaise" },
            },
          },
        ])
        .toArray(),
    ]);

    const orderIds = [
      ...new Set(
        orders
          .map((order) => order.razorpayOrderId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const pathnames = [
      ...new Set(
        orders
          .map((order) => order.bookPathname)
          .filter((path): path is string => Boolean(path)),
      ),
    ];

    const studentIds = [
      ...new Set(
        orders
          .map((order) => order.studentId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [purchases, books, students] = await Promise.all([
      orderIds.length
        ? purchaseCollection
            .find({
              razorpayOrderId: { $in: orderIds },
              status: "paid",
            })
            .toArray()
        : Promise.resolve([]),

      pathnames.length
        ? bookCollection
            .find(
              { pathname: { $in: pathnames } },
              {
                projection: {
                  pathname: 1,
                  title: 1,
                },
              },
            )
            .toArray()
        : Promise.resolve([]),

      Promise.all(
        studentIds.map(async (studentId) => {
          try {
            const student = await findUserById(studentId);

            return {
              id: studentId,
              name: student?.name || "Unknown student",
              email: student?.email || "",
            };
          } catch {
            return {
              id: studentId,
              name: "Unknown student",
              email: "",
            };
          }
        }),
      ),
    ]);

    const purchaseByOrder = new Map(
      purchases.map((purchase) => [purchase.razorpayOrderId, purchase]),
    );

    const bookByPath = new Map(
      books.map((book) => [book.pathname, book.title]),
    );

    const studentById = new Map(
      students.map((student) => [student.id, student]),
    );

    const items = orders.map((order) => {
      const studentId = String(order.studentId || "");
      const pathname = String(order.bookPathname || "");
      const orderId = String(order.razorpayOrderId || "");

      const student = studentById.get(studentId);
      const purchase = purchaseByOrder.get(orderId);

      const verified = Boolean(
        purchase &&
        purchase.studentId === studentId &&
        purchase.bookPathname === pathname &&
        purchase.razorpayOrderId === orderId &&
        purchase.status === "paid" &&
        purchase.amountPaise === 4900 &&
        purchase.currency === "INR",
      );

      const status = verified
        ? "paid"
        : order.status === "paid"
          ? "review_required"
          : order.status || "pending";

      return {
        orderId,
        studentId,
        studentName: student?.name || "Unknown student",
        studentEmail: student?.email || "",
        bookPathname: pathname,
        bookTitle:
          bookByPath.get(pathname) ||
          pathname.split("/").pop() ||
          "Unknown book",
        amountPaise: order.amountPaise || 0,
        currency: order.currency || "INR",
        status,
        verified,
        paymentId: verified
          ? purchase?.razorpayPaymentId || ""
          : order.razorpayPaymentId || "",
        createdAt: safeDate(order.createdAt),
        purchasedAt: verified ? safeDate(purchase?.purchasedAt) : null,
      };
    });

    const summary = paidSummary[0];

    return respond({
      success: true,
      items,
      summary: {
        totalOrders,
        displayedOrders: items.length,
        verifiedPurchases: summary?.count || 0,
        verifiedAmountPaise: summary?.amountPaise || 0,
      },
      limited: totalOrders > MAX_ORDERS,
      paymentMode: "test",
    });
  } catch (error) {
    console.error(
      "Admin library orders error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond(
      {
        success: false,
        message: "Unable to load library purchase orders.",
      },
      500,
    );
  }
}
