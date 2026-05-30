import DigitalLibraryClient from "@/components/digital-library-client";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSessionUser();

  const role = String(session?.role || "student").toLowerCase();
  const canManage = role === "admin" || role === "educator";
  const isLoggedIn = Boolean(session);

  return (
    <DigitalLibraryClient
      canManage={canManage}
      isLoggedIn={isLoggedIn}
    />
  );
}