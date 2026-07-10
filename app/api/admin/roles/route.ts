import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createCustomRole,
  getAllCustomRoles,
  getRoleAssignments,
  getRolesDashboardStats,
} from "@/lib/data-store";
import type { AvailableModule } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [roles, assignments, stats] = await Promise.all([
      getAllCustomRoles(),
      getRoleAssignments(),
      getRolesDashboardStats(),
    ]);

    return NextResponse.json({ roles, assignments, stats });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json(
      { error: "Unable to load roles." },
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
    const color = String(body.color || "#4F46E5").trim();
    const description = String(body.description || "").trim();
    const modules = body.modules as AvailableModule[];

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Modules must be an array." },
        { status: 400 },
      );
    }

    const role = await createCustomRole({
      name,
      description: description || undefined,
      color,
      modules,
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error("Create role error:", error);
    return NextResponse.json(
      { error: "Unable to create role." },
      { status: 500 },
    );
  }
}
