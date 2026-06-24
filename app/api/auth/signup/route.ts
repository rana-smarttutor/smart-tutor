import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Self-registration is disabled. Accounts are created by the institute administration. Please contact Smart Tutors admission desk.",
    },
    { status: 410 },
  );
}
