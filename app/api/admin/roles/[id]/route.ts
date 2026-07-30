import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { deleteCustomRole, updateCustomRole } from "@/lib/data-store";
import type { AvailableModule, ModuleAccessLevel } from "@/lib/types";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    if (body.name) update.name = String(body.name).trim();
    if (body.description !== undefined)
      update.description = String(body.description).trim();
    if (body.color) update.color = String(body.color);
    if (Array.isArray(body.modules)) update.modules = body.modules;
    if (body.moduleAccess && typeof body.moduleAccess === "object")
      update.moduleAccess = body.moduleAccess;
    if (body.isActive !== undefined)
      update.isActive = body.isActive === true || body.isActive === "1";

    const updated = await updateCustomRole(id, update);
    if (!updated) {
      return NextResponse.json(
        { error: "Role not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "update",
      category: "roles",
      details: `Role updated: ${id}`,
      path: `/api/admin/roles/${id}`,
      method: "PUT",
      request,
      session,
      metadata: { roleId: id },
    });

    return NextResponse.json({ role: updated });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Unable to update role." },
      { status: 500 },
    );
  }
}

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
    const deleted = await deleteCustomRole(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Role not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "delete",
      category: "roles",
      details: `Role deleted: ${id}`,
      path: `/api/admin/roles/${id}`,
      method: "DELETE",
      request: _request,
      session,
      metadata: { roleId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json(
      { error: "Unable to delete role." },
      { status: 500 },
    );
  }
}
