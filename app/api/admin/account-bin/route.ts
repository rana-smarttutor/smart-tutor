import { NextResponse } from "next/server";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { getDeletedUsers, restoreUserRecord, permanentDeleteUserRecord } from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json({ error: "Only admins can access the account bin." }, { status: 403 });
  }

  const deletedUsers = await getDeletedUsers();
  return NextResponse.json({ users: deletedUsers });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json({ error: "Only admins can restore accounts." }, { status: 403 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const restored = await restoreUserRecord(body.id);
  if (!restored) {
    return NextResponse.json({ error: "Account not found in bin or already active." }, { status: 404 });
  }

  await logAction({
    action: "restore",
    category: "users",
    details: `Account restored: ${body.id}`,
    path: "/api/admin/account-bin",
    method: "PATCH",
    request,
    session,
    metadata: { userId: body.id },
  });

  return NextResponse.json({ ok: true, message: "Account restored." });
}

export async function DELETE(request: Request) {
  const session = await getSessionUser();
  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json({ error: "Only admins can permanently delete accounts." }, { status: 403 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const deleted = await permanentDeleteUserRecord(body.id);
  if (!deleted) {
    return NextResponse.json({ error: "Account not found in bin." }, { status: 404 });
  }

  await logAction({
    action: "delete",
    category: "users",
    details: `Account permanently deleted: ${body.id}`,
    path: "/api/admin/account-bin",
    method: "DELETE",
    request,
    session,
    metadata: { userId: body.id },
  });

  return NextResponse.json({ ok: true, message: "Account permanently deleted." });
}
