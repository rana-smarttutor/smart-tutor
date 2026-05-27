import { PlacedStudentsWall } from "@/components/placed-students-wall";
import { generatedPlacedStudents } from "@/lib/placed-students-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { CountUpValue } from "@/components/count-up-value";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const allStudents = generatedPlacedStudents;
  
  // Featured Toppers (top 3)
  const toppers = allStudents.slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 -z-10" />
        <div className="container mx-auto px-4">
          <RevealOnScroll className="text-center max-w-4xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-6">
              Our Legacy of Success
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
              Where Dedication Meets <span className="text-blue-600">Exceptional Results.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
              Celebrating the journey of our students who transformed their ambitions into reality. From national-level competitive exams to professional career breakthroughs.
            </p>
          </RevealOnScroll>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-20">
            {[
              { label: "Top Percentile", value: "99.37%" },
              { label: "State Ranks", value: "15+" },
              { label: "Success Stories", value: "500+" },
              { label: "Quality Mentors", value: "25+" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-500/5 border border-slate-100 text-center">
                <CountUpValue value={stat.value} className="text-2xl md:text-3xl font-black text-blue-600 mb-1" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature Toppers Display */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {toppers.map((topper, i) => (
              <RevealOnScroll key={topper.id} delayMs={i * 100}>
                <div className="relative group overflow-hidden rounded-[3rem] bg-white shadow-2xl border border-slate-100 h-full">
                  <div className="aspect-[4/5] relative overflow-hidden bg-slate-50">
                    <Image
                      src={topper.image || ""}
                      alt={topper.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent opacity-60" />
                  </div>
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                      {topper.examName}
                    </span>
                    {topper.marks && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                         Score: {topper.marks}
                      </span>
                    )}
                  </div>

                  <div className="p-8 text-center bg-white relative">
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center border-8 border-white shadow-xl">
                        <span className="text-white text-2xl font-black">{topper.rank === "1st" ? "🏆" : "⭐"}</span>
                     </div>
                     <div className="pt-8">
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{topper.name}</h3>
                        <p className="text-blue-600 font-bold text-sm mb-4">
                          {topper.rank === "1st" ? "All India Rank 1" : "Top Performer"}
                        </p>
                        <p className="text-slate-500 text-xs italic">
                          "Smart Tutors' mentoring was the key to my success in {topper.examName}."
                        </p>
                     </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* The Main Results Wall */}
      <div className="py-20 border-t border-slate-100">
        <div className="container mx-auto px-4">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Complete Results Gallery</h2>
                <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full" />
            </div>
            <PlacedStudentsWall students={allStudents} />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
