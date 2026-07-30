import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { createHoliday, getHolidays } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const holidays = await getHolidays();
    return NextResponse.json({ holidays });
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      { error: "Unable to load holidays." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const date = String(body.date || "").trim();
    const type = String(body.type || "institute").trim();
    const color = String(body.color || "#EF4444").trim();

    if (!name || !date) {
      return NextResponse.json(
        { error: "Name and date are required." },
        { status: 400 },
      );
    }

    const holiday = await createHoliday({ name, date, type, color });
    await logAction({
      action: "create",
      category: "leave",
      details: `Holiday "${name}" created on ${date}`,
      path: "/api/leave/holidays",
      method: "POST",
      request,
      session,
      metadata: { name, date, type },
    });

    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error) {
    console.error("Create holiday error:", error);
    return NextResponse.json(
      { error: "Unable to create holiday." },
      { status: 500 },
    );
  }
}
