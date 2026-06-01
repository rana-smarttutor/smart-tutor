import { Metadata } from "next";
import DigitalLibraryClient from "@/components/digital-library-client";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Digital Library | Smart Tutors",
  description: "Access a vast collection of study materials, books, and resources in our Digital Library. Empower your learning with quality content at your fingertips.",
  alternates: {
    canonical: "https://smarttutors.co.in/library",
  },
};

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