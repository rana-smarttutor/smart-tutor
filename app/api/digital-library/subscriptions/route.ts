import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLibraryCollections } from "@/lib/library-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    if (String(user.role).toLowerCase() !== "student") {
      return NextResponse.json(
        { success: false, message: "Student access only." },
        { status: 403 }
      );
    }

    const { subscriptions } = await getLibraryCollections();
    const now = new Date();

    const active = await subscriptions.findOne(
      {
        studentId: user.id,
        status: "active",
        startDate: { $lte: now },
        expiryDate: { $gt: now },
      },
      { sort: { startDate: -1, expiryDate: -1 } }
    );

    const latest = active || await subscriptions.findOne(
      { studentId: user.id },
      { sort: { createdAt: -1, startDate: -1 } }
    );

    let status: "active" | "expired" | "revoked" | "none" =
      "none";

    if (active) {
      status = "active";
    } else if (latest) {
      status =
        latest.status === "revoked"
          ? "revoked"
          : latest.expiryDate <= now
            ? "expired"
            : "none";
    }

    const daysRemaining = active
      ? Math.max(
          0,
          Math.ceil(
            (active.expiryDate.getTime() - now.getTime()) /
              86400000
          )
        )
      : 0;

    return NextResponse.json(
      {
        success: true,
        status,
        subscription: active
          ? {
              planId: active.planId,
              startDate: active.startDate,
              expiryDate: active.expiryDate,
              daysRemaining,
            }
          : null,
        previousSubscription:
          !active && latest
            ? {
                planId: latest.planId,
                startDate: latest.startDate,
                expiryDate: latest.expiryDate,
                status,
              }
            : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error) {
    console.error("Subscription status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve subscription status.",
      },
      { status: 500 }
    );
  }
}
