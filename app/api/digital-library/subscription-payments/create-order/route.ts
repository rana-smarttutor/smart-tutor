import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLibraryCollections } from "@/lib/library-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateOrderBody = {
  planId?: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Login required." },
        { status: 401 }
      );
    }

    if (String(session.role).toLowerCase() !== "student") {
      return NextResponse.json(
        { success: false, message: "Student access only." },
        { status: 403 }
      );
    }

    // Test-mode only. Production payments remain disabled.
    if (process.env.LIBRARY_TEST_PAYMENTS_ENABLED !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription payments are not enabled yet.",
        },
        { status: 503 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      !keyId?.startsWith("rzp_test_") ||
      !keySecret ||
      keySecret === "YOUR_KEY_SECRET"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid Razorpay test credentials are required.",
        },
        { status: 503 }
      );
    }

    let body: CreateOrderBody;

    try {
      body = (await request.json()) as CreateOrderBody;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const planId = String(body?.planId || "").trim();

    if (![
      "library-monthly",
      "library-quarterly",
      "library-annual",
    ].includes(planId)) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription plan." },
        { status: 400 }
      );
    }

    const { plans, payments } = await getLibraryCollections();

    const plan = await plans.findOne({
      planId,
      isActive: true,
      currency: "INR",
    });

    if (
      !plan ||
      !Number.isSafeInteger(plan.pricePaise) ||
      plan.pricePaise < 100 ||
      ![1, 3, 12].includes(plan.durationMonths)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription plan is unavailable.",
        },
        { status: 404 }
      );
    }

    const receipt = `lib_${randomUUID().replace(/-/g, "").slice(0, 28)}`;

    const auth = Buffer.from(
      `${keyId}:${keySecret}`
    ).toString("base64");

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: plan.pricePaise,
          currency: "INR",
          receipt,
          notes: {
            purpose: "digital_library_subscription",
            studentId: session.id,
            planId: plan.planId,
          },
        }),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Library Razorpay order creation failed:",
        response.status
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to create payment order.",
        },
        { status: 502 }
      );
    }

    const order = (await response.json()) as RazorpayOrder;

    if (
      !order.id ||
      order.amount !== plan.pricePaise ||
      order.currency !== "INR" ||
      order.status !== "created"
    ) {
      throw new Error("Unexpected Razorpay order response.");
    }

    await payments.createIndex(
      { razorpayOrderId: 1 },
      { unique: true }
    );

    const now = new Date();

    await payments.insertOne({
      studentId: session.id,
      planId: plan.planId,
      razorpayOrderId: order.id,
      amountPaise: plan.pricePaise,
      currency: "INR",
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        keyId,
        amount: plan.pricePaise,
        currency: "INR",
        planId: plan.planId,
        planName: plan.name,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "Digital Library subscription order error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to prepare subscription payment.",
      },
      { status: 500 }
    );
  }
}
