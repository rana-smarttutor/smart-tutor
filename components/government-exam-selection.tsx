"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, ArrowRight } from "lucide-react";

type ExamOption = {
  slug: string;
  name: string;
  description: string;
};

type Props = {
  title: string;
  exams: ExamOption[];
};

export default function GovernmentExamSelection({ title, exams }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(exams[0]?.slug ?? "");

  const selectedExam = exams.find((exam) => exam.slug === selectedSlug);

  if (!exams.length) return null;

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-extrabold text-[#102143] sm:text-2xl">
        Select Your {title}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Choose the examination you want to prepare for.
      </p>

      <div
        role="group"
        aria-label={`Select ${title}`}
        className="mt-6 grid gap-3 sm:grid-cols-2"
      >
        {exams.map((exam) => {
          const selected = selectedSlug === exam.slug;

          return (
            <button
              key={exam.slug}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedSlug(exam.slug)}
              className={`group flex min-h-[85px] items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                selected
                  ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100"
                  : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600"
                  }`}
                >
                  <BookOpen size={23} />
                </div>

                <span className="text-sm font-extrabold text-[#102143] sm:text-base">
                  {exam.name}
                </span>
              </div>

              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selected && <Check size={16} />}
              </span>
            </button>
          );
        })}
      </div>

      {selectedExam && (
        <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <h3 className="text-xl font-extrabold text-[#102143]">
            {selectedExam.name}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {selectedExam.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/courses/${selectedExam.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              View Course <ArrowRight size={16} />
            </Link>

            <Link
              href={`/courses?enquire=${encodeURIComponent(selectedExam.slug)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Enroll Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
