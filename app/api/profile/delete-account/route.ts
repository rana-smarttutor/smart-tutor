import { NextResponse } from "next/server";
import {
  clearSessionResponse,
  getSessionUser,
} from "@/lib/auth";
import { deleteUserRecord, findUserByCredentials } from "@/lib/data-store";
import { getMongoDatabase } from "@/lib/mongodb";

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

  const user = await findUserByCredentials(session.email, body.password);
  if (!user) {
    return NextResponse.json(
      { error: "Password is incorrect." },
      { status: 403 },
    );
  }

  const db = await getMongoDatabase();
  await Promise.all([
    deleteUserRecord(session.id),
    db.collection("deleted_accounts").insertOne({
      userId: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      deletedAt: new Date().toISOString(),
    }),
  ]);

  const response = clearSessionResponse();
  return response;
}
