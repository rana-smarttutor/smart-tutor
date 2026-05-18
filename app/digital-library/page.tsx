import { redirect } from "next/navigation";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { getLibraryBooksForRole } from "@/lib/data-store";
import { DigitalLibraryClient } from "@/components/digital-library-client";

export const dynamic = "force-dynamic";

export default async function DigitalLibraryPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login?callbackUrl=/digital-library");
  }

  const books = await getLibraryBooksForRole(session.role);
  const canManage = hasAnyRole(session, ["admin", "educator"]);

  return (
    <main className="section-shell pb-24 pt-12">
      <section className="mb-12">
        <p className="section-label">Resource Center</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[var(--color-heading)] leading-[1] mb-6">
          Digital <span className="text-blue-600">Library.</span>
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-[var(--color-muted)] font-medium max-w-2xl">
          Access curated study materials, textbooks, and revision guides stored securely.
        </p>
      </section>

      <DigitalLibraryClient 
        initialBooks={books} 
        canManage={canManage} 
      />
    </main>
  );
}
