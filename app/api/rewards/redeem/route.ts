import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { createRewardRedemption } from "@/lib/reward-store";

import type {
  CreateRewardRedemptionInput,
  RewardBankDetails,
  RewardPaymentMethod,
} from "@/lib/reward-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RedemptionRequestBody = {
  amount?: unknown;

  paymentMethod?: unknown;

  upiId?: unknown;

  bankDetails?: {
    accountHolderName?: unknown;
    accountNumber?: unknown;
    ifscCode?: unknown;
    bankName?: unknown;
  };
};

function getOptionalText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getPaymentMethod(
  value: unknown,
): RewardPaymentMethod | null {
  if (value === "upi" || value === "bank") {
    return value;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Login required.",
      },
      {
        status: 401,
      },
    );
  }

  if (!hasAnyRole(session, ["educator"])) {
    return NextResponse.json(
      {
        success: false,
        error: "Only educators can redeem reward earnings.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body =
      (await request.json()) as RedemptionRequestBody;

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid redemption amount.",
        },
        {
          status: 400,
        },
      );
    }

    const paymentMethod = getPaymentMethod(
      body.paymentMethod,
    );

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Choose UPI or bank transfer.",
        },
        {
          status: 400,
        },
      );
    }

    let bankDetails:
      | RewardBankDetails
      | undefined;

    if (paymentMethod === "bank") {
      bankDetails = {
        accountHolderName: getOptionalText(
          body.bankDetails?.accountHolderName,
        ),

        accountNumber: getOptionalText(
          body.bankDetails?.accountNumber,
        ),

        ifscCode: getOptionalText(
          body.bankDetails?.ifscCode,
        ),

        bankName:
          getOptionalText(
            body.bankDetails?.bankName,
          ) || undefined,
      };
    }

    const input: CreateRewardRedemptionInput = {
      amount,

      paymentMethod,

      upiId:
        paymentMethod === "upi"
          ? getOptionalText(body.upiId)
          : undefined,

      bankDetails,
    };

    const redemption = await createRewardRedemption(
      session.id,
      session.name,
      session.email,
      input,
    );

    await logAction({
      action: "create",
      category: "other",
      details: `Reward redemption of ${amount} requested by ${session.name}`,
      path: "/api/rewards/redeem",
      method: "POST",
      request,
      session,
      metadata: { amount, paymentMethod },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Your reward redemption request has been submitted.",

        redemption,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Reward redemption error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to submit the redemption request.";

    const isValidationError =
      message.includes("valid") ||
      message.includes("required") ||
      message.includes("Minimum") ||
      message.includes("insufficient") ||
      message.includes("disabled");

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: isValidationError ? 400 : 500,
      },
    );
  }
}