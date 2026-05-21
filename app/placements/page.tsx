import { PlacedStudentsWall } from "@/components/placed-students-wall";
import { getPublicInstituteData } from "@/lib/data-store";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StudentCarousel } from "@/components/student-carousel";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const data = await getPublicInstituteData();

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <SiteHeader />
      <div className="pt-12">
        <div className="section-shell mb-12">
          <StudentCarousel />
        </div>
        <PlacedStudentsWall students={data.placedStudents} />
      </div>
      <SiteFooter />
    </main>
  );
}
