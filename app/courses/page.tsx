import Link from "next/link";

import { CourseCatalogClient } from "@/components/course-catalog-client";
import { getAllDetailedCourses } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllDetailedCourses();

  return (
    <main className="section-shell pb-24 pt-12">
      <section className="mb-12 text-center lg:text-left">
        <div className="max-w-4xl">
          <p className="section-label mb-4">Visible trust, visible outcomes</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--color-heading)] leading-tight mb-6">
            Courses Offered
          </h1>
          <div className="py-2">
            <p className="text-lg leading-snug text-[var(--color-body)] font-bold">
              Smart Tutors pathways from primary school to professional and government exam preparation. 
            </p>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)] font-medium">
              A structured roadmap designed to build strength, discipline, and success at every major academic stage.
            </p>
          </div>
        </div>
      </section>

      <CourseCatalogClient initialCourses={courses} />

      <section className="mt-8 text-center lg:text-left">
        <Link href="/contact" className="action-button px-6 py-4">
          Ask About Admissions
        </Link>
      </section>
    </main>
  );
}
