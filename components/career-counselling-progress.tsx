
import Link from "next/link";

import {
  Check,
  ShieldCheck,
} from "lucide-react";

const STEPS = [
  "About you",
  "Education",
  "Interests and goals",
  "Routine and study habits",
  "Review",
];

export function CareerCounsellingProgress({
  activeStep,
  stageLabel,
}: {
  activeStep: number;
  stageLabel?: string;
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
      <Link
        href="/career-counselling"
        className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#2563EB] hover:underline"
      >
        Career counselling
      </Link>

      <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#0B1F4B]">
        Your career plan
      </h1>

      {stageLabel && (
        <p className="mt-2 text-sm leading-5 text-[#4A5872]">
          Showing questions for:{" "}
          <strong>{stageLabel}</strong>
        </p>
      )}

      <div className="mt-7 text-xs font-bold text-[#4A5872]">
        Stage 1 · Counselling form
      </div>

      <ol className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-1">
        {STEPS.map((title, index) => {
          const number = index + 1;
          const complete =
            number < activeStep;
          const active =
            number === activeStep;

          return (
            <li
              key={title}
              className="flex items-center gap-2.5 text-sm"
            >
              <span
                aria-current={
                  active
                    ? "step"
                    : undefined
                }
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-xs font-bold ${
                  complete
                    ? "border-[#0B1F4B] bg-[#0B1F4B] text-white"
                    : active
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-[#C5CFE0] bg-white text-[#8593AD]"
                }`}
              >
                {complete ? (
                  <Check size={15} />
                ) : (
                  number
                )}
              </span>

              <span
                className={
                  active
                    ? "font-bold text-[#0B1F4B]"
                    : "text-[#4A5872]"
                }
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 border-t border-[#C5CFE0] pt-5">
        <p className="text-xs font-bold text-[#4A5872]">
          Stage 2 · Aptitude test{" "}
          <span className="font-normal">
            (optional)
          </span>
        </p>

        <p className="mt-3 text-xs font-bold text-[#4A5872]">
          Stage 3 · Result and report{" "}
          <span className="font-normal">
            (optional)
          </span>
        </p>
      </div>

      <div className="mt-7 flex items-start gap-2 rounded-lg border border-[#C5CFE0] bg-white p-3 text-xs leading-5 text-[#4A5872]">
        <ShieldCheck
          size={17}
          className="mt-0.5 shrink-0 text-[#2563EB]"
        />

        Please avoid using a shared device
        when entering personal information.
      </div>
    </aside>
  );
}
