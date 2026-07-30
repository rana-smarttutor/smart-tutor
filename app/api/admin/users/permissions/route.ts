import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCollection, COLLECTIONS } from "@/lib/data-store";
import type { AvailableModule, ModuleAccessLevel } from "@/lib/types";
import { logAction } from "@/lib/audit-log";

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
    const modules = body.modules as AvailableModule[] | undefined;
    const moduleAccess = body.moduleAccess as
      | Partial<Record<AvailableModule, ModuleAccessLevel>>
      | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Modules must be an array." },
        { status: 400 },
      );
    }

    const collection = await getCollection(COLLECTIONS.users);
    const user = await collection.findOne(
      { id: userId },
      { projection: { id: 1 } },
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    const setFields: Record<string, unknown> = {
      customModules: modules,
      updatedAt: new Date().toISOString(),
    };

    if (moduleAccess && typeof moduleAccess === "object") {
      setFields.customModuleAccess = moduleAccess;
    } else if (modules.length === 0) {
      setFields.customModuleAccess = {};
    }

    await collection.updateOne({ id: userId }, { $set: setFields });

    await logAction({
      action: "update",
      category: "users",
      details: `User permissions updated: ${userId}`,
      path: "/api/admin/users/permissions",
      method: "POST",
      request,
      session,
      metadata: { userId, modules },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update user permissions error:", error);
    return NextResponse.json(
      { error: "Unable to update permissions." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = String(searchParams.get("userId") || "").trim();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    const collection = await getCollection(COLLECTIONS.users);
    const user = await collection.findOne(
      { id: userId },
      { projection: { customModules: 1, customModuleAccess: 1 } },
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    const modules = (user.customModules as AvailableModule[]) || [];
    const moduleAccess =
      (user.customModuleAccess as Partial<
        Record<AvailableModule, ModuleAccessLevel>
      >) || {};

    return NextResponse.json({ ok: true, modules, moduleAccess });
  } catch (error) {
    console.error("Get user permissions error:", error);
    return NextResponse.json(
      { error: "Unable to load permissions." },
      { status: 500 },
    );
  }
}
