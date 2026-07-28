import { NextResponse } from "next/server";
import {
  getAllPasswordResetRequests,
  updatePasswordResetRequest,
  deletePasswordResetRequest,
  resetUserPasswordByEmail,
} from "@/lib/data-store";
import { getSessionUser } from "@/lib/auth";
import { sanitizePasswordInput } from "@/lib/validation";

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
  const { id, status, adminNote, newPassword } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing request id." }, { status: 400 });
  }

  let resetResult: { success: boolean; message: string } | null = null;

  if (newPassword && typeof newPassword === "string") {
    const sanitized = sanitizePasswordInput(newPassword);

    if (sanitized.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const requests = await getAllPasswordResetRequests();
    const req = requests.find(
      (r: { id: string }) => r.id === id,
    );

    if (!req) {
      return NextResponse.json(
        { error: "Request not found." },
        { status: 404 },
      );
    }

    resetResult = await resetUserPasswordByEmail(req.email, sanitized);
  }

  const note =
    adminNote ||
    (status === "contacted"
      ? "Admin has been notified. Will reach out shortly."
      : status === "resolved"
        ? newPassword
          ? "Password has been reset and user notified."
          : "Password has been reset."
        : "");

  await updatePasswordResetRequest(id, { status, adminNote: note });

  return NextResponse.json({ success: true, resetResult });
}

export async function DELETE(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing request id." }, { status: 400 });
  }

  const deleted = await deletePasswordResetRequest(id);
  if (!deleted) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
