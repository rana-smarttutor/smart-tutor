import { NextResponse } from "next/server";

import { createPasswordResetRequest } from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const role = body.role?.trim() || "student";

    if (!name || !email || !phone) {
      return NextResponse.json(
        {
          error: "Name, email and phone number are required.",
        },
        {
          status: 400,
        },
      );
    }

    await createPasswordResetRequest({
      name,
      email,
      phone,
      role,
    });

    await logAction({
      action: "create",
      category: "auth",
      details: `Password reset requested for ${email}`,
      path: "/api/forgot-password",
      method: "POST",
      request,
      metadata: { email },
    });

    return NextResponse.json({
      message:
        "Your request has been submitted. Our technical team will verify the details and contact you to reset your password.",
    });
  } catch (error) {
    console.error("Forgot-password request failed:", error);

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}