import { NextResponse } from "next/server";

import { validateEducatorReferralCode } from "@/lib/reward-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const referralCode =
      url.searchParams.get("code")?.trim() ?? "";

    if (!referralCode) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "Referral code is required.",
        },
        {
          status: 400,
        },
      );
    }

    const referral =
      await validateEducatorReferralCode(
        referralCode,
      );

    if (!referral) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          error: "Referral code is invalid or inactive.",
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,

        referral: {
          referralCode:
            referral.referralCode,

          educatorName:
            referral.educatorName,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Validate referral code error:", error);

    return NextResponse.json(
      {
        success: false,
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to validate the referral code.",
      },
      {
        status: 500,
      },
    );
  }
}