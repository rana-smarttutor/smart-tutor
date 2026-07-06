import { NextResponse } from "next/server";
import {
  getAllPasswordResetRequests,
  updatePasswordResetRequest,
} from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getAllPasswordResetRequests();
  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status, adminNote } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing request id." }, { status: 400 });
  }

  await updatePasswordResetRequest(id, { status, adminNote });
  return NextResponse.json({ success: true });
}
