import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

import { RAZORPAY_KEY_SECRET } from "@/lib/razorpay-config";
import { getSessionUser } from "@/lib/auth";
import { updateFeeInvoice } from "@/lib/data-store";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    invoiceId,
    amount,
  } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing payment verification fields" },
      { status: 400 },
    );
  }

  const expectedSign = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSign !== razorpay_signature) {
    return NextResponse.json(
      { error: "Invalid payment signature" },
      { status: 400 },
    );
  }

  if (invoiceId) {
    await updateFeeInvoice(invoiceId, {
      status: "paid",
      paidAmount: Number(amount) || 0,
    });
  }

  return NextResponse.json({
    success: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });
}
