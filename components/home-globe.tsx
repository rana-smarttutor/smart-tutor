"use client";

import Image from "next/image";

import { RevealOnScroll } from "@/components/reveal-on-scroll";

const outcomeMetrics = [
  { label: "School to civil services", value: "Full Ladder" },
  { label: "Progress review", value: "Weekly" },
  { label: "Topper visibility", value: "Year-round" },
];

export function HomeGlobe() {
  return (
    <section className="section-shell py-10">
      <RevealOnScroll className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="min-w-0">
            <p className="section-label">Results Showcase</p>
            <h2 className="section-title mt-0">Toppers and achievers across every stage</h2>
            <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              Smart Tutors works with school students, higher secondary learners, and serious aspirants. This section brings that range together with visible outcomes that parents and students can trust.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {outcomeMetrics.map((metric) => (
                <div key={metric.label} className="surface-soft rounded-[1.5rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-3 break-words text-2xl font-semibold text-[var(--color-heading)]">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-4">
            <div className="media-slot rounded-[1.8rem] p-4 sm:p-5">
              <p className="keyword-line">Result collage</p>
              <div className="media-frame relative mt-4 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50">
                <Image
                  src="/result-1.jpeg"
                  alt="Smart Tutors topper showcase"
                  fill
                  loading="lazy"
                  className="object-contain object-center group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="surface-soft rounded-[1.8rem] p-5">
              <p className="text-sm font-semibold text-[var(--color-heading)]">What these outcomes represent</p>
              <div className="mt-4 grid gap-3">
                <div className="surface rounded-3xl p-4 text-sm leading-6 text-[var(--color-muted)]">
                  School batches receive concept clarity, worksheet discipline, and regular parent communication.
                </div>
                <div className="surface rounded-3xl p-4 text-sm leading-6 text-[var(--color-muted)]">
                  Senior secondary and college-focused learners get stronger testing rhythm, revision planning, and academic mentoring.
                </div>
                <div className="surface rounded-3xl p-4 text-sm leading-6 text-[var(--color-muted)]">
                  Competitive aspirants move through structured mocks, analysis, and long-term preparation with faculty guidance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
