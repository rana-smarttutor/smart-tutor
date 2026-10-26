import { Metadata } from "next";
import DigitalLibraryClient from "@/components/digital-library-client";
import { getSessionUser } from "@/lib/auth";
import { getDigitalLibraryBooks } from "@/lib/digital-library-data";

export const metadata: Metadata = {
  title: "Digital Library & Study Materials | SmartIQ Institute",
  description:
    "Access a vast collection of study materials, textbooks, and resources in our Digital Library. Curated content for all board standards and competitive exams.",
  alternates: {
    canonical: "https://smartiqinstitute.in/library",
  },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSessionUser();

  const role = String(session?.role || "guest").toLowerCase();

  const canManage = role === "admin" || role === "educator";

  const isLoggedIn = Boolean(session);

  // Everyone can browse the Digital Library.
  // Only admins and educators receive full PDF source details.
  // Student downloads remain restricted during the upgrade.
  const books = await getDigitalLibraryBooks(canManage);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smartiqinstitute.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Digital Library",
        item: "https://smartiqinstitute.in/library",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <DigitalLibraryClient
        initialBooks={books}
        canManage={canManage}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
