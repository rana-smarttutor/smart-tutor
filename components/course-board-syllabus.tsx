"use client";

import { useState } from "react";
import { BookOpen, Check, ChevronDown, GraduationCap } from "lucide-react";

import {
  getSchoolBoardSyllabus,
  type JuniorStream,
  type SchoolBoard,
} from "@/lib/course-board-syllabus";

type Props = {
  grade: number;
};

const BOARD_OPTIONS: {
  value: SchoolBoard;
  label: string;
}[] = [
  {
    value: "maharashtra",
    label: "Maharashtra State Board",
  },
  {
    value: "cbse",
    label: "CBSE Board",
  },
];

const STREAM_OPTIONS: {
  value: JuniorStream;
  label: string;
}[] = [
  { value: "science", label: "Science" },
  { value: "commerce", label: "Commerce" },
  { value: "arts", label: "Arts / Humanities" },
];

export default function CourseBoardSyllabus({ grade }: Props) {
  const [board, setBoard] = useState<SchoolBoard>("maharashtra");

  const [stream, setStream] = useState<JuniorStream>("science");

  const isJuniorCollege = grade >= 11;

  const subjects = getSchoolBoardSyllabus(grade, board, stream);

  const boardTitle =
    board === "cbse"
      ? "CBSE"
      : grade <= 8
        ? "Maharashtra State Board"
        : grade <= 10
          ? "Maharashtra SSC"
          : "Maharashtra HSC";

  return (
    <section
      id="course-syllabus"
      className="scroll-mt-20"
      aria-labelledby="course-syllabus-title"
    >
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
          <GraduationCap size={16} />
          Class {grade} Syllabus
        </span>

        <h2
          id="course-syllabus-title"
          className="mt-4 text-2xl font-black tracking-tight text-[#102143] sm:text-3xl"
        >
          Explore Your Subjects
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Select your education board
          {isJuniorCollege ? " and academic stream" : ""} to explore
          subject-wise learning topics.
        </p>
      </div>

      {/* BOARD SELECTION */}
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="mb-4 text-base font-extrabold text-[#102143]">
          Select Your Board
        </h3>

        <div
          role="group"
          aria-label="Select education board"
          className="grid gap-3 sm:grid-cols-2"
        >
          {BOARD_OPTIONS.map((option) => {
            const selected = board === option.value;

            const label =
              option.value === "cbse"
                ? "CBSE Board"
                : grade <= 8
                  ? "Maharashtra State Board"
                  : grade <= 10
                    ? "Maharashtra SSC Board"
                    : "Maharashtra HSC Board";

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setBoard(option.value)}
                className={`group flex min-h-[80px] items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  selected
                    ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100"
                    : "border-slate-200 bg-slate-50 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 group-hover:bg-blue-100"
                    }`}
                  >
                    <BookOpen size={22} />
                  </span>

                  <span className="font-extrabold leading-snug text-[#102143]">
                    {label}
                  </span>
                </div>

                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check size={14} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* STREAM SELECTION FOR CLASSES 11–12 */}
        {isJuniorCollege && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-base font-extrabold text-[#102143]">
              Select Your Stream
            </h3>

            <div
              role="group"
              aria-label="Select academic stream"
              className="grid gap-3 sm:grid-cols-3"
            >
              {STREAM_OPTIONS.map((option) => {
                const selected = stream === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStream(option.value)}
                    className={`rounded-xl border-2 px-4 py-4 text-sm font-extrabold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELECTED BOARD HEADER */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-[#102143]">
            {boardTitle} — Class {grade}
            {isJuniorCollege
              ? ` — ${stream === "arts" ? "Arts" : stream === "science" ? "Science" : "Commerce"}`
              : ""}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {subjects.length} subject boxes available
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
          {boardTitle}
        </span>
      </div>

      {/* SUBJECT CARDS */}
      <div
        key={`${grade}-${board}-${stream}`}
        className="mt-5 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {subjects.map((subject, index) => (
          <article
            key={`${subject.subject}-${index}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen size={21} />
                </span>

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                    Subject {String(index + 1).padStart(2, "0")}
                  </p>

                  <h4 className="mt-1 break-words text-base font-extrabold leading-snug text-[#102143]">
                    {subject.subject}
                  </h4>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              {subject.topics.slice(0, 3).join(" · ")}
            </p>

            <details className="group mt-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                View all topics
                <ChevronDown
                  size={15}
                  className="transition-transform duration-200 group-open:rotate-180"
                />
              </summary>

              <ul className="mt-4 list-disc space-y-2 border-t border-slate-100 pt-4 pl-5 text-sm leading-6 text-slate-600">
                {subject.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
