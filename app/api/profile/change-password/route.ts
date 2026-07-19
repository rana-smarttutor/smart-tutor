import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findUserByCredentials, updateUserRecord } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both current and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

const user = await findUserByCredentials(
  session.email,
  currentPassword,
  session.role,
);
  if (!user) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  await updateUserRecord({
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    password: newPassword,
    program: (user as any).program ?? "",
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
