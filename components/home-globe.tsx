"use client";

import Image from "next/image";

import { RevealOnScroll } from "@/components/reveal-on-scroll";

const resultHighlights = [
  {
    name: "Aarohi Mehta",
    exam: "Class 10 Boards",
    result: "96.2%",
    year: "2025",
    note: "Consistent chapter tests and evening mentoring helped convert strong effort into confident board performance.",
  },
  {
    name: "Devansh Kulkarni",
    exam: "HSC Science",
    result: "94.8%",
    year: "2025",
    note: "Weekly test review and disciplined revision built the consistency needed for senior secondary success.",
  },
  {
    name: "Sakshi Patil",
    exam: "MPSC Foundation",
    result: "Prelims Cleared",
    year: "2024",
    note: "Answer-writing practice, polity revision, and current affairs structure sharpened her exam readiness.",
  },
  {
    name: "Harsh Vora",
    exam: "Banking Exams",
    result: "IBPS PO Interview",
    year: "2024",
    note: "Speed drills and mock analysis turned aptitude practice into competitive confidence.",
  },
];

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

            <div className="mt-6 grid gap-4">
              {resultHighlights.map((item) => (
                <article key={`${item.name}-${item.exam}`} className="surface-soft rounded-[1.65rem] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-[var(--color-heading)]">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {item.exam} | {item.result}
                      </p>
                    </div>
                    <span className="pill">{item.year}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{item.note}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-4">
            <div className="media-slot rounded-[1.8rem] p-4 sm:p-5">
              <p className="keyword-line">Result collage</p>
              <div className="media-frame relative mt-4 aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/image.png"
                  alt="Smart Tutors topper showcase"
                  fill
                  className="object-cover object-center"
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
