import { NextResponse } from "next/server";
import {
  clearSessionResponse,
  getSessionUser,
} from "@/lib/auth";
import { deleteUserRecord, findUserByCredentials } from "@/lib/data-store";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can delete accounts." }, { status: 403 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json(
      { error: "Password is required to delete your account." },
      { status: 400 },
    );
  }

 const user = await findUserByCredentials(
  session.email,
  body.password,
  session.role,
);
  if (!user) {
    return NextResponse.json(
      { error: "Password is incorrect." },
      { status: 403 },
    );
  }

  await deleteUserRecord(session.id);

  await logAction({
    action: "delete",
    category: "auth",
    details: `Account deletion requested by ${session.email}`,
    path: "/api/profile/delete-account",
    method: "POST",
    request,
    session,
    metadata: { userId: session.id, email: session.email },
  });

  const response = clearSessionResponse();
  return response;
}
