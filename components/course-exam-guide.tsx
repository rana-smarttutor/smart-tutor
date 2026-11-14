import {
  BookOpenText,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import {
  defaultExamStages,
  examGuideFacts,
  type ExamGuideFacts,
} from "@/lib/course-exam-guide-data";
import supplemental from "@/data/quiz-exam-syllabus-supplement-2026.json";
import {
  getVerifiedExamSchedules,
  type ExamScheduleEventType,
} from "@/lib/verified-exam-schedules";

type TopicSubject = { subject: string; topics: string[] };

type Props = {
  slug: string;
  courseName: string;
  category: string;
  subjects: TopicSubject[];
};

const supplementalEntries = supplemental.entries as Array<{
  exam: string;
  title: string;
  subjects: TopicSubject[];
  sourceUrl?: string;
  verification?: string;
}>;

const SUPPORTED_EXAM_CATEGORIES = new Set([
  "Entrance Exams",
  "Government Exams",
]);

function present(value: string | number | undefined): string {
  return value === undefined || value === ""
    ? "Pending official verification"
    : String(value);
}

const EVENT_LABELS: Record<ExamScheduleEventType, string> = {
  exam: "Examination",
  "application-start": "Applications open",
  "application-deadline": "Application deadline",
  "admit-card": "Admit card",
  "answer-key": "Answer key",
  result: "Result",
};

function formatScheduleDate(date: string): string {
  // Date-only values are formatted in UTC to avoid local timezone shifts.
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default function CourseExamGuide({
  slug,
  courseName,
  category,
  subjects,
}: Props) {
  const isExam = SUPPORTED_EXAM_CATEGORIES.has(category);
  const facts: ExamGuideFacts | undefined = examGuideFacts[slug];
  const additional = supplementalEntries.find((entry) => entry.exam === slug);
  const topics = subjects.some((subject) => subject.topics.length > 0)
    ? subjects
    : (additional?.subjects ?? subjects);
  const officialUrl = facts?.officialUrl ?? additional?.sourceUrl;
  const cycleYear = /^20\d{2}$/.test(facts?.cycle ?? "")
    ? Number(facts?.cycle)
    : undefined;
  const verifiedEvents = isExam
    ? getVerifiedExamSchedules(slug, cycleYear)
    : [];
  const verifiedExamDates = verifiedEvents.filter(
    (event) => event.eventType === "exam",
  );

  return (
    <section id="course-syllabus" className="scroll-mt-24 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
          {isExam ? "Detailed examination guide" : "Detailed course guide"}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {courseName}: Syllabus and{" "}
          {isExam ? "Exam Information" : "Learning Plan"}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Expand each subject to view its topic-wise outline. Exam dates, marks
          and stages are exam-specific and are only populated when a reviewed
          source is available.
        </p>
      </div>

      {isExam && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Exam cycle",
                value: facts?.cycle ?? "Confirm with exam authority",
                icon: CalendarDays,
              },
              {
                label: "Total marks",
                value: present(facts?.totalMarks),
                icon: ClipboardList,
              },
              {
                label: "Total questions",
                value: present(facts?.totalQuestions),
                icon: ListChecks,
              },
              {
                label: "Exam duration",
                value: present(facts?.duration),
                icon: CalendarDays,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-base font-bold leading-6 text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Exam Dates and Important Details
            </h3>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                [
                  "Exam date",
                  verifiedExamDates.length
                    ? verifiedExamDates
                        .map(
                          (event) =>
                            `${event.stage}: ${formatScheduleDate(event.startDate)}${
                              event.endDate
                                ? ` – ${formatScheduleDate(event.endDate)}`
                                : ""
                            }`,
                        )
                        .join("; ")
                    : "No verified exam date available for this cycle",
                ],
                ["Mode of examination", present(facts?.mode)],
                ["Marking scheme", present(facts?.marking)],
                [
                  "Date updates",
                  facts?.dateNote ??
                    "Follow the conducting authority’s latest official examination notice.",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm font-semibold text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {verifiedEvents.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="text-base font-bold text-slate-900">
                  Verified examination schedule
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Only independently reviewed schedule records appear below.
                  Dates can change if the conducting authority issues a
                  revision.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {verifiedEvents.map((event, index) => (
                    <div
                      key={`${event.examYear}-${event.stage}-${event.eventType}-${event.startDate}-${index}`}
                      className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        {EVENT_LABELS[event.eventType]} · {event.examYear}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {event.stage}: {formatScheduleDate(event.startDate)}
                        {event.endDate &&
                          ` – ${formatScheduleDate(event.endDate)}`}
                      </p>
                      {event.notes && (
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {event.notes}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        Reviewed:{" "}
                        {event.verifiedAt
                          ? formatScheduleDate(event.verifiedAt.slice(0, 10))
                          : "Not recorded"}
                      </p>
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                      >
                        {event.sourceTitle} <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {verifiedEvents.length === 0 && (
              <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No verified schedule has been published for this course cycle.
                Check the conducting authority for the latest notice.
              </p>
            )}
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                {facts?.sourceLabel ?? "Official examination website"}{" "}
                <ExternalLink size={15} />
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Exam Pattern & Paper and Stage-wise
            </h3>
            {facts?.pattern.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Stage / Paper</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Questions</th>
                      <th className="p-3">Marks</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facts.pattern.map((entry, index) => (
                      <tr
                        key={`${entry.stage}-${entry.subject}-${index}`}
                        className="border-t border-slate-100"
                      >
                        <td className="p-3">{entry.stage}</td>
                        <td className="p-3 font-medium">{entry.subject}</td>
                        <td className="p-3">{present(entry.questions)}</td>
                        <td className="p-3">{present(entry.marks)}</td>
                        <td className="p-3 text-slate-600">
                          {entry.notes ?? entry.duration ?? "&"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-blue-50 font-bold">
                    <tr>
                      <td className="p-3" colSpan={2}>
                        Total
                      </td>
                      <td className="p-3">{present(facts.totalQuestions)}</td>
                      <td className="p-3">{present(facts.totalMarks)}</td>
                      <td className="p-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The paper-wise questions, marks, negative marking, and
                qualifying stages have not yet been verified against this
                examination’s current official notice. They will appear here
                after review; no figures are assumed.
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <div className="flex items-center gap-3">
          <BookOpenText className="h-6 w-6 text-blue-700" />
          <h3 className="text-xl font-bold sm:text-2xl">
            Complete Subject-wise and Topic-wise Syllabus
          </h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {additional && !subjects.some((subject) => subject.topics.length > 0)
            ? "Provisional SmartIQ practice outline. Compare individual topics against the latest official examination syllabus before relying on them."
            : "Study outline from the current SmartIQ course content. Confirm official chapter coverage and weightage with the conducting board or authority."}
        </p>
        {topics.length ? (
          <div className="mt-5 columns-1 gap-4 md:columns-2">
            {topics.map((subject, index) => (
              <details
                key={`${subject.subject}-${index}`}
                className="group mb-4 w-full break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:shadow-md"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 text-base font-extrabold text-[#102143] transition-colors hover:text-blue-700">
                  <span>{subject.subject}</span>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-700 group-open:hidden">
                    +
                  </span>
                  <span className="hidden rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-700 group-open:inline">
                    -
                  </span>
                </summary>
                {subject.topics.length ? (
                  <ol className="mt-4 list-decimal space-y-2 border-t border-slate-100 pt-4 pl-5 text-sm leading-7 marker:font-semibold marker:text-blue-600 text-slate-600">
                    {subject.topics.map((topic, topicIndex) => (
                      <li key={`${topic}-${topicIndex}`}>{topic}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                    Detailed chapters are awaiting official syllabus mapping for
                    this subject.
                  </p>
                )}
              </details>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            No validated topic list is currently available for this course.
          </p>
        )}
      </div>

      {isExam && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">
            Step-by-step Examination Process
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {facts?.stages
              ? "Programme-specific guidance"
              : "General guidance & official steps and stages vary by exam"}
          </p>
          <ol className="mt-5 space-y-4">
            {(facts?.stages ?? defaultExamStages).map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-7 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
