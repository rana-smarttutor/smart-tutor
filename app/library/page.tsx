import type { Metadata } from "next";

import DigitalLibraryClient from "@/components/digital-library-client";
import { getSessionUser } from "@/lib/auth";
import {
  getHybridLibraryCatalog,
  getHybridLibraryCatalogStatus,
} from "@/lib/library-hybrid-catalog";

export const metadata: Metadata = {
  title: "Digital Library & Study Materials | SmartIQ Institute",
  description:
    "Explore study materials for government examinations, banking, SSC and other competitive examinations at SmartIQ Institute.",
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
  const canDelete = role === "admin";
  const isLoggedIn = Boolean(session);

  let books: Awaited<ReturnType<typeof getHybridLibraryCatalog>> = [];
  let catalogAvailable = false;

  try {
    const status = await getHybridLibraryCatalogStatus();
    catalogAvailable =
      status.invalid === 0 &&
      (status.migrationComplete || status.r2MigrationComplete);

    if (catalogAvailable) {
      books = await getHybridLibraryCatalog();
    }
  } catch (error) {
    console.error(
      "Digital Library page catalogue error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

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
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {!catalogAvailable ? (
        <main className="min-h-[50vh] bg-[#f7faff] px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">
              Digital Library
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Our Digital Library catalogue is currently being verified. Book
              access will be available once verification is complete.
            </p>
          </div>
        </main>
      ) : (
        <DigitalLibraryClient
          initialBooks={books}
          canManage={canManage}
          canDelete={canDelete}
          isLoggedIn={isLoggedIn}
        />
      )}
    </>
  );
}
