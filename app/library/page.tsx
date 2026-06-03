import DigitalLibraryClient from "@/components/digital-library-client";
import { getSessionUser } from "@/lib/auth";
import { getDigitalLibraryBooks } from "@/lib/digital-library-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSessionUser();

  const role = String(session?.role || "student").toLowerCase();
  const canManage = role === "admin" || role === "educator";
  const isLoggedIn = Boolean(session);
  const canAccessPdf = canManage || isLoggedIn;

  const books = await getDigitalLibraryBooks(canAccessPdf);

  return (
    <DigitalLibraryClient
      initialBooks={books}
      canManage={canManage}
      isLoggedIn={isLoggedIn}
    />
  );
}