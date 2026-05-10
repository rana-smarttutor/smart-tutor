import Link from "next/link";

import { CourseCatalogClient } from "@/components/course-catalog-client";
import { getAllDetailedCourses } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllDetailedCourses();

  return (
    <main className="section-shell pb-24 pt-12">
      <section className="mb-16 text-center lg:text-left">
        <div className="max-w-4xl">
          <p className="section-label mb-6">Our Academic Catalog</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-heading)] leading-[1.1] mb-8">
            Courses Offered
          </h1>
          <div className="surface-soft rounded-[2.5rem] p-8 sm:p-10 border-blue-100 dark:border-blue-900/30">
            <p className="text-xl leading-relaxed text-[var(--color-body)] font-semibold">
              Smart Tutor pathways from class 6 to diploma, graduation, and government exam preparation. 
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--color-muted)] font-medium">
              Our structured catalog groups every major stage clearly, providing a complete educational roadmap designed to build strength, discipline, and success.
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
