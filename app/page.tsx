import Link from "next/link";
import Image from "next/image";

import { CountUpValue } from "@/components/count-up-value";
import { LiveClock } from "@/components/live-clock";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getPublicInstituteData } from "@/lib/data-store";
import { PlacedStudentsWall } from "@/components/placed-students-wall";
import { StudentCarousel } from "@/components/student-carousel";
import { GrandSuccessCarousel } from "@/components/grand-success-carousel";
import { courseLibrary } from "@/lib/course-library";
import { CampusHighlightsCarousel } from "@/components/campus-highlights-carousel";
import { ProgramCarousel } from "@/components/program-carousel";

export const dynamic = "force-dynamic";

const roleAccentMap = {
  student: "from-blue-50 to-white",
  educator: "from-purple-50 to-white",
  admin: "from-emerald-50 to-white",
  parent: "from-orange-50 to-white",
} as const;

export default async function Home() {
  const data = await getPublicInstituteData();

  // Manually defined roles to ensure 4 cards
  const homeRoles = [
    {
      role: "student",
      title: "Learning Portal",
      summary: "Access 1-on-1 tutoring, mock tests, and digital resources to accelerate your growth.",
      features: ["Live Classes", "Personalized Dashboard", "Instant Doubt Solving"]
    },
    {
      role: "educator",
      title: "Mentor Studio",
      summary: "Manage your teaching schedule, track student performance, and deliver high-impact lectures.",
      features: ["Resource Manager", "Performance Tracking", "Student Communication"]
    },
    {
      role: "parent",
      title: "Parent Connect",
      summary: "Stay updated with your child's academic progress through real-time reports and attendance tracking.",
      features: ["Progress Reports", "Direct Mentor Chat", "Attendance Logs"]
    },
    {
      role: "admin",
      title: "Operations Hub",
      summary: "Full control over institute management, course scheduling, and campus operations.",
      features: ["Admissions Manager", "Fee Tracking", "System Analytics"]
    }
  ];

  return (
    <main className="relative overflow-hidden pb-16 pt-8">
      <section className="section-shell grid gap-8 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <RevealOnScroll className="space-y-7 text-center lg:text-left w-full max-w-full"> 
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <div className="surface-soft border-info inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-info">
              <span className="h-2.5 w-2.5 rounded-full bg-info animate-pulse" />
              Admissions | Exams | Placement
            </div>

            <div className="surface-soft border-success inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Offline Campus
            </div> 

            <div className="surface-soft border-success inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Vashi's Results-Driven Campus
            </div> 
          </div>

          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-blue-600">
            India’s No.1 Trusted Smart Learning Platform
          </p>

          <div className="space-y-5">
            <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-[1.1] tracking-[-0.035em] text-[var(--color-heading)] sm:text-5xl xl:mx-0 xl:text-6xl">
              Beyond Coaching. <br className="hidden xl:block" /> Total Empowerment.
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)] xl:mx-0">
              Smart Tutors provides <strong>Programs mapped to every stage of growth</strong>. 
              We bring disciplined preparation, sharp mentoring, and real academic 
              momentum into one focused institute experience. From school boards to 
              civil services and digital future skills.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:items-start lg:justify-start">
            <Link href="/login" className="action-button inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 text-base shadow-xl glow-primary min-h-15 sm:min-h-16 w-full sm:w-auto">
              Start Your Journey
            </Link>
            <Link
              href="/contact"
              className="surface inline-flex items-center justify-center rounded-full px-8 sm:px-10 py-4 sm:py-5 text-base font-bold text-[var(--color-heading)] border-blue-200 hover:border-blue-400 transition-colors min-h-15 sm:min-h-16 w-full sm:w-auto"
            >
              Contact Admissions
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-4">
            {data.metrics.map((metric, index) => (
              <article key={metric.label} className="surface rounded-[1.25rem] p-4 sm:p-5 text-center lg:text-left border-b-4 border-blue-600 hover:-translate-y-1 transition-all">
                <div className="flex flex-col">
                  <CountUpValue
                    value={metric.value}
                    className="text-2xl sm:text-xl lg:text-2xl font-bold tracking-tight text-blue-700"
                  />
                  <p className="mt-1 text-xs sm:text-sm font-bold text-[var(--color-heading)]">{metric.label}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 opacity-80 grayscale hover:grayscale-0 transition-all justify-center lg:justify-start">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">Recognized By</p>
            <div className="flex flex-wrap gap-4 sm:gap-8 items-center justify-center">
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap">ISO 9001:2015</span>
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap">MSME Certified</span>
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap">Digital India</span>
            </div>
          </div>

          <div className="pt-10 border-t border-[var(--color-border)] mt-10">
            <div className="relative isolate overflow-hidden rounded-4xl p-6 sm:p-10 shadow-xl transition-all duration-500 hover:shadow-blue-500/10 border border-blue-100 dark:border-blue-900/30 group bg-white dark:bg-slate-950">
              <div className="absolute top-0 right-0 -z-10 h-100 w-100 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/30 transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 blur-[80px] rounded-full -translate-x-1/4 translate-y-1/4 group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />
              
              <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-10 items-center text-center lg:text-left">
                <div className="max-w-2xl mx-auto lg:mx-0">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-widest mb-6">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                    Limited Slots for 2026-27
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                    Ready to Start Your <span className="text-blue-600 dark:text-blue-400">Journey?</span>
                  </h3>
                  <p className="text-lg text-[var(--color-muted)] mb-0 leading-relaxed font-medium">
                    Join 500+ students already excelling with Smart Tutors. Get access to expert mentoring and disciplined preparation.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[240px] justify-center lg:justify-start">
                  <Link 
                    href="/login" 
                    className="group/btn relative inline-flex h-14 items-center justify-center gap-3 bg-blue-600 text-white px-8 rounded-xl font-black text-base transition-all hover:bg-blue-700 hover:scale-[1.02] shadow-xl shadow-blue-500/25 active:scale-95 overflow-hidden"
                  >
                    Enroll Now
                  </Link>
                  
                  <a 
                    href="https://wa.me/918850447887" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex h-14 items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-8 rounded-xl font-black text-base border-2 border-emerald-100 dark:border-emerald-800/50 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:scale-[1.02] active:scale-95"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="grid min-w-0 gap-4" delayMs={90}>
          <div className="surface graph-paper rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <p className="section-label">Campus Highlights</p>
                <h2 className="section-title text-xl sm:text-xl mt-2 text-left">
                  Visible trust, visible outcomes
                </h2>
              </div>
              <LiveClock label="Campus Time" className="sm:min-w-[220px]" />
            </div>

            <CampusHighlightsCarousel />
          </div>

          <div className="surface rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="mb-8">
              <p className="section-label">Why Smart Tutors</p>
              <h2 className="section-title text-2xl sm:text-3xl mt-2 text-left">
                A legacy of academic growth
              </h2>
            </div>
            <div className="mt-5 grid gap-3">
              {data.headlineLines.map((line) => (
                <div key={line} className="surface-soft rounded-xl px-4 py-3 border-l-4 border-blue-500 hover:bg-blue-50 transition-colors">
                  <p className="text-sm font-bold tracking-[0.04em] text-[var(--color-heading)]">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <RevealOnScroll className="section-shell py-20 lg:py-32" delayMs={100}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
              Our Methodology
            </span>
            <h2 className="text-4xl font-black tracking-tight text-[var(--color-heading)] sm:text-5xl mb-6">
              Programs Mapped to Every Stage of Growth
            </h2>
            <p className="text-[var(--color-muted)] text-lg font-medium">
              We provide a complete educational pathway from school foundation to high-level government service and future digital skills.
            </p>
          </div>

          <ProgramCarousel programs={data.programs} />
          
          <div className="mt-16 text-center">
            <Link href="/courses" className="action-button px-10 py-5 text-lg shadow-2xl">
              Explore All {courseLibrary.length}+ Programs
            </Link>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="section-shell py-14" delayMs={60}>
        <div className="mb-9 text-center lg:text-left">
          <p className="section-label">Exclusive Features</p>
          <h2 className="section-title">Beyond coaching: Total student empowerment.</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="surface rounded-xl p-8 border-t-8 border-[var(--color-purple)] hover:translate-y-[-8px] hover:shadow-2xl transition-all group">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-purple)] text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-heading)] mb-3">AI Powered Analytics</h3>
            <p className="text-sm leading-7 text-[var(--color-muted)] font-medium">
              Track your progress with machine learning insights. We identify your weak areas before you even notice them.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--color-purple)] font-bold text-sm group-hover:translate-x-2 transition-transform">
              Learn More <span>→</span>
            </div>
          </div>

          <div className="surface rounded-xl p-8 border-t-8 border-[var(--color-amber)] hover:translate-y-[-8px] hover:shadow-2xl transition-all group">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-amber)] text-white shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-heading)] mb-3">Digital Library</h3>
            <p className="text-sm leading-7 text-[var(--color-muted)] font-medium">
              Access 5000+ curated resources, video lectures, and previous year papers anywhere, anytime.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--color-amber)] font-bold text-sm group-hover:translate-x-2 transition-transform">
              Explore Library <span>→</span>
            </div>
          </div>

          <div className="surface rounded-xl p-8 border-t-8 border-[var(--color-rose)] hover:translate-y-[-8px] hover:shadow-2xl transition-all group">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-rose)] text-white shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-heading)] mb-3">1-on-1 Mentoring</h3>
            <p className="text-sm leading-7 text-[var(--color-muted)] font-medium">
              Connect with alumni and industry experts for personalized guidance on your career path.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--color-rose)] font-bold text-sm group-hover:translate-x-2 transition-transform">
              Meet Mentors <span>→</span>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <div className="section-shell py-10">
        <StudentCarousel />
      </div>

      <section className="py-20 bg-slate-50 dark:bg-slate-950/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
              Academic Excellence
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[var(--color-heading)] mb-6">
              Recent Results
            </h2>
            <p className="text-[var(--color-muted)] text-lg font-medium max-w-2xl mx-auto">
              Smart Tutors honors the dedication and remarkable achievements of our students. Our proven track record defines our commitment to academic brilliance.
            </p>
          </div>

          <GrandSuccessCarousel />
        </div>
      </section>

      <RevealOnScroll className="section-shell py-14" delayMs={40}>
        <div className="mb-9 text-center lg:text-left">
          <p className="section-label">Roles</p>
          <h2 className="section-title">One system for students, teachers, and institute operations.</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {homeRoles.map((role) => (
            <article
              key={role.role}
              className={`surface rounded-xl bg-gradient-to-br ${roleAccentMap[role.role as keyof typeof roleAccentMap]} p-6 text-center lg:text-left hover:shadow-2xl hover:translate-y-[-4px] transition-all border-blue-100/50 flex flex-col h-full`}
            >
              <p className="keyword-line uppercase tracking-widest text-[10px] font-black">{role.role}</p>
              <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--color-heading)]">
                {role.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] font-medium flex-grow">
                {role.summary}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[var(--color-heading)] font-bold">
                {role.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="section-shell py-14" delayMs={80}>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface rounded-xl p-8 hover:shadow-xl transition-all">
            <div className="mb-8">
              <p className="section-label">Latest Educational Insights</p>
              <h2 className="section-title">Stay updated with the academic world</h2>
            </div>
            
            <div className="space-y-6">
              <div className="surface-soft rounded-xl p-6 border-l-4 border-blue-600 hover:bg-blue-50 transition-colors">
                <span className="pill mb-3 bg-blue-100 text-blue-700 border-none font-bold">Exams 2026</span>
                <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2">CBSE Board Exam Phase 2 Schedule</h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                  Phase 2 (Improvement/Compartment) exams for Class 10 are scheduled from May 15 to June 1, 2026. Over 6.6 lakh students have registered for this phase.
                </p>
              </div>

              <div className="surface-soft rounded-xl p-6 border-l-4 border-indigo-600 hover:bg-indigo-50 transition-colors">
                <span className="pill mb-3 bg-indigo-100 text-indigo-700 border-none font-bold">UPSC Update</span>
                <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2">Civil Services Prelims 2026</h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                  The UPSC CSE Preliminary Exam is set for May 24, 2026. Candidates are advised to begin their final revision cycles focusing on current affairs.
                </p>
              </div>

              <div className="surface-soft rounded-xl p-6 border-l-4 border-emerald-600 hover:bg-emerald-50 transition-colors">
                <span className="pill mb-3 bg-emerald-100 text-emerald-700 border-none font-bold">NEP 2020</span>
                <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2">New AI-Integrated Curriculum</h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                  Computational thinking and basic Artificial Intelligence have been integrated into the curriculum starting from Class 3 for the 2026-27 session.
                </p>
              </div>
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article className="relative overflow-hidden rounded-[1.5rem] p-10 bg-gradient-to-br from-[#1e40af] via-[#3730a3] to-[#4338ca] text-white shadow-2xl hover:scale-[1.02] transition-all group">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all"></div>
              <p className="text-blue-200 text-sm font-black uppercase tracking-[0.2em] mb-3 relative z-10">Promotional Offer</p>
              <h2 className="text-4xl font-black leading-tight mb-4 drop-shadow-md relative z-10">Advance Your Career with Smart Tutors</h2>
              <p className="text-blue-50 text-lg leading-relaxed mb-8 font-medium relative z-10">
                Join our specialized coaching programs and get access to exclusive mock tests, personal mentoring, and board-certified study materials.
              </p>
              <ul className="space-y-4 mb-10 relative z-10">
                {["Personalized Learning Path", "Expert Faculty Support", "Weekly Mock Assessments", "Comprehensive Study Material"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base font-bold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400/30 text-blue-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="inline-flex items-center justify-center w-full py-5 bg-white text-blue-800 font-black text-lg rounded-xl hover:bg-blue-50 transition-all hover:scale-105 shadow-xl relative z-10">
                Book a Consultation
              </Link>
            </article>
          </div>
        </div>
      </RevealOnScroll>
    </main>
  );
}
