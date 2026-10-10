
"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Heart,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type DataObject = Record<string, unknown>;

function asObject(value: unknown): DataObject {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as DataObject)
    : {};
}

function formatValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value.trim() || "Not provided";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const items = value
      .filter(
        (item) =>
          typeof item === "string" ||
          typeof item === "number",
      )
      .map(String);

    return items.length
      ? items.join(", ")
      : "Not provided";
  }

  return "Not provided";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {formatValue(value)}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  data,
  fields,
}: {
  title: string;
  icon: ReactNode;
  data: DataObject;
  fields: Array<[string, string]>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700">
          {icon}
        </div>

        <h3 className="text-base font-extrabold text-[#0B1F4B]">
          {title}
        </h3>
      </div>

      <dl className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {fields.map(([key, label]) => (
          <DetailRow
            key={key}
            label={label}
            value={data[key]}
          />
        ))}
      </dl>
    </section>
  );
}

const ABOUT_FIELDS: Array<[string, string]> = [
  ["filledBy", "Form completed by"],
  ["educationStage", "Education stage"],
  ["studentName", "Student name"],
  ["dateOfBirth", "Date of birth"],
  ["gender", "Gender"],
  ["mobile", "Mobile number"],
  ["email", "Email"],
  ["city", "City"],
  ["language", "Language"],
  ["guardianName", "Parent / guardian name"],
  ["guardianRelation", "Relationship"],
  ["guardianMobile", "Guardian mobile"],
];

const EDUCATION_FIELDS: Array<
  [string, string]
> = [
  ["currentClass", "Current class"],
  ["board", "Board"],
  ["institution", "School / institution"],
  ["recentScore", "Recent academic score"],
  ["class10Score", "Class 10 score"],
  ["class12Score", "Class 12 score"],
  ["degree", "Degree / qualification"],
  ["currentStream", "Current stream"],
  ["tuition", "Attends tuition"],
  ["strongSubjects", "Strong subjects"],
  ["weakSubjects", "Subjects needing support"],
  ["entranceExams", "Entrance exams"],
];

const INTEREST_FIELDS: Array<
  [string, string]
> = [
  ["areas", "Interest areas"],
  ["careerGoal", "Career goal"],
  ["preferredStream", "Preferred stream"],
  ["learningStyle", "Learning style"],
  ["hobbies", "Hobbies"],
  ["parentExpectations", "Parent expectations"],
  ["constraints", "Practical constraints"],
];

const ROUTINE_FIELDS: Array<
  [string, string]
> = [
  ["sleepHours", "Sleep hours"],
  ["schoolHours", "School / college hours"],
  ["selfStudyHours", "Self-study hours"],
  ["tuitionHours", "Tuition hours"],
  ["screenHours", "Screen-time hours"],
  ["physicalHours", "Physical activity hours"],
  ["focusMinutes", "Focus duration (minutes)"],
  ["wakeTime", "Wake-up time"],
  ["bedtime", "Bedtime"],
  ["biggestObstacle", "Main study challenge"],
  ["preferredStudyTime", "Preferred study time"],
];

export function CareerCounsellingQuestionnaireView({
  questionnaire,
}: {
  questionnaire: unknown;
}) {
  const [expanded, setExpanded] =
    useState(true);

  const source = asObject(questionnaire);

  if (
    source.version !== 1 ||
    !source.aboutYou
  ) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-extrabold text-amber-900">
          Five-step questionnaire unavailable
        </h2>

        <p className="mt-2 text-sm text-amber-800">
          This may be an older counselling
          enquiry, or its full questionnaire
          was not saved. The existing
          enquiry details remain available below.
        </p>
      </section>
    );
  }

  const about = asObject(source.aboutYou);
  const education = asObject(source.education);
  const interests = asObject(source.interests);
  const routine = asObject(source.routine);
  const consent = asObject(source.consent);

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-200 bg-[#F4F8FF]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-5 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Saved student questionnaire
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-[#0B1F4B]">
            Complete Career Counselling Form
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Responses recorded during
            the five-step intake process.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setExpanded((old) => !old)
          }
          aria-expanded={expanded}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800"
        >
          {expanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}

          {expanded
            ? "Collapse"
            : "View full answers"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 p-4 sm:p-5">
          <DetailSection
            title="1. About You"
            icon={<UserRound size={18} />}
            data={about}
            fields={ABOUT_FIELDS}
          />

          <DetailSection
            title="2. Education"
            icon={<GraduationCap size={18} />}
            data={education}
            fields={EDUCATION_FIELDS}
          />

          <DetailSection
            title="3. Interests & Goals"
            icon={<Heart size={18} />}
            data={interests}
            fields={INTEREST_FIELDS}
          />

          <DetailSection
            title="4. Routine & Study Habits"
            icon={<Clock3 size={18} />}
            data={routine}
            fields={ROUTINE_FIELDS}
          />

          <DetailSection
            title="5. Consent & Submission"
            icon={<ShieldCheck size={18} />}
            data={{
              guardianConsent:
                about.guardianConsent,
              privacyAccepted:
                about.privacyAccepted,
              aiConsent:
                consent.aiConsent,
              whatsappConsent:
                consent.whatsappConsent,
            }}
            fields={[
              [
                "guardianConsent",
                "Guardian consent recorded",
              ],
              [
                "privacyAccepted",
                "Privacy acknowledgement",
              ],
              [
                "aiConsent",
                "AI analysis consent",
              ],
              [
                "whatsappConsent",
                "WhatsApp sharing consent",
              ],
            ]}
          />

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <BookOpen size={15} />
            These are the submitted answers.
            The editor below manages the
            existing counselling assessment.
          </p>
        </div>
      )}
    </section>
  );
}
