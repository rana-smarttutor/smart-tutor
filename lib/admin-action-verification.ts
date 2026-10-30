import "server-only";

import { getCollection, COLLECTIONS } from "@/lib/data-store";
import { verifyPassword } from "@/lib/password";
import type { SessionUser } from "@/lib/types";

export async function verifySensitiveAdminAction(
  session: SessionUser | null,
  currentPassword: unknown,
): Promise<boolean> {
  if (
    !session ||
    session.role !== "admin" ||
    session.status !== "active" ||
    session.deletedAt ||
    typeof currentPassword !== "string" ||
    currentPassword.length === 0 ||
    currentPassword.length > 256
  ) {
    return false;
  }

  const collection = await getCollection(COLLECTIONS.users);

  const admin = await collection.findOne({
    id: session.id,
    role: "admin",
    status: "active",
    deletedAt: { $exists: false },
  });

  if (!admin || typeof admin.password !== "string") {
    return false;
  }

  return verifyPassword(currentPassword, admin.password);
}
