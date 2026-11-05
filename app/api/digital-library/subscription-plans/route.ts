import { NextResponse } from "next/server";
import { getLibraryCollections } from "@/lib/library-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { plans } = await getLibraryCollections();

    const records = await plans
      .find({
        isActive: true,
        currency: "INR",
        pricePaise: { $gt: 0 },
        durationMonths: { $in: [1, 3, 12] },
      })
      .sort({ durationMonths: 1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        plans: records.map((plan) => ({
          planId: plan.planId,
          name: plan.name,
          pricePaise: plan.pricePaise,
          currency: plan.currency,
          durationMonths: plan.durationMonths,
        })),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Library plan loading error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load library plans.",
        plans: [],
      },
      { status: 500 }
    );
  }
}
