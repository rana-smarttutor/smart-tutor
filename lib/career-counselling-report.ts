/**
 * SmartIQ Institute
 * Career Counselling Report
 *
 * Browser preview + A4 printable report
 * Uses saved student and assessment data.
 */

export type ReportRecord = {
  id: string;
  studentName: string;
  classLevel: string;
  board: string;
  school: string;
  city: string;
  academicPercentage: string;
  strongSubjects: string[];
  weakSubjects: string[];
  interests: string[];
  careerGoal: string;
  preferredStream: string;
  preferredLearningStyle: string;
  examInterests: string[];
  recommendedPrograms: string[];
  counsellorNotes: string;
  aiSuggestion: string;
  aiReviewed: boolean;
  updatedAt: string;

  dateOfBirth?: string;
  parentName?: string;
  followUpDate?: string;
  questionnaire?: unknown;
};

export type ReportAssessment = {
  status: string;
  submittedAt?: string | null;
  result?: {
    completed: boolean;
    aptitude: {
      total: number;
      answered: number;
      correct: number;
      categories: Array<{
        label: string;
        total: number;
        answered: number;
        correct: number;
        percentage: number | null;
      }>;
    };
    interests: {
      dimensions: Array<{
        label: string;
        answered: number;
        total: number;
        average: number | null;
      }>;
    };
  } | null;
} | null;

/* ==========================================
   SAFE FORMATTING
========================================== */

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] || char,
  );
}

function display(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? escapeHtml(value.join(", ")) : "Not recorded";
  }

  const text = String(value ?? "").trim();

  return text ? escapeHtml(text) : "Not recorded";
}

function formatDate(value?: string): string {
  if (!value) return "Not recorded";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function ageFromDate(value?: string): string {
  if (!value) return "Not recorded";

  const dob = new Date(value);

  if (Number.isNaN(dob.getTime())) {
    return "Not recorded";
  }

  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age >= 0 && age <= 110 ? String(age) : "Not recorded";
}

function field(label: string, value: unknown): string {
  return `
    <div class="info-field">
      <div class="info-label">${escapeHtml(label)}</div>
      <div class="info-value">${display(value)}</div>
    </div>
  `;
}

function section(
  number: number,
  heading: string,
  content: string,
  right = "",
): string {
  return `
    <section class="report-card">
      <div class="section-heading">
        <span class="section-number">${number}</span>
        <h2>${escapeHtml(heading)}</h2>
        ${right}
      </div>

      <div class="section-content">
        ${content}
      </div>
    </section>
  `;
}

function chips(values: string[]): string {
  if (!values?.length) {
    return `<span class="muted">Not recorded</span>`;
  }

  return values
    .map((value) => `<span class="chip">${escapeHtml(value)}</span>`)
    .join("");
}

/* ==========================================
   COUNSELLOR REPORT TEXT
========================================== */

function markdownToHtml(raw: string): string {
  const lines = raw.replace(/\r/g, "").split("\n");

  let html = "";
  let listType: "ul" | "ol" | null = null;

  const inline = (line: string) =>
    escapeHtml(line)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = null;
    }
  };

  for (const original of lines) {
    const line = original.trim();

    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^#{1,5}\s+(.+)$/);

    if (heading) {
      closeList();
      html += `<h3>${inline(heading[1])}</h3>`;
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);

    if (bullet || numbered) {
      const type: "ul" | "ol" = numbered ? "ol" : "ul";

      if (listType !== type) {
        closeList();
        html += `<${type}>`;
        listType = type;
      }

      html += `<li>${inline((bullet || numbered)![1])}</li>`;
      continue;
    }

    closeList();

    if (line.endsWith(":") && line.length < 85) {
      html += `<h3>${inline(line)}</h3>`;
    } else {
      html += `<p>${inline(line)}</p>`;
    }
  }

  closeList();

  return html;
}

/* ==========================================
   QUESTIONNAIRE UTILITIES
========================================== */

