import { Metadata } from "next";
import DigitalLibraryClient from "@/components/digital-library-client";
import { getSessionUser } from "@/lib/auth";
import { isLibraryLockdownBypass } from "@/lib/digital-library-lockdown";
import { getDigitalLibraryBooks } from "@/lib/digital-library-data";

export const metadata: Metadata = {
  title: "Digital Library & Study Materials | SmartIQ Institute",
  description: "Access a vast collection of study materials, textbooks, and resources in our Digital Library. Curated content for all board standards and competitive exams.",
  alternates: {
    canonical: "https://smartiqinstitute.in/library",
  },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSessionUser();

  if (!isLibraryLockdownBypass(session?.role)) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#f7faff] px-4 py-16">
        <section className="w-full max-w-xl rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            📚
          </div>

          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Digital Library Temporarily Unavailable
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-600">
            We're upgrading the SmartIQ Digital Library with
            a new subscription and secure payment system.
            Access will be restored once the upgrade is completed.
          </p>

          <div className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            Thank you for your patience.
          </div>
        </section>
      </main>
    );
  }


  const role = String(session?.role || "student").toLowerCase();
  const canManage = role === "admin" || role === "educator";
  const isLoggedIn = Boolean(session);
  const canAccessPdf = canManage || isLoggedIn;

  const books = await getDigitalLibraryBooks(canAccessPdf);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smartiqinstitute.in" },
      { "@type": "ListItem", "position": 2, "name": "Digital Library", "item": "https://smartiqinstitute.in/library" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DigitalLibraryClient
        initialBooks={books}
        canManage={canManage}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}