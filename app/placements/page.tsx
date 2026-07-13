import { Metadata } from "next";
import Image from "next/image";
import { PlacedStudentsWall } from "@/components/placed-students-wall";
import { PlacementPortalHero } from "@/components/placement-portal-hero";
import { SiteHeader } from "@/components/site-header";
import { generatedPlacedStudents } from "@/lib/placed-students-data";
import { PublishedPlacementJobs } from "@/components/published-placement-jobs";

export const metadata: Metadata = {
  title: "Placements & Success Stories",
  description:
    "Explore the success stories of Smart Tutors students who excelled in board exams, competitive exams, and secured top ranks. 500+ success stories and counting.",
  alternates: {
    canonical: "https://smarttutors.co.in/placements",
  },
};

export const dynamic = "force-static";
export default function PlacementsPage() {
  const allStudents = generatedPlacedStudents;
  const toppers = allStudents.slice(0, 3);
  const quickStats = [
    { label: "Top Percentile", value: "99.37%" },
    { label: "State Ranks", value: "15+" },
    { label: "Success Stories", value: "500+" },
    { label: "Quality Mentors", value: "25+" },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Placements",
        item: "/placements",
      },
    ],
  };
  return (
    <main className="min-h-screen bg-white">
      {" "}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />{" "}
      <PlacementPortalHero />
      <PublishedPlacementJobs />{" "}
      <section className="relative overflow-hidden pb-20 pt-10">
        {" "}
        <div className="absolute inset-0 -z-10 bg-blue-600/5" />{" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="mx-auto mb-16 max-w-4xl text-center">
            {" "}
            <span className="mb-6 inline-block rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700">
              {" "}
              Our Legacy of Success{" "}
            </span>{" "}
            <h1 className="mb-8 text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl">
              {" "}
              Where Dedication Meets{" "}
              <span className="text-blue-600">Exceptional Results.</span>{" "}
            </h1>{" "}
            <p className="text-lg font-medium leading-relaxed text-slate-600 md:text-xl">
              {" "}
              Celebrating the journey of our students who transformed their
              ambitions into reality. From national-level competitive exams to
              professional career breakthroughs.{" "}
            </p>{" "}
          </div>{" "}
          <div className="mx-auto mb-20 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
            {" "}
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-xl shadow-blue-500/5"
              >
                {" "}
                <p className="mb-1 text-2xl font-black text-blue-600 md:text-3xl">
                  {" "}
                  {stat.value}{" "}
                </p>{" "}
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {" "}
                  {stat.label}{" "}
                </p>{" "}
              </div>
            ))}{" "}
          </div>{" "}
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {" "}
            {toppers.map((topper) => (
              <article
                key={topper.id}
                className="group relative h-full overflow-hidden rounded-[3rem] border border-slate-100 bg-white shadow-2xl"
              >
                {" "}
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                  {" "}
                  <Image
                    src={topper.image || ""}
                    alt={topper.name}
                    fill
                    sizes="(max-width: 1023px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />{" "}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent opacity-60" />{" "}
                </div>{" "}
                <div className="absolute left-6 top-6 flex flex-col gap-2">
                  {" "}
                  <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-lg backdrop-blur">
                    {" "}
                    {topper.examName}{" "}
                  </span>{" "}
                  {topper.marks && (
                    <span className="rounded-full bg-emerald-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                      {" "}
                      Score: {topper.marks}{" "}
                    </span>
                  )}{" "}
                </div>{" "}
                <div className="relative bg-white p-8 text-center">
                  {" "}
                  <div className="absolute -top-12 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border-8 border-white bg-blue-600 shadow-xl">
                    {" "}
                    <span className="text-2xl font-black text-white">
                      {" "}
                      {topper.rank === "1st" ? "🏆" : "⭐"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="pt-8">
                    {" "}
                    <h3 className="mb-1 text-2xl font-black text-slate-900">
                      {" "}
                      {topper.name}{" "}
                    </h3>{" "}
                    <p className="mb-4 text-sm font-bold text-blue-600">
                      {" "}
                      {topper.rank === "1st"
                        ? "All India Rank 1"
                        : "Top Performer"}{" "}
                    </p>{" "}
                    <p className="text-xs italic text-slate-500">
                      {" "}
                      &quot;Smart Tutors&apos; mentoring was the key to my
                      success in {topper.examName}.&quot;{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </article>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="border-t border-slate-100 py-20">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="mb-10 text-center">
            {" "}
            <h2 className="mb-4 text-3xl font-black text-slate-900 md:text-5xl">
              {" "}
              Complete Results Gallery{" "}
            </h2>{" "}
            <div className="mx-auto h-1.5 w-24 rounded-full bg-blue-600" />{" "}
          </div>{" "}
          <PlacedStudentsWall students={allStudents} />{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