function questionnaireValues(value: unknown): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  function visit(input: unknown, depth: number) {
    if (depth > 8 || !input || typeof input !== "object") {
      return;
    }

    if (Array.isArray(input)) {
      for (const item of input) {
        visit(item, depth + 1);
      }
      return;
    }

    for (const [key, child] of Object.entries(input)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (typeof child === "string" || typeof child === "number") {
        output[normalized] = child;
      } else {
        visit(child, depth + 1);
      }
    }
  }

  visit(value, 0);

  return output;
}

function answer(values: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = values[key.toLowerCase().replace(/[^a-z0-9]/g, "")];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }

  return "";
}

function routineRow(label: string, current: string, target: string): string {
  const hasData = !!current.trim();

  return `
    <tr>
      <td><strong>${escapeHtml(label)}</strong></td>
      <td>${display(current)}</td>
      <td>${display(target)}</td>
      <td>
        <span class="status ${hasData ? "status-review" : "status-neutral"}">
          ${hasData ? "Review together" : "Not recorded"}
        </span>
      </td>
    </tr>
  `;
}

/* ==========================================
   MAIN REPORT GENERATOR
========================================== */

export function careerReportHtml(
  record: ReportRecord,
  session: ReportAssessment,
): string {
  const result = session?.status === "submitted" ? session.result : null;

  const aptitude = result?.aptitude;
  const categories = aptitude?.categories || [];
  const dimensions = result?.interests.dimensions || [];

  const questionnaire = questionnaireValues(record.questionnaire);

  const categoryScore = (
    category: (typeof categories)[number],
  ): number | null => {
    if (category.answered <= 0) return null;

    const percentage = (category.correct / category.answered) * 100;

    return Number.isFinite(percentage) ? Math.round(percentage) : null;
  };

  const scoredAptitude = categories
    .map((category) => ({
      ...category,
      score: categoryScore(category),
    }))
    .filter((category) => category.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const strongest = scoredAptitude[0];
  const weakest = scoredAptitude[scoredAptitude.length - 1];

  const sortedInterests = [...dimensions]
    .filter((item) => item.answered > 0 && item.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

  const reportDate = formatDate(record.updatedAt);

  const shortId = record.id?.slice(-8).toUpperCase() || "N/A";

  const isComplete = !!result?.completed;

  const interestAnswered = dimensions.reduce(
    (sum, item) => sum + item.answered,
    0,
  );

  const interestTotal = dimensions.reduce((sum, item) => sum + item.total, 0);

  const summaryText = record.aiSuggestion?.trim()
    ? markdownToHtml(record.aiSuggestion)
    : `<p class="muted">
         Counselling recommendations have not
         been recorded.
       </p>`;

  /* Questionnaire answers */

  const sleep = answer(questionnaire, "sleepTime", "sleepHours", "bedtime");

  const wake = answer(questionnaire, "wakeUpTime", "wakeup", "wakeTime");

  const selfStudy = answer(
    questionnaire,
    "dailyStudyHours",
    "selfStudyHours",
    "studyHours",
  );

  const studySitting = answer(
    questionnaire,
    "longestStudySitting",
    "studySitting",
    "studyDuration",
  );

  const screenTime = answer(
    questionnaire,
    "screenTime",
    "phoneTime",
    "dailyPhoneUse",
  );

  const exercise = answer(questionnaire, "exercise", "physicalActivity");

  const studyDays = answer(questionnaire, "studyDaysPerWeek", "daysStudied");

  /* Daily routine table */

  const routineRows = [
    routineRow("Sleep", sleep, "Agree on a consistent sleep schedule"),
    routineRow("Wake-up", wake, "Consistent waking time"),
    routineRow("Self-study", selfStudy, "Gradually increase focused study"),
    routineRow(
      "Longest sitting",
      studySitting,
      "Build toward examination duration",
    ),
    routineRow(
      "Phone for recreation",
      screenTime,
      "Agree on a manageable limit",
    ),
    routineRow("Exercise", exercise, "Regular physical activity"),
    routineRow("Days studied", studyDays, "Consistent weekly schedule"),
  ].join("");

  /* Aptitude results */

  const aptitudeRows = categories.length
    ? categories
        .map((category) => {
          const percentage = categoryScore(category);

          const score =
            percentage === null ? 0 : Math.min(100, Math.max(0, percentage));

          const rating =
            percentage === null
              ? "Not scored"
              : score >= 70
                ? "Strong"
                : score >= 45
                  ? "Average"
                  : "Needs work";

          const ratingClass =
            percentage === null
              ? "status-neutral"
              : score >= 70
                ? "status-good"
                : score >= 45
                  ? "status-review"
                  : "status-low";

          return `
            <div class="aptitude-row">
              <strong>
                ${escapeHtml(category.label)}
              </strong>

              <div class="bar-track">
                <div
                  class="bar-fill"
                  style="width:${score}%"
                ></div>
              </div>

              <strong class="score">
                ${percentage === null ? "—" : `${score}%`}
              </strong>

              <span class="status ${ratingClass}">
                ${rating}
              </span>
            </div>
          `;
        })
        .join("")
    : `<p class="muted">
         No submitted aptitude results available.
       </p>`;

  /* Interest profile */

  const interestCards = sortedInterests.length
    ? sortedInterests
        .map(
          (dimension, index) => `
            <div class="interest-card">
              <span class="small-tag">
                ${
                  index === 0
                    ? "Top interest"
                    : index === 1
                      ? "Second interest"
                      : index === 2
                        ? "Third interest"
                        : "Interest area"
                }
              </span>

              <h3>
                ${escapeHtml(dimension.label)}
              </h3>

              <p>
                Average self-rating:
                <strong>
                  ${dimension.average?.toFixed(2)}/5
                </strong>
              </p>

              <p class="muted">
                ${dimension.answered}/${dimension.total}
                statements answered
              </p>
            </div>
          `,
        )
        .join("")
    : `<p class="muted">
         No submitted interest results available.
       </p>`;

  /* Next steps */

  const actionRows = [
    {
      action: "Review aptitude strengths and improvement areas",
      who: "Student and counsellor",
      when: "Next counselling session",
    },
    {
      action: "Discuss suitable career pathways and eligibility",
      who: "Counsellor",
      when: "Next counselling session",
    },
    {
      action: "Create a realistic weekly study routine",
      who: "Student",
      when: "After counselling",
    },
    {
      action: "Review progress and adjust the study plan",
      who: "Student and counsellor",
      when: record.followUpDate
        ? formatDate(record.followUpDate)
        : "At follow-up",
    },
  ];

  /* ==========================================
     REPORT HTML
  ========================================== */

  return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
  SmartIQ Career Counselling Report -
  ${escapeHtml(record.studentName)}
</title>

<style>

/* ==========================================
   BASE VARIABLES
========================================== */

:root {
  --navy: #0b1f4b;
  --blue: #2765e9;
  --blue-light: #eff4ff;
  --line: #cdd5e2;
  --muted: #586780;
  --background: #f3f6fc;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  color: var(--navy);
  background: var(--background);

  font-family:
    "Hanken Grotesk",
    Arial,
    Helvetica,
    sans-serif;

  font-size: 14px;
  line-height: 1.6;
}

img {
  max-width: 100%;
}

/* ==========================================
   TOP HEADER
========================================== */

.report-top {
  width: 100%;
  background: #ffffff;
  border-bottom: 2px solid #f4c64e;
}

.top-inner {
  width: min(100% - 48px, 960px);
  max-width: 960px;

  min-height: 88px;

  margin: 0 auto;
  padding: 14px 0;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand-logo {
  display: flex;
  align-items: center;
  min-width: 0;
}

.smartiq-logo {
  display: block;
  width: 265px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.print-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: #2563eb;
  color: #ffffff;

  border: 0;
  border-radius: 7px;

  padding: 11px 19px;

  font-family: inherit;
  font-size: 13px;
  font-weight: 800;

  white-space: nowrap;
  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.print-button:hover {
  background: #1748b8;
  transform: translateY(-1px);
}

/* ==========================================
   REPORT CONTAINER
========================================== */

.report {
  width: min(100% - 48px, 900px);
  max-width: 900px;
  margin: 28px auto 55px;
  padding: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  margin-bottom: 12px;
}

.pill {
  padding: 5px 10px;

  font-size: 11px;
  font-weight: 800;

  border-radius: 5px;
}

.pill-green {
  color: #246546;
  background: #e3f4e8;
}

.pill-amber {
  color: #875b0b;
  background: #fff2d1;
}

.report-id {
  color: #63718a;
  font-size: 12px;
}

.report h1 {
  font-size: 31px;
  font-weight: 900;

  letter-spacing: -0.8px;
  line-height: 1.2;

  margin: 3px 0 0;
}

.report-subtitle {
  margin: 7px 0 24px;
  color: #65728a;
  font-size: 14px;
}

/* ==========================================
   REPORT SECTION CARDS
========================================== */

.report-card {
  background: #ffffff;

  border: 1px solid #cbd5e1;
  border-radius: 10px;

  padding: 23px 24px;
  margin-bottom: 18px;

  box-shadow:
    0 2px 7px rgba(13, 35, 79, 0.035);

  page-break-inside: auto;
  break-inside: auto;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;

  margin-bottom: 19px;
}

.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  flex-shrink: 0;

  border-radius: 4px;

  background: var(--navy);
  color: white;

  font-size: 13px;
  font-weight: 900;
}

.section-heading h2 {
  margin: 0;

  font-size: 17px;
  font-weight: 800;
  line-height: 1.3;
}

.section-content > p:first-child {
  margin-top: 0;
}

/* ==========================================
   STUDENT DETAILS
========================================== */

.info-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  column-gap: 18px;
  row-gap: 22px;
}

.info-label {
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 2px;
}

.info-value {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* ==========================================
   PROFILE CARDS
========================================== */

.glance-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 10px;
}

.glance-card {
  min-height: 88px;

  padding: 13px 14px;

  border: 1px solid #e6ecf7;
  border-radius: 5px;

  background: #f2f5fd;
}

.glance-card small {
  display: block;

  margin-bottom: 6px;

  color: var(--muted);
  font-size: 11px;
}

.glance-card strong {
  display: block;

  font-size: 13px;
  line-height: 1.5;

  overflow-wrap: anywhere;
}

/* ==========================================
   APTITUDE RESULT BARS
========================================== */

.aptitude-row {
  display: grid;

  grid-template-columns:
    160px minmax(0, 1fr) 48px 92px;

  align-items: center;
  gap: 13px;

  margin: 16px 0;

  break-inside: avoid;
}

.bar-track {
  height: 12px;

  border-radius: 6px;
  overflow: hidden;

  background: #e4e9f4;
}

.bar-fill {
  height: 100%;

  background: var(--blue);
  border-radius: 6px;
}

.score {
  text-align: right;
}

.status {
  display: inline-block;

  text-align: center;

  font-weight: 800;
  font-size: 11px;

  border-radius: 4px;
  padding: 5px 7px;
}

.status-good {
  color: #176842;
  background: #e1f4e8;
}

.status-review {
  color: #855a06;
  background: #fff1d2;
}

.status-low {
  color: #a12b24;
  background: #ffebea;
}

.status-neutral {
  color: #53627b;
  background: #edf1f7;
}

/* ==========================================
   INTEREST CARDS
========================================== */

.interest-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 13px;
}

.interest-card,
.path-card,
.timeline-card {
  border: 1px solid #d5dce8;
  border-radius: 6px;

  padding: 17px;

  background: #ffffff;
  break-inside: avoid;
}

.interest-card h3,
.path-card h3,
.timeline-card h3 {
  font-size: 15px;
  margin: 11px 0 7px;
}

.small-tag {
  display: inline-block;

  background: #e9f0ff;
  color: #235bc3;

  font-size: 11px;
  font-weight: 800;

  padding: 4px 8px;
  border-radius: 4px;
}

/* ==========================================
   TABLES
========================================== */

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 11px 9px;

  border-bottom: 2px solid #7d8ca5;

  text-align: left;
  text-transform: uppercase;

  font-size: 11px;
}

td {
  padding: 11px 9px;

  border-bottom: 1px solid #dde2ea;

  vertical-align: top;
  font-size: 12px;
}

table tr {
  break-inside: avoid;
}

/* ==========================================
   STUDY SITTING CHART
========================================== */

.steps-chart {
  display: grid;

  grid-template-columns:
    repeat(5, minmax(0, 1fr));

  align-items: end;
  gap: 9px;

  margin-top: 22px;
}

.step {
  text-align: center;
}

.step-height {
  display: flex;
  align-items: end;
  justify-content: center;

  font-size: 12px;
  font-weight: 800;

  padding-bottom: 8px;
}

.step-bar {
  background: #2464e7;
  height: var(--height);
}

.step:nth-child(1) .step-bar {
  background: #9ab9f8;
}

.step:nth-child(2) .step-bar {
  background: #79a1f5;
}

.step:nth-child(3) .step-bar {
  background: #5088f1;
}

.step:nth-child(5) .step-bar {
  background: var(--navy);
}

.step-caption {
  margin-top: 9px;

  font-size: 11px;
  font-weight: 800;
}

.step-caption span {
  color: var(--muted);
  font-weight: 400;
}

/* ==========================================
   CAREER + TIMELINE GRIDS
========================================== */

.three-column {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 14px;
}

.four-column {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 13px;
}

.path-card:first-child {
  border: 2px solid var(--blue);
}

.path-card p,
.timeline-card p {
  font-size: 12px;
  color: #48566e;
}

/* ==========================================
   TEXT + BADGES
========================================== */

.chip {
  display: inline-block;

  padding: 5px 9px;
  margin: 3px 6px 3px 0;

  background: #edf3ff;
  color: #2056b5;

  font-size: 12px;
  font-weight: 700;

  border-radius: 4px;
}

.prose {
  overflow-wrap: anywhere;
}

.prose p {
  margin: 9px 0;
}

.prose h3 {
  margin: 17px 0 6px;
  font-size: 15px;
}

.prose ul,
.prose ol {
  padding-left: 22px;
}

.prose li {
  margin-bottom: 5px;
}

.muted {
  color: var(--muted);
}

.note {
  margin: 14px 0 0;

  color: #66738a;
  font-size: 12px;
}

.warning {
  background: #fff6df;
  border: 1px solid #eedaa9;

  padding: 12px;
  border-radius: 5px;

  color: #745316;
  font-size: 12px;

  margin-top: 12px;
}

.remarks-signature {
  display: flex;
  justify-content: space-between;
  gap: 15px;

  border-top: 1px solid #dde3ee;

  margin-top: 20px;
  padding-top: 13px;
}

.report-footer {
  padding: 8px 0 20px;

  color: #69778d;

  font-size: 11px;
  line-height: 1.6;
}

/* ==========================================
   MOBILE SCREEN
========================================== */

@media screen and (max-width: 700px) {

  .top-inner {
    width: calc(100% - 28px);
    min-height: 72px;
  }

  .smartiq-logo {
    width: 200px;
  }

  .print-button {
    padding: 10px 13px;
    font-size: 12px;
  }

  .report {
    width: calc(100% - 24px);
    margin: 20px auto 35px;
  }

  .report-card {
    padding: 17px 15px;
  }

  .report h1 {
    font-size: 25px;
  }

  .section-heading h2 {
    font-size: 15px;
  }

  .info-grid,
  .glance-grid,
  .four-column {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .interest-grid,
  .three-column {
    grid-template-columns: 1fr;
  }

  .aptitude-row {
    grid-template-columns:
      1fr 2fr 45px;
  }

  .aptitude-row .status {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

@media screen and (max-width: 420px) {

  .top-inner {
    flex-wrap: wrap;
  }

  .smartiq-logo {
    width: 190px;
  }

  .info-grid,
  .glance-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .steps-chart {
    gap: 4px;
  }

  .step-caption {
    font-size: 9px;
  }

  .step-height {
    font-size: 10px;
  }
}

/* ==========================================
   A4 PDF PRINT RULES
   Must remain inside this media block
========================================== */

@media print {

  @page {
    size: A4;
    margin: 11mm;
  }

  html,
  body {
    width: 100%;
    background: #ffffff;
  }

  body {
    font-size: 10px;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-top {
    display: block;

    border-bottom: 2px solid #f4c64e;
    margin-bottom: 15px;
  }

  .top-inner {
    width: 100%;
    max-width: 100%;

    min-height: 0;

    padding: 6px 0 12px;
  }

  .smartiq-logo {
    width: 240px;
  }

  .print-button {
    display: none !important;
  }

  .report {
    width: 100%;
    max-width: 100%;

    margin: 0;
    padding: 0;
  }

  .report h1 {
    font-size: 25px;
  }

  .report-subtitle {
    margin-bottom: 13px;
    font-size: 11px;
  }

  .report-card {
    padding: 12px 14px;
    margin-bottom: 11px;

    border-radius: 5px;
    box-shadow: none;
  }

  .section-heading {
    margin-bottom: 10px;
  }

  .section-heading h2 {
    font-size: 14px;
  }

  .section-number {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .info-grid {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));

    gap: 10px;
  }

  .glance-grid {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
  }

  .glance-card {
    min-height: 55px;
    padding: 9px;
  }

  .interest-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .three-column {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .four-column {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
  }

  .aptitude-row {
    grid-template-columns:
      125px minmax(0, 1fr) 35px 75px;

    gap: 8px;
    margin: 10px 0;
  }

  .info-field,
  .glance-card,
  .interest-card,
  .path-card,
  .timeline-card,
  .aptitude-row,
  .steps-chart,
  .remarks-signature {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section-heading {
    break-after: avoid;
    page-break-after: avoid;
  }

  table {
    break-inside: auto;
  }

  tr {
    break-inside: avoid;
  }

  .report-footer {
    font-size: 9px;
  }

}

/* END OF CSS */

</style>
</head>

<body>

<!-- ==========================================
     REPORT HEADER / ACTUAL LOGO
========================================== -->

<header class="report-top">

  <div class="top-inner">

    <div class="brand-logo">
      <img
        src="/logoSIQ.png"
        alt="SmartIQ Institute Logo"
        class="smartiq-logo"
      >
    </div>

    <button
      type="button"
      class="print-button"
      onclick="window.print()"
    >
      Download PDF
    </button>

  </div>

</header>

<main class="report">

<!-- ==========================================
     REPORT TITLE
========================================== -->

<div class="eyebrow">

  <span class="pill ${record.aiReviewed ? "pill-green" : "pill-amber"}">
    ${
      record.aiReviewed
        ? "Approved by counsellor"
        : "Awaiting counsellor approval"
    }
    · ${escapeHtml(reportDate)}
  </span>

  <span class="report-id">
    Report ${escapeHtml(shortId)}
  </span>

</div>

<h1>Career Counselling Report</h1>

<p class="report-subtitle">
  Prepared for
  <strong>${display(record.studentName)}</strong>,
  ${display(record.classLevel)}
</p>

<!-- ==========================================
     SECTION 1 — STUDENT DETAILS
========================================== -->

${section(
  1,
  "Student details",
  `
  <div class="info-grid">
    ${field("Name", record.studentName)}
    ${field("Age", ageFromDate(record.dateOfBirth))}
    ${field("At present", record.classLevel)}
    ${field("City", record.city)}
    ${field("Session", reportDate)}
    ${field("Counsellor", "")}
    ${field(
      "Stages done",
      result ? "Counselling form · Aptitude test" : "Counselling form",
    )}
    ${field("Parent present", record.parentName)}
  </div>
  `,
)}

<!-- ==========================================
     SECTION 2 — PROFILE AT A GLANCE
========================================== -->

${section(
  2,
  "Profile at a glance",
  `
  <div class="glance-grid">

    <div class="glance-card">
      <small>Career goal</small>
      <strong>${display(record.careerGoal)}</strong>
    </div>

    <div class="glance-card">
      <small>Strongest area</small>
      <strong>${display(strongest?.label)}</strong>
    </div>

    <div class="glance-card">
      <small>Needs most work</small>
      <strong>${display(weakest?.label)}</strong>
    </div>

    <div class="glance-card">
      <small>Interest type</small>
      <strong>
        ${display(sortedInterests[0]?.label)}
      </strong>
    </div>

    <div class="glance-card">
      <small>Sleep now</small>
      <strong>${display(sleep)}</strong>
    </div>

    <div class="glance-card">
      <small>Study sitting now</small>
      <strong>${display(studySitting)}</strong>
    </div>

  </div>
  `,
)}

<!-- ==========================================
     SECTION 3 — COUNSELLOR SUMMARY
========================================== -->

${section(
  3,
  "Counsellor's summary",
  `
  <div class="prose">
    ${
      record.counsellorNotes?.trim()
        ? markdownToHtml(record.counsellorNotes)
        : `<p class="muted">
             Counsellor summary not recorded.
           </p>`
    }
  </div>
  `,
)}

<!-- ==========================================
     SECTION 4 — APTITUDE RESULT
========================================== -->

${section(
  4,
  "Aptitude test result",
  `
  ${aptitudeRows}

  <p class="note">
    Scores show the percentage of correct
    answers among answered questions in each
    section. Strong: 70% and above.
    Average: 45–69%. Needs work: below 45%.
    Results are screening indicators, not ranks.
  </p>

  ${
    !isComplete
      ? `
        <div class="warning">
          The assessment is incomplete or
          unavailable. Findings are provisional.
        </div>
      `
      : ""
  }
  `,
)}

<!-- ==========================================
     SECTION 5 — INTERESTS
========================================== -->

${section(
  5,
  "Interests and study style",
  `
  <div class="interest-grid">
    ${interestCards}
  </div>

  <p class="note">
    Interest ratings are self-reported
    preferences, not proof of suitability
    for a career.
  </p>

  <p>
    <strong>Study style:</strong>
    ${display(record.preferredLearningStyle)}
  </p>

  <p class="muted">
    ${interestAnswered}/${interestTotal}
    interest statements answered.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 6 — ROUTINE
========================================== -->

${section(
  6,
  "Daily routine check",
  `
  <table>
    <thead>
      <tr>
        <th>Area</th>
        <th>Now</th>
        <th>Target</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      ${routineRows}
    </tbody>
  </table>

  <p class="note">
    Routine targets are proposed discussion
    points. They must be tailored to the
    student's needs.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 7 — STUDY SITTING
========================================== -->

${section(
  7,
  "Building your study sitting",
  `
  <p>
    Gradually increasing focused study
    time can help prepare for longer assessments.
  </p>

  <div class="steps-chart">

    ${[
      ["45 min", 38, "Weeks 1–2"],
      ["60 min", 50, "Weeks 3–4"],
      ["75 min", 64, "Weeks 5–6"],
      ["90 min", 77, "Weeks 7–8"],
      ["120 min", 100, "Weeks 9–12"],
    ]
      .map(
        ([label, height, weeks]) => `
          <div class="step">

            <div class="step-height">
              ${label}
            </div>

            <div
              class="step-bar"
              style="--height:${height}px"
            ></div>

            <div class="step-caption">
              ${weeks}

              <br>

              <span>
                Suggested progression
              </span>
            </div>

          </div>
        `,
      )
      .join("")}

  </div>

  <p class="note">
    This is an illustrative progression.
    Adjust the duration based on comfort,
    progress and the target examination.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 8 — WEEKDAY TIMETABLE
========================================== -->

${section(
  8,
  "Suggested weekday timetable",
  `
  <table>
    <thead>
      <tr>
        <th style="width:28%">Time</th>
        <th>What to do</th>
      </tr>
    </thead>

    <tbody>

      ${[
        ["Morning", "Review previous learning and plan the day"],
        ["Study block 1", "Practise a priority subject"],
        ["Midday", "School, college or scheduled commitments"],
        ["Study block 2", "Timed aptitude or subject practice"],
        ["Evening", "Exercise, rest and family time"],
        ["Study block 3", "Revision and review of mistakes"],
        ["Before bed", "Prepare the next day's study tasks"],
      ]
        .map(
          ([time, task]) => `
            <tr>
              <td><strong>${time}</strong></td>
              <td>${task}</td>
            </tr>
          `,
        )
        .join("")}

    </tbody>
  </table>

  <p class="note">
    This is a suggested timetable, not a
    confirmed personal schedule.
    The counsellor should adjust it using
    the student's actual routine.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 9 — CAREER PATHS
========================================== -->

${section(
  9,
  "Recommended career paths",
  `
  <div class="three-column">

    ${[record.careerGoal, record.interests?.[0], record.interests?.[1]]
      .map(
        (path, index) => `
          <div class="path-card">

            <span class="small-tag">
              Path ${index + 1} ·
              ${index === 0 ? "Career goal" : "Explore"}
            </span>

            <h3>${display(path)}</h3>

            <p>
              Discuss suitability,
              qualifications, entry
              requirements and alternatives
              with the counsellor.
            </p>

            <p>
              <strong>Eligibility:</strong>
              Verify against official requirements.
            </p>

          </div>
        `,
      )
      .join("")}

  </div>

  <p class="note">
    These are initial exploration options,
    not ranked career-fit recommendations.
    Review the detailed counsellor-approved
    guidance below.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 10 — 12 MONTH PLAN
========================================== -->

${section(
  10,
  "12-month plan",
  `
  <div class="four-column">

    ${[
      [
        "Months 1–3",
        "Build foundation",
        "Establish a consistent routine and identify skill gaps.",
      ],
      [
        "Months 4–6",
        "Strengthen core skills",
        "Practise subjects, track progress and review mistakes.",
      ],
      [
        "Months 7–9",
        "Apply learning",
        "Use projects, practice tests or career exploration activities.",
      ],
      [
        "Months 10–12",
        "Review next steps",
        "Assess progress and update the plan with the counsellor.",
      ],
    ]
      .map(
        ([period, title, description]) => `
          <div class="timeline-card">

            <span class="small-tag">
              ${period}
            </span>

            <h3>${title}</h3>

            <p>${description}</p>

          </div>
        `,
      )
      .join("")}

  </div>

  <p class="note">
    This timeline is a general framework.
    The counsellor should customise its
    milestones for the student.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 11 — SMARTIQ PROGRAMMES
========================================== -->

${section(
  11,
  "Matching SmartIQ programmes",
  `
  <div>
    ${chips(record.recommendedPrograms || [])}
  </div>

  <p class="note">
    Programme suitability, availability,
    fees and admissions must be confirmed
    separately by SmartIQ Institute.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 12 — FAMILY NOTE
========================================== -->

${section(
  12,
  "A note for the family",
  `
  <p>
    Support the student's goals through
    constructive conversations, a balanced
    routine and regular encouragement.
    Review progress together without
    treating one assessment as a final
    judgment of ability.
  </p>
  `,
)}

<!-- ==========================================
     SECTION 13 — NEXT STEPS
========================================== -->

${section(
  13,
  "Next steps",
  `
  <table>

    <thead>
      <tr>
        <th>#</th>
        <th>Action</th>
        <th>Who</th>
        <th>By when</th>
      </tr>
    </thead>

    <tbody>

      ${actionRows
        .map(
          (item, index) => `
            <tr>

              <td>${index + 1}</td>

              <td>
                ${escapeHtml(item.action)}
              </td>

              <td>
                ${escapeHtml(item.who)}
              </td>

              <td>
                ${escapeHtml(item.when)}
              </td>

            </tr>
          `,
        )
        .join("")}

    </tbody>

  </table>
  `,
)}

<!-- ==========================================
     SECTION 14 — COUNSELLOR REMARKS
========================================== -->

${section(
  14,
  "Counsellor's remarks",
  `
  <div class="prose">
    ${summaryText}
  </div>

  <div class="remarks-signature">

    <div>
      <strong>
        SmartIQ Career Counsellor
      </strong>

      <div class="muted">
        SmartIQ Institute
      </div>
    </div>

    <div class="muted">
      ${
        record.aiReviewed
          ? `Approved · ${escapeHtml(reportDate)}`
          : "Pending approval"
      }
    </div>

  </div>
  `,
)}

<!-- ==========================================
     FOOTER
========================================== -->

<footer class="report-footer">

  This report is guidance based on the
  student's information, assessment and
  counselling session. It is not a promise
  of selection, admission or employment.
  Always check official examination and
  eligibility notifications. Study and
  routine suggestions are general guidance.

  <br>

  <strong>SmartIQ Institute</strong>
  · Vashi, Navi Mumbai

</footer>

</main>

</body>
</html>`;
}
