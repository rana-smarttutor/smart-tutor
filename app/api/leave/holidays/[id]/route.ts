import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { deleteHoliday } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await deleteHoliday(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Holiday not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return NextResponse.json(
      { error: "Unable to delete holiday." },
      { status: 500 },
    );
  }
}
