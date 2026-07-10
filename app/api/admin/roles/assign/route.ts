import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { assignRoleToUser, removeRoleFromUser } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const userId = String(body.userId || "").trim();
    const roleId = String(body.roleId || "").trim();
    const roleName = String(body.roleName || "").trim();

    if (!userId || !roleId || !roleName) {
      return NextResponse.json(
        { error: "userId, roleId, and roleName are required." },
        { status: 400 },
      );
    }

    const assignment = await assignRoleToUser({
      userId,
      roleId,
      roleName,
      assignedBy: session.name || session.id,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Assign role error:", error);
    return NextResponse.json(
      { error: "Unable to assign role." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const userId = String(body.userId || "").trim();
    const roleId = String(body.roleId || "").trim();

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: "userId and roleId are required." },
        { status: 400 },
      );
    }

    const removed = await removeRoleFromUser(userId, roleId);
    if (!removed) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove role error:", error);
    return NextResponse.json(
      { error: "Unable to remove role." },
      { status: 500 },
    );
  }
}
