import { NextResponse } from "next/server";

import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "@/lib/razorpay-config";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const amount = Number(body.amount);

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString(
    "base64",
  );

  try {
    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: session.id,
          userRole: session.role,
          invoiceId: body.invoiceId || "",
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errorText = await razorpayRes.text();
      return NextResponse.json(
        { error: "Razorpay order creation failed", details: errorText },
        { status: 500 },
      );
    }

    const order = await razorpayRes.json();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 },
    );
  }
}
