import Link from "next/link";

import { CourseCatalogClient } from "@/components/course-catalog-client";
import { getAllDetailedCourses } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllDetailedCourses();

  return (
    <main className="section-shell pb-16 pt-8">
      <section className="surface rounded-[2rem] p-8 sm:p-10">
        <div className="max-w-4xl text-center lg:text-left">
          <p className="section-label">Courses Offered</p>
          <h1 className="section-title">
            Smart Tutor pathways from class 6 to diploma, graduation, and government exam preparation
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
            The catalog now groups every major stage clearly: class 6 to 8, class 9 and 10, class 11 and 12, diploma and graduation support, and a complete government exam preparation track.
          </p>
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
