import { NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, lastPassword, role } = body;

    if (!name || !email || !phone || !lastPassword) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    await createPasswordResetRequest({
      name,
      email,
      phone,
      lastPassword,
      role: role ?? "student",
    });

    return NextResponse.json({
      message:
        "Your request has been submitted. Our technical team will verify the details and contact you back to reset your password.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
