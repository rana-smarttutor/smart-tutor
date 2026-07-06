import { NextResponse } from "next/server";

import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "@/lib/razorpay-config";
import { getSessionUser } from "@/lib/auth";
import { getFeeInvoiceById } from "@/lib/data-store";

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

  // Verify invoice ownership if invoiceId is provided
  if (body.invoiceId) {
    const invoice = await getFeeInvoiceById(body.invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    if (session.role === "student" && invoice.studentId !== session.id) {
      return NextResponse.json({ error: "You can only pay your own invoices." }, { status: 403 });
    }
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
