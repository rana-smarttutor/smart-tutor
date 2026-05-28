import { cookies } from "next/headers";
import DigitalLibraryClient from "@/components/digital-library-client";

export const dynamic = "force-dynamic";

async function getCurrentRole() {
  const cookieStore = await cookies();

  const role =
    cookieStore.get("role")?.value ||
    cookieStore.get("userRole")?.value ||
    cookieStore.get("smart_tutors_role")?.value ||
    cookieStore.get("smart-tutors-role")?.value ||
    cookieStore.get("accountRole")?.value ||
    "student";

  return role.toLowerCase();
}

async function isUserLoggedIn() {
  const cookieStore = await cookies();

  return Boolean(
    cookieStore.get("session")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("token")?.value ||
      cookieStore.get("smart_tutors_session")?.value ||
      cookieStore.get("smart-tutors-session")?.value ||
      cookieStore.get("userRole")?.value ||
      cookieStore.get("role")?.value
  );
}

function canManageLibrary(role: string) {
  return ["admin", "educator"].includes(role);
}

export default async function LibraryPage() {
  const role = await getCurrentRole();
  const loggedIn = await isUserLoggedIn();

  return (
    <DigitalLibraryClient
      canManage={canManageLibrary(role)}
      isLoggedIn={loggedIn}
    />
  );
}