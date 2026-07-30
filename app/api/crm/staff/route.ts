import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  createCrmStaff,
  deleteCrmStaff,
  getCrmStaff,
  updateCrmStaff,
} from "@/lib/data-store";
import type { CrmStaffDesignation } from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const designations = new Set<CrmStaffDesignation>([
  "counsellor",
  "sales-executive",
  "receptionist",
]);

function getText(value: unknown, maxLength = 160) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function ensureAdmin(session: Awaited<ReturnType<typeof getSessionUser>>) {
  return session?.role === "admin";
}

export async function GET() {
  const session = await getSessionUser();

  if (!ensureAdmin(session)) {
    return NextResponse.json(
      { error: "Only admins can access CRM staff." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    staff: await getCrmStaff(),
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!ensureAdmin(session)) {
      return NextResponse.json(
        { error: "Only admins can create CRM staff." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const name = getText(body.name, 100);
    const designation = getText(body.designation, 40);

    if (!name || !designations.has(designation as CrmStaffDesignation)) {
      return NextResponse.json(
        { error: "Enter a name and valid staff designation." },
        { status: 400 },
      );
    }

    const staff = await createCrmStaff({
      name,
      designation: designation as CrmStaffDesignation,
      email: getText(body.email, 120) || undefined,
      phone: getText(body.phone, 25) || undefined,
    });

    await logAction({
      action: "create",
      category: "crm",
      details: `Created CRM staff member: ${staff.name} (${staff.designation})`,
      path: "/api/crm/staff",
      method: "POST",
      request,
      session,
      metadata: { staffId: staff.id, name: staff.name, designation: staff.designation },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create CRM staff.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();

    if (!ensureAdmin(session)) {
      return NextResponse.json(
        { error: "Only admins can update CRM staff." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const staffId = getText(body.staffId, 120);

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required." },
        { status: 400 },
      );
    }

    const updates: Parameters<typeof updateCrmStaff>[1] = {};

    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = getText(body.name, 100);

      if (!name) {
        return NextResponse.json(
          { error: "Staff name cannot be empty." },
          { status: 400 },
        );
      }

      updates.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(body, "designation")) {
      const designation = getText(body.designation, 40);

      if (!designations.has(designation as CrmStaffDesignation)) {
        return NextResponse.json(
          { error: "Invalid staff designation." },
          { status: 400 },
        );
      }

      updates.designation = designation as CrmStaffDesignation;
    }

    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      updates.email = getText(body.email, 120) || undefined;
    }

    if (Object.prototype.hasOwnProperty.call(body, "phone")) {
      updates.phone = getText(body.phone, 25) || undefined;
    }

    if (typeof body.active === "boolean") {
      updates.active = body.active;
    }

    const staff = await updateCrmStaff(staffId, updates);

    if (!staff) {
      return NextResponse.json(
        { error: "CRM staff member not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "update",
      category: "crm",
      details: `Updated CRM staff member: ${staffId}`,
      path: "/api/crm/staff",
      method: "PATCH",
      request,
      session,
      metadata: { staffId, updates: Object.keys(updates) },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update CRM staff.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionUser();

  if (!ensureAdmin(session)) {
    return NextResponse.json(
      { error: "Only admins can delete CRM staff." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    staffId?: string;
  };

  const staffId = getText(body.staffId, 120);

  if (!staffId) {
    return NextResponse.json(
      { error: "Staff ID is required." },
      { status: 400 },
    );
  }

  const deleted = await deleteCrmStaff(staffId);

  if (!deleted) {
    return NextResponse.json(
      { error: "CRM staff member not found." },
      { status: 404 },
    );
  }

  await logAction({
    action: "delete",
    category: "crm",
    details: `Deleted CRM staff member: ${staffId}`,
    path: "/api/crm/staff",
    method: "DELETE",
    request,
    session,
    metadata: { staffId },
  });

  return NextResponse.json({ success: true });
}