"use client";

import CourseExamGuide from "@/components/course-exam-guide";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
} from "lucide-react";

type JeeExam = "main" | "advanced";

const JEE_OPTIONS = [
  {
    id: "main",
    name: "JEE Main",
    subtitle: "Engineering Entrance Examination",
    description:
      "Prepare for JEE Main with strong conceptual foundations, objective-question practice, numerical problem solving, revision and time management.",
    subjects: [
      {
        name: "Physics",
        topics: [
          "Mechanics",
          "Thermodynamics",
          "Electrostatics and Current Electricity",
          "Magnetism",
          "Optics",
          "Modern Physics",
        ],
      },
      {
        name: "Chemistry",
        topics: [
          "Physical Chemistry",
          "Organic Chemistry",
          "Inorganic Chemistry",
          "Chemical Bonding",
          "Equilibrium",
          "Coordination Compounds",
        ],
      },
      {
        name: "Mathematics",
        topics: [
          "Algebra",
          "Coordinate Geometry",
          "Calculus",
          "Trigonometry",
          "Vectors and 3D Geometry",
          "Probability and Statistics",
        ],
      },
    ],
  },
  {
    id: "advanced",
    name: "JEE Advanced",
    subtitle: "IIT Entrance Examination",
    description:
      "Focus on advanced conceptual understanding, multi-step problem solving, analytical reasoning and challenging examination-style questions.",
    subjects: [
      {
        name: "Physics",
        topics: [
          "Advanced Mechanics",
          "Rotational Motion",
          "Electromagnetism",
          "Thermodynamics",
          "Wave Motion and Optics",
          "Modern Physics",
        ],
      },
      {
        name: "Chemistry",
        topics: [
          "Physical Chemistry Problem Solving",
          "Organic Reaction Mechanisms",
          "Inorganic Chemistry",
          "Chemical Equilibrium",
          "Electrochemistry",
          "Coordination Chemistry",
        ],
      },
      {
        name: "Mathematics",
        topics: [
          "Advanced Algebra",
          "Functions and Equations",
          "Differential and Integral Calculus",
          "Coordinate Geometry",
          "Vectors and 3D Geometry",
          "Complex Numbers and Probability",
        ],
      },
    ],
  },
] as const;

export default function JeeExamSelection() {
  const [selectedId, setSelectedId] =
    useState<JeeExam>("main");

  const selectedExam =
    JEE_OPTIONS.find((exam) => exam.id === selectedId) ??
    JEE_OPTIONS[0];

  return (
    <section
      id="jee-exam-selection"
      aria-labelledby="jee-selection-title"
      className="scroll-mt-24"
    >
      <div className="mb-6">
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
          JEE Preparation
        </span>

        <h2
          id="jee-selection-title"
          className="mt-4 text-2xl font-black tracking-tight text-[#102143] sm:text-3xl"
        >
          Select Your JEE Examination
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          Choose JEE Main or JEE Advanced to explore the
          relevant preparation focus and subject areas.
        </p>
      </div>

      {/* JEE SELECTION CARDS */}
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div
          role="group"
          aria-label="Select JEE examination"
          className="grid gap-3 sm:grid-cols-2"
        >
          {JEE_OPTIONS.map((exam) => {
            const selected = selectedId === exam.id;

            return (
              <button
                key={exam.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedId(exam.id)}
                className={`group flex min-h-[95px] items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  selected
                    ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100"
                    : "border-slate-200 bg-slate-50 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 group-hover:bg-blue-100"
                    }`}
                  >
                    <BookOpen size={23} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-base font-extrabold text-[#102143]">
                      {exam.name}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {exam.subtitle}
                    </span>
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
      </div>

      {/* SELECTED EXAM INFORMATION */}
      <div
        key={selectedExam.id}
        className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <GraduationCap size={25} />
          </span>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Selected Examination
            </p>

            <h3 className="text-xl font-black text-[#102143]">
              {selectedExam.name}
            </h3>
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
          {selectedExam.description}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {selectedExam.subjects.map((subject) => (
            <article
              key={subject.name}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h4 className="font-extrabold text-[#102143]">
                {subject.name}
              </h4>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                {subject.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <a
            href="#course-syllabus"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Explore Full Course Syllabus
            <ArrowRight size={17} />
          </a>

          <Link
            href="/courses?enquire=jee-coaching"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Enroll Now
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>      <div className="mt-8">
        <CourseExamGuide
          key={selectedId}
          slug={selectedId === "main" ? "jee-main" : "jee-advanced"}
          courseName={selectedExam.name}
          category="Entrance Exams"
          subjects={selectedExam.subjects.map((subject) => ({
            subject: subject.name,
            topics: [...subject.topics],
          }))}
        />
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">These are indicative preparation areas. Refer to the
        current official examination syllabus for the complete
        chapter list and examination requirements.
      </p>
    </section>
  );
}
