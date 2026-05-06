import Link from "next/link";
import Image from "next/image";

import { CountUpValue } from "@/components/count-up-value";
import { HomeGlobe } from "@/components/home-globe";
import { LiveClock } from "@/components/live-clock";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getPublicInstituteData } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const roleAccentMap = {
  student: "from-violet-50 to-white",
  educator: "from-violet-50 to-white",
  admin: "from-violet-50 to-white",
} as const;

export default async function Home() {
  const data = await getPublicInstituteData();

  return (
    <main className="relative overflow-hidden pb-16 pt-8">
      <section className="section-shell grid gap-8 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <RevealOnScroll className="space-y-7 text-center lg:text-left"> 
          <div className="surface-soft inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--color-muted)] lg:justify-start">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
            Admissions | Exams | Placement
          </div>

          <div className="surface-soft inline-flex items-center justify-center gap-2 rounded-full ml-2 px-4 py-2 text-sm text-[var(--color-muted)] lg:justify-start">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
            Vashi's results-driven coaching campus
          </div> 

          <div className="space-y-5">
            <p className="keyword-line">
              Competitive exams | Placements | Academic support
            </p>
            <h1 className="mx-auto max-w-5xl text-5xl font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--color-heading)] sm:text-6xl xl:mx-0 xl:text-6xl">
              Serious coaching for exams, careers, and academic wins.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--color-muted)] xl:mx-0">
              Smart Tutor brings disciplined preparation, sharp mentoring, live testing, and real academic momentum into one focused institute experience.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:items-start lg:justify-start">
            <Link href="/login" className="action-button justify-center px-6 py-4 text-base">
              Start Exploring
            </Link>
            <Link
              href="/courses"
              className="surface-soft inline-flex items-center justify-center rounded-full px-6 py-4 text-base font-semibold text-[var(--color-heading)]"
            >
              Browse Courses
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric, index) => (
              <article key={metric.label} className="surface-soft rounded-3xl p-5 text-center lg:text-left">
                <CountUpValue
                  value={metric.value}
                  className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]"
                />
                <p className="mt-2 text-sm text-[var(--color-muted)]">{metric.label}</p>
              </article>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="grid min-w-0 gap-4" delayMs={90}>
          <div className="surface graph-paper rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-label">Campus Highlights</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                  Visible trust, visible outcomes
                </h2>
              </div>
              <LiveClock label="Campus Time" className="sm:min-w-[220px]" />
            </div>

            <div className="mt-6 grid min-w-0 gap-4 px-2 sm:px-0 md:grid-cols-2">
              <div className="media-slot rounded-[1.75rem] p-5 sm:p-6">
                <p className="keyword-line">Institute identity</p>
                <div className="media-frame relative mt-4 aspect-square overflow-hidden rounded-[1.5rem] sm:h-52 sm:aspect-auto md:h-44">
                  <Image
                    src="/image1.png"
                    alt="Smart Tutor academy identity"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              <div className="media-slot rounded-[1.75rem] p-5 sm:p-6">
                <p className="keyword-line">Result showcase</p>
                <div className="media-frame relative mt-4 aspect-[4/5] overflow-hidden rounded-[1.5rem] sm:h-52 sm:aspect-auto md:h-44">
                  <Image
                    src="/image.png"
                    alt="Smart Tutor topper and result showcase"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="surface rounded-[2rem] p-6">
            <p className="section-label">Why Smart Tutor</p>
            <div className="mt-5 grid gap-3">
              {data.headlineLines.map((line) => (
                <div key={line} className="surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm font-semibold tracking-[0.04em] text-[var(--color-accent-strong)]">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <HomeGlobe />

      <RevealOnScroll className="section-shell py-14">
        <div className="mb-9 text-center lg:text-left">
          <p className="section-label">Programs</p>
          <h2 className="section-title">Programs mapped to every stage of growth</h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted)] lg:mx-0">
            Choose the pathway that matches your class, target exam, or long-term academic goal.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {data.programs.map((program, index) => (
            <article
              key={program.title}
              className="surface rounded-[2rem] p-7"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="keyword-line">{program.category}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-heading)]">
                    {program.title}
                  </h3>
                </div>
                <span className="pill">{program.duration}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                {program.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {program.focus.map((tag) => (
                  <span
                    key={tag}
                    className="surface-soft rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-heading)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="section-shell py-14" delayMs={40}>
        <div className="mb-9 text-center lg:text-left">
          <p className="section-label">Roles</p>
          <h2 className="section-title">One system for students, teachers, and institute operations.</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {data.roles.map((role, index) => (
            <article
              key={role.role}
              className={`surface rounded-[2rem] bg-gradient-to-br ${roleAccentMap[role.role]} p-6 text-center lg:text-left`}
            >
              <p className="keyword-line">{role.role}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-heading)]">
                {role.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                {role.summary}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[var(--color-heading)]">
                {role.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="section-shell py-14" delayMs={80}>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="surface rounded-[2rem] p-7 text-center lg:text-left">
            <p className="section-label">Campus Experience</p>
            <h2 className="section-title max-w-2xl">
              Built to reassure parents and motivate aspirants
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {data.mediaFeatures.map((item) => (
                <div key={item.title} className="surface-soft rounded-3xl p-5">
                  <p className="text-base font-semibold text-[var(--color-heading)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="surface rounded-[2rem] p-7 text-center lg:text-left">
            <p className="section-label">Experience</p>
            <h2 className="section-title">
              Serious content, clean presentation, and clear academic intent.
            </h2>
            <div className="mt-8 grid gap-4">
              {data.designPrinciples.map((principle) => (
                <div key={principle.title} className="surface-soft rounded-3xl p-5">
                  <p className="text-lg font-semibold text-[var(--color-heading)]">
                    {principle.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </RevealOnScroll>
    </main>
  );
}
