export const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID || "rzp_test_XXXXXXXXXXXX";

export const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET";

export function getRazorpayKeyId(): string {
  return RAZORPAY_KEY_ID;
}

export function isRazorpayConfigured(): boolean {
  return (
    !!process.env.RAZORPAY_KEY_ID &&
    !!process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes("XXXXXXXX")
  );
}
