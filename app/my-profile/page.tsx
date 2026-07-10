import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyProfileClient } from "@/components/my-profile-client";

export const metadata = {
  title: "My Profile | Smart Tutors",
  description: "Manage your personal and professional information",
};

export default async function MyProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  return <MyProfileClient session={session} />;
}
