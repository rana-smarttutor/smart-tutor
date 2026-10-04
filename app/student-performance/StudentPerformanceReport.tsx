"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Activity,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Lightbulb,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Target,
  TrendingUp,
  User,
  Users,
  XCircle,
} from "lucide-react";

type Report = {
  _id?: string;

  createdAt?:
    | string
    | Date;

  reportType:
    string;

  period:
    string;

  periodLabel?:
    string;

  title?:
    string;

  status:
    string;

  academyName?:
    string;

  student: {
    name:
      string;

    classLevel:
      string;

    city:
      string;

    state:
      string;

    address?:
      string;

    course:
      string;

    parentName:
      string;

    parentRelation:
      string;

    parentContact:
      string;

    photo?:
      string;
  };

  metrics: {
    averageScore:
      number;

    attendancePercentage:
      number;

    homeworkCompletionPercentage:
      number;

    improvementPercentage:
      number;

    improvementAvailable?:
      boolean;

    previousAverageScore?:
      number | null;

    accuracyPercentage:
      number;
  };

  subjectWiseMarks?: {
    teacherName?:
      string;

    subject:
      string;

    marks?:
      number;

    outOfMarks?:
      number;

    score:
      number;

    feedback:
      string;
  }[];

  homeworkCompletion?: {
    date:
      string;

    task:
      string;

    assigned:
      number;

    completed:
      number;

    completion:
      number;
  }[];

  accuracySplit?: {
    correct:
      number;

    wrong:
      number;

    unattempted:
      number;
  };

  attendanceGraph?: {
    date:
      string;

    present:
      boolean;
  }[];

  strengthsWeaknesses?: {
    strongSubject:
      string;

    weakSubject:
      string;

    timeManagement:
      string;

    weakChapters:
      string[];
  };

  suggestions?: {
    teacherRemark?:
      string;

    improvementSuggestion?:
      string;

    studyRecommendation?:
      string;

    smartStrategy?:
      string;
  };
};

type IconType =
  typeof Target;

function numberValue(
  value: unknown,
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}

function roundValue(
  value: number,
) {
  return (
    Math.round(
      value * 100,
    ) / 100
  );
}

function displayPercent(
  value: unknown,
) {
  const parsed =
    roundValue(
      numberValue(
        value,
      ),
    );

  return Number.isInteger(
    parsed,
  )
    ? String(parsed)
    : parsed.toFixed(
        2,
      );
}

function safeDate(
  value:
    | string
    | Date
    | undefined,
) {
  if (!value) {
    return new Date(
      "2026-10-04T00:00:00.000Z",
    );
  }

  const result =
    new Date(value);

  if (
    Number.isNaN(
      result.getTime(),
    )
  ) {
    return new Date(
      "2026-10-04T00:00:00.000Z",
    );
  }

  return result;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function formatDate(
  value:
    | string
    | Date
    | undefined,
) {
  const date =
    safeDate(value);

  return `${String(
    date.getUTCDate(),
  ).padStart(
    2,
    "0",
  )} ${
    MONTHS[
      date.getUTCMonth()
    ]
  } ${date.getUTCFullYear()}`;
}

function formatRangeDate(
  date: Date,
) {
  return `${String(
    date.getUTCDate(),
  ).padStart(
    2,
    "0",
  )} ${
    MONTHS[
      date.getUTCMonth()
    ]
  }`;
}

function getWeekRange(
  value:
    | string
    | Date
    | undefined,
) {
  const end =
    safeDate(value);

  const start =
    new Date(end);

  start.setUTCDate(
    end.getUTCDate() -
      6,
  );

  return `${formatRangeDate(
    start,
  )} - ${formatRangeDate(
    end,
  )} ${end.getUTCFullYear()}`;
}

function getInitials(
  name: string,
) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join("")
      .slice(
        0,
        2,
      ) || "ST"
  );
}

function getImprovement(
  report: Report,
) {
  if (
    report.metrics
      .improvementAvailable ===
    false
  ) {
    return {
      display:
        "—",

      delta:
        "Baseline",
    };
  }

  const improvement =
    numberValue(
      report.metrics
        .improvementPercentage,
    );

  return {
    display:
      `${improvement > 0 ? "+" : ""}${displayPercent(
        improvement,
      )}%`,

    delta:
      improvement > 0
        ? `+${displayPercent(
            improvement,
          )}%`
        : improvement <
            0
          ? `${displayPercent(
              improvement,
            )}%`
          : "No change",
  };
}

function InfoCell({
  icon:
    Icon,

  label,

  value,
}: {
  icon:
    IconType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="sprx-info-cell">
      <div className="sprx-info-icon">
        <Icon
          size={19}
          strokeWidth={
            2.5
          }
        />
      </div>

      <div className="sprx-info-copy">
        <span>
          {label}
        </span>

        <strong>
          {value ||
            "Not added"}
        </strong>
      </div>
    </div>
  );
}

function HeaderKpi({
  icon:
    Icon,

  label,

  value,

  helper,

  green = false,
}: {
  icon:
    IconType;

  label:
    string;

  value:
    string;

  helper:
    string;

  green?:
    boolean;
}) {
  return (
    <div className="sprx-header-kpi">
      <Icon
        size={20}
        strokeWidth={
          2.5
        }
      />

      <span>
        {label}
      </span>

      <strong
        className={
          green
            ? "sprx-green-value"
            : ""
        }
      >
        {value}
      </strong>

      <small>
        {helper}
      </small>
    </div>
  );
}

function MetricCard({
  icon:
    Icon,

  label,

  value,

  change,

  helper,
}: {
  icon:
    IconType;

  label:
    string;

  value:
    string;

  change:
    string;

  helper:
    string;
}) {
  const positive =
    !change.startsWith(
      "-",
    );

  return (
    <article className="sprx-metric-card">
      <div className="sprx-circle-icon">
        <Icon
          size={22}
          strokeWidth={
            2.4
          }
        />
      </div>

      <div className="sprx-metric-copy">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <div
          className={`sprx-change ${
            positive
              ? "positive"
              : "negative"
          }`}
        >
          {change !==
          "Baseline" ? (
            <ArrowUp
              size={
                12
              }
              strokeWidth={
                3
              }
            />
          ) : null}

          <b>
            {change}
          </b>
        </div>

        <small>
          {helper}
        </small>
      </div>
    </article>
  );
}

function SectionTitle({
  icon:
    Icon,

  title,

  right,
}: {
  icon:
    IconType;

  title:
    string;

  right?:
    React.ReactNode;
}) {
  return (
    <div className="sprx-section-heading">
      <div className="sprx-section-heading-title">
        <Icon
          size={20}
          strokeWidth={
            2.5
          }
        />

        <h2>
          {title}
        </h2>
      </div>

      <div className="sprx-section-heading-line" />

      {right ? (
        <div className="sprx-heading-right">
          {right}
        </div>
      ) : null}
    </div>
  );
}

const REPORT_CSS = `
* {
  box-sizing: border-box;
}

.sprx-root {
  min-height: 100vh;
  padding: 22px 10px 50px;
  background: #edf5fc;
  color: #062f62;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.sprx-page {
  width: min(100%, 900px);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #dce9f5;
  box-shadow:
    0 20px 55px
    rgba(0, 43, 93, 0.10);
  overflow: hidden;
}

.sprx-header {
  position: relative;
  min-height: 145px;
  display: grid;
  grid-template-columns:
    185px 1px minmax(260px, 1fr)
    390px 125px;
  gap: 14px;
  align-items: center;
  padding: 18px 18px;
  color: #ffffff;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 101% -25%,
      rgba(0, 158, 255, .45),
      transparent 42%
    ),
    linear-gradient(
      112deg,
      #00244f 0%,
      #023a78 52%,
      #0056aa 100%
    );
}

.sprx-header::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .15;
  pointer-events: none;
  background-image:
    radial-gradient(
      circle,
      #ffffff 1px,
      transparent 1.2px
    );
  background-size:
    8px 8px;
  mask-image:
    linear-gradient(
      90deg,
      transparent 0%,
      transparent 72%,
      #000 100%
    );
}

.sprx-logo-card {
  position: relative;
  z-index: 1;
  height: 88px;
  display: grid;
  place-items: center;
  padding: 10px;
  border-radius: 13px;
  background: #ffffff;
  box-shadow:
    0 7px 20px
    rgba(0, 16, 49, .18);
}

.sprx-logo-card img {
  display: block;
  width: 100%;
  max-width: 160px;
  max-height: 62px;
  object-fit: contain;
}

.sprx-header-divider {
  width: 1px;
  height: 95px;
  background:
    rgba(
      255,
      255,
      255,
      .55
    );
}

.sprx-header-title {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.sprx-header-title .small {
  display: block;
  margin-bottom: 2px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .02em;
}

.sprx-header-title h1 {
  margin: 0;
  max-width: 340px;
  color: #ffffff;
  font-size: 29px;
  line-height: 1.02;
  font-weight: 950;
  letter-spacing: -.035em;
  text-transform: uppercase;
}

.sprx-academy-title {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 800;
}

.sprx-academy-title::before,
.sprx-academy-title::after {
  content: "";
  width: 35px;
  height: 1px;
  background:
    rgba(
      255,
      255,
      255,
      .82
    );
}

.sprx-header-kpis {
  position: relative;
  z-index: 1;
  width: 100%;
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.sprx-header-kpi {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  text-align: center;
  border: 1px solid
    rgba(
      255,
      255,
      255,
      .58
    );
  border-radius: 12px;
  background:
    rgba(
      0,
      39,
      91,
      .34
    );
}

.sprx-header-kpi > svg {
  margin-bottom: 4px;
}

.sprx-header-kpi span {
  color: #ffffff;
  font-size: 7px;
  line-height: 1;
  font-weight: 850;
  text-transform: uppercase;
}

.sprx-header-kpi strong {
  margin-top: 6px;
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
  font-weight: 950;
}

.sprx-header-kpi small {
  margin-top: 6px;
  color: #d6e7f9;
  font-size: 7px;
  font-weight: 700;
}

.sprx-green-value {
  padding: 5px 9px;
  border-radius: 99px;
  color: #ffffff !important;
  background: #19bd75;
  font-size: 12px !important;
}

.sprx-dreams {
  position: relative;
  z-index: 2;
  width: 100%;
  color: #ffffff;
  font-family:
    "Segoe Print",
    "Bradley Hand",
    cursive;
  font-size: 16px;
  line-height: 1.15;
  font-weight: 500;
  text-align: center;
  transform: rotate(-6deg);
  opacity: 0.95;
}

.sprx-content {
  padding: 14px 16px 0;
}

.sprx-student-panel {
  display: grid;
  grid-template-columns:
    145px 1fr;
  gap: 15px;
  padding: 11px;
  border: 1px solid #bddaf3;
  border-radius: 13px;
  background: #fbfdff;
}

.sprx-photo-card {
  overflow: hidden;
  display: grid;
  grid-template-rows:
    1fr auto;
  min-height: 160px;
  border: 1px solid #8eb9df;
  border-radius: 12px;
  background: #ffffff;
}

.sprx-photo-area {
  min-height: 123px;
  display: grid;
  place-items: center;
  padding: 7px;
}

.sprx-photo-area img {
  width: 100%;
  height: 122px;
  object-fit: cover;
  border-radius: 8px;
}

.sprx-avatar {
  width: 95px;
  height: 95px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: #064688;
  background:
    linear-gradient(
      140deg,
      #e7f4ff,
      #cbe6fb
    );
  font-size: 28px;
  font-weight: 950;
}

.sprx-photo-name {
  padding: 9px 7px;
  text-align: center;
  color: #ffffff;
  background:
    linear-gradient(
      90deg,
      #003c7f,
      #0758a7
    );
  font-size: 12px;
  font-weight: 900;
}

.sprx-info-grid {
  overflow: hidden;
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  border: 1px solid #d6e5f3;
  border-radius: 11px;
}

.sprx-info-cell {
  min-height: 75px;
  display: grid;
  grid-template-columns:
    28px 1fr;
  gap: 8px;
  padding: 14px 12px;
  border-right: 1px solid #d9e6f2;
  border-bottom: 1px solid #d9e6f2;
}

.sprx-info-cell:nth-child(3n) {
  border-right: 0;
}

.sprx-info-cell:nth-child(n+4) {
  border-bottom: 0;
}

.sprx-info-icon {
  color: #003d82;
}

.sprx-info-copy span {
  display: block;
  margin-bottom: 5px;
  color: #2f5b8b;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.sprx-info-copy strong {
  display: block;
  color: #092e5a;
  font-size: 11px;
  line-height: 1.35;
  font-weight: 850;
  overflow-wrap: anywhere;
}

.sprx-card-section {
  margin-top: 10px;
  padding: 11px;
  border: 1px solid #c5dff4;
  border-radius: 13px;
  background: #ffffff;
}

.sprx-section-heading {
  display: grid;
  grid-template-columns:
    auto 1fr auto;
  gap: 11px;
  align-items: center;
  margin-bottom: 10px;
}

.sprx-section-heading-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #003d82;
}

.sprx-section-heading-title h2 {
  margin: 0;
  font-size: 14px;
  line-height: 1;
  font-weight: 950;
  text-transform: uppercase;
}

.sprx-section-heading-line {
  height: 1px;
  background:
    linear-gradient(
      90deg,
      #4a96d7,
      #d3e8f8
    );
}

.sprx-heading-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sprx-period-info,
.sprx-select-pill,
.sprx-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  border: 1px solid #afd4f2;
  border-radius: 9px;
  background: #ffffff;
  color: #164f88;
  font-size: 8px;
  font-weight: 800;
}

.sprx-period-info {
  border: 0;
  padding: 6px 1px;
}

.sprx-select-pill,
.sprx-mini-btn {
  padding: 6px 9px;
}

.sprx-metrics-grid {
  display: grid;
  grid-template-columns:
    repeat(5, 1fr);
  gap: 8px;
}

.sprx-metric-card {
  min-height: 103px;
  display: flex;
  gap: 9px;
  padding: 11px 9px;
  border: 1px solid #c5def2;
  border-radius: 10px;
  background:
    linear-gradient(
      180deg,
      #ffffff,
      #f7fbff
    );
}

.sprx-circle-icon {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background:
    linear-gradient(
      145deg,
      #003d82,
      #075dae
    );
}

.sprx-metric-copy span {
  display: block;
  min-height: 19px;
  color: #2e5a87;
  font-size: 8px;
  line-height: 1.18;
  font-weight: 800;
}

.sprx-metric-copy > strong {
  display: block;
  margin-top: 4px;
  color: #062c59;
  font-size: 21px;
  line-height: 1;
  font-weight: 950;
}

.sprx-change {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 8px;
  font-weight: 900;
}

.sprx-change.positive {
  color: #10a86c;
}

.sprx-change.negative {
  color: #dc394c;
}

.sprx-change.negative svg {
  transform: rotate(180deg);
}

.sprx-metric-copy small {
  display: block;
  margin-top: 2px;
  color: #597590;
  font-size: 7px;
}

.sprx-dual-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns:
    1.02fr .98fr;
  gap: 10px;
}

.sprx-subcard {
  min-height: 150px;
  padding: 10px;
  border: 1px solid #c5dff4;
  border-radius: 10px;
  background: #ffffff;
}

.sprx-subcard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.sprx-subcard-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0a447d;
}

.sprx-subcard-title h3 {
  margin: 0;
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
}

.sprx-homework-layout {
  display: grid;
  grid-template-columns:
    1fr 120px;
  gap: 8px;
  min-height: 110px;
}

.sprx-homework-stats {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
}

.sprx-homework-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #cfe0ef;
  text-align: center;
}

.sprx-homework-stat:last-child {
  border-right: 0;
}

.sprx-homework-stat .icon {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  margin-bottom: 5px;
  border-radius: 50%;
  color: #ffffff;
}

.sprx-homework-stat.completed .icon {
  background: #1fbd7a;
}

.sprx-homework-stat.pending .icon {
  background: #ffad14;
}

.sprx-homework-stat.overdue .icon {
  background: #ef3f4e;
}

.sprx-homework-stat span {
  color: #1d4d80;
  font-size: 8px;
  font-weight: 850;
}

.sprx-homework-stat strong {
  margin-top: 3px;
  color: #062f62;
  font-size: 19px;
  font-weight: 950;
}

.sprx-homework-stat small {
  margin-top: 2px;
  color: #637b93;
  font-size: 7px;
}

.sprx-books-art {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-radius: 10px;
  background:
    linear-gradient(
      145deg,
      #f7fbff,
      #e5f3ff
    );
}

.sprx-books-art svg {
  width: 70px;
  height: 70px;
  color: #0755a3;
  opacity: .9;
}

.sprx-books-art::before,
.sprx-books-art::after {
  content: "";
  position: absolute;
  bottom: 13px;
  width: 66px;
  height: 9px;
  border-radius: 3px;
  background: #216fb6;
}

.sprx-books-art::before {
  transform:
    translateY(12px)
    rotate(-3deg);
}

.sprx-books-art::after {
  background: #78ace0;
  transform:
    translateY(25px)
    rotate(2deg);
}

.sprx-subject-cards {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 7px;
}

.sprx-subject-card {
  min-height: 103px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px;
  text-align: center;
  border: 1px solid #d5e6f4;
  border-radius: 7px;
  background:
    linear-gradient(
      180deg,
      #ffffff,
      #f8fbff
    );
}

.sprx-subject-card span {
  display: block;
  min-height: 25px;
  color: #325c85;
  font-size: 8px;
  line-height: 1.2;
  font-weight: 800;
}

.sprx-subject-card strong {
  color: #072f5e;
  font-size: 20px;
  font-weight: 950;
}

.sprx-subject-card small {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #12a66b;
  font-size: 8px;
  font-weight: 900;
}

.sprx-analysis-grid {
  display: grid;
  grid-template-columns:
    .9fr 1.18fr 1fr;
  gap: 9px;
}

.sprx-analysis-card {
  min-height: 205px;
  padding: 10px;
  border: 1px solid #ccdfef;
  border-radius: 9px;
  background: #ffffff;
}

.sprx-analysis-card h3 {
  margin: 0 0 10px;
  color: #164f83;
  font-size: 9px;
  font-weight: 950;
  text-transform: uppercase;
}

.sprx-accuracy-layout {
  display: grid;
  grid-template-columns:
    105px 1fr;
  gap: 9px;
  align-items: center;
}

.sprx-donut {
  position: relative;
  width: 100px;
  height: 100px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.sprx-donut::after {
  content: "";
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ffffff;
}

.sprx-donut strong {
  position: absolute;
  z-index: 1;
  color: #082f5d;
  font-size: 18px;
  font-weight: 950;
}

.sprx-legend {
  display: grid;
  gap: 10px;
}

.sprx-legend-row {
  display: grid;
  grid-template-columns:
    8px 1fr auto;
  gap: 5px;
  align-items: center;
  color: #244e79;
  font-size: 8px;
}

.sprx-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.sprx-legend-row strong {
  color: #102f56;
  font-size: 9px;
}

.sprx-stacked {
  margin-top: 12px;
  height: 9px;
  display: flex;
  overflow: hidden;
  border-radius: 99px;
  background: #e4edf4;
}

.sprx-stacked > span {
  height: 100%;
}

.sprx-attendance-chart {
  height: 150px;
  display: grid;
  grid-template-columns:
    28px 1fr;
  gap: 7px;
}

.sprx-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 18px;
  color: #56728f;
  font-size: 7px;
}

.sprx-bars {
  display: grid;
  grid-template-columns:
    repeat(7, 1fr);
  gap: 5px;
  align-items: end;
  border-left: 1px solid #dae7f1;
  border-bottom: 1px solid #dae7f1;
  background:
    linear-gradient(
      #edf3f8 1px,
      transparent 1px
    );
  background-size:
    100% 25%;
}

.sprx-bar-column {
  height: 100%;
  display: grid;
  grid-template-rows:
    1fr 17px;
  align-items: end;
  justify-items: center;
}

.sprx-bar-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
}

.sprx-bar {
  position: relative;
  width: 68%;
  min-height: 4px;
  border-radius: 5px 5px 0 0;
  background:
    linear-gradient(
      180deg,
      #3679bc,
      #0755a5
    );
}

.sprx-bar b {
  position: absolute;
  top: -14px;
  left: 50%;
  transform:
    translateX(-50%);
  color: #123f70;
  font-size: 7px;
}

.sprx-bar-column > span {
  color: #54708b;
  font-size: 7px;
}

.sprx-subject-performance {
  display: grid;
  gap: 10px;
}

.sprx-subject-performance-row {
  display: grid;
  gap: 4px;
}

.sprx-subject-performance-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #31597f;
  font-size: 8px;
  font-weight: 800;
}

.sprx-performance-track {
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: #e4ecf3;
}

.sprx-performance-fill {
  height: 100%;
  border-radius: inherit;
}

.sprx-insights-grid {
  margin-top: 9px;
  display: grid;
  grid-template-columns:
    .95fr 1.25fr;
  gap: 9px;
}

.sprx-feedback-card {
  min-height: 125px;
  padding: 10px;
  border: 1px solid #cddfed;
  border-radius: 9px;
}

.sprx-feedback-body {
  display: grid;
  grid-template-columns:
    52px 1fr;
  gap: 9px;
  align-items: center;
}

.sprx-mentor-avatar {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background:
    linear-gradient(
      145deg,
      #163f6b,
      #6a8cab
    );
}

.sprx-feedback-text {
  color: #315879;
  font-size: 9px;
  line-height: 1.55;
}

.sprx-feedback-sign {
  margin-top: 5px;
  color: #174f84;
  font-size: 8px;
  font-weight: 850;
}

.sprx-insight-panel {
  min-height: 125px;
  display: grid;
  grid-template-columns:
    1fr 175px;
  gap: 10px;
  padding: 10px;
  border: 1px solid #cddfed;
  border-radius: 9px;
}

.sprx-insights {
  display: grid;
  gap: 6px;
}

.sprx-insight {
  display: grid;
  grid-template-columns:
    16px 1fr;
  gap: 5px;
  color: #31587c;
  font-size: 8px;
  line-height: 1.4;
}

.sprx-insight svg {
  color: #0757a4;
}

.sprx-quote {
  min-height: 95px;
  display: grid;
  place-items: center;
  padding: 10px;
  text-align: center;
  border: 1px solid #bcdaf2;
  border-radius: 10px;
  background:
    linear-gradient(
      145deg,
      #f2f9ff,
      #dceefe
    );
}

.sprx-quote svg {
  color: #073f7b;
}

.sprx-quote strong {
  color: #092f5e;
  font-size: 13px;
  line-height: 1.15;
  font-weight: 950;
}

.sprx-activities {
  display: grid;
  grid-template-columns:
    repeat(5, 1fr);
  gap: 8px;
}

.sprx-activity-card {
  min-height: 131px;
  padding: 9px;
  border: 1px solid #c8ddf0;
  border-radius: 9px;
  background:
    linear-gradient(
      180deg,
      #ffffff,
      #f8fbff
    );
}

.sprx-activity-heading {
  display: grid;
  grid-template-columns:
    33px 1fr;
  gap: 6px;
  align-items: center;
}

.sprx-activity-icon {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: #0756a3;
}

.sprx-activity-heading strong {
  display: block;
  color: #0f467b;
  font-size: 8px;
}

.sprx-activity-heading small {
  color: #6c8297;
  font-size: 7px;
}

.sprx-activity-card p {
  min-height: 42px;
  margin: 8px 0 7px;
  color: #3c617f;
  font-size: 8px;
  line-height: 1.4;
}

.sprx-activity-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  border-radius: 99px;
  color: #0d8658;
  background: #ddf6eb;
  font-size: 7px;
  font-weight: 850;
}

.sprx-footer {
  min-height: 54px;
  margin-top: 12px;
  display: grid;
  grid-template-columns:
    auto 1px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 0 18px;
  color: #ffffff;
  background:
    linear-gradient(
      90deg,
      #00254f,
      #004a94
    );
}

.sprx-footer-brand {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 850;
}

.sprx-footer-divider {
  width: 1px;
  height: 22px;
  background:
    rgba(
      255,
      255,
      255,
      .55
    );
}

.sprx-footer-tagline {
  color: #d8e9f8;
  font-size: 9px;
}

.sprx-page-number {
  padding: 7px 14px;
  border: 1px solid #8cc5ef;
  border-radius: 99px;
  font-size: 8px;
  font-weight: 800;
}

@media (
  max-width:
    760px
) {
  .sprx-header {
    grid-template-columns:
      1fr;
  }

  .sprx-header-divider,
  .sprx-dreams {
    display: none;
  }

  .sprx-header-kpis,
  .sprx-info-grid,
  .sprx-metrics-grid,
  .sprx-dual-grid,
  .sprx-analysis-grid,
  .sprx-insights-grid,
  .sprx-activities {
    grid-template-columns:
      1fr;
  }

  .sprx-student-panel {
    grid-template-columns:
      1fr;
  }

  .sprx-subject-cards {
    grid-template-columns:
      repeat(
        2,
        1fr
      );
  }

  .sprx-homework-layout {
    grid-template-columns:
      1fr;
  }

  .sprx-page {
    width: 100%;
  }
}

@media print {
  @page {
    size:
      A4 portrait;

    margin:
      0;
  }

  html,
  body {
    margin:
      0 !important;

    padding:
      0 !important;

    background:
      #ffffff !important;

    -webkit-print-color-adjust:
      exact !important;

    print-color-adjust:
      exact !important;
  }

  .no-print,
  .no-report-chrome,
  .report-print-actions {
    display:
      none !important;
  }

  .sprx-root {
    padding:
      0 !important;

    background:
      #ffffff !important;
  }

  .sprx-page {
    width:
      210mm !important;

    height:
      297mm !important;

    min-height:
      297mm !important;

    margin:
      0 !important;

    border:
      0 !important;

    box-shadow:
      none !important;

    overflow:
      hidden !important;
  }

  .sprx-header {
    min-height:
      37mm !important;
  }

  .sprx-content {
    padding:
      3.2mm 4mm 0 !important;
  }

  .sprx-footer {
    min-height:
      13mm !important;
  }
}
`;

export default function StudentPerformanceReport({
  report,
}: {
  report:
    Report;
}) {
  useEffect(
    () => {
      document.body.classList.add(
        "report-only-mode",
      );

      return () => {
        document.body.classList.remove(
          "report-only-mode",
        );
      };
    },
    [],
  );

  const subjects =
    report.subjectWiseMarks ??
    [];

  const homework =
    report.homeworkCompletion ??
    [];

  const attendance =
    report.attendanceGraph ??
    [];

  const accuracySplit =
    report.accuracySplit ?? {
      correct:
        0,

      wrong:
        0,

      unattempted:
        0,
    };

  const strengths =
    report.strengthsWeaknesses ?? {
      strongSubject:
        "",

      weakSubject:
        "",

      timeManagement:
        "",

      weakChapters:
        [],
    };

  const suggestions =
    report.suggestions ?? {};

  const academyName =
    report.academyName ||
    "SmartIQ Academy";

  const reportTitle =
    useMemo(
      () =>
        report.reportType ===
        "monthly"
          ? "Monthly Student Performance Report"
          : "Weekly Student Performance Report",
      [
        report.reportType,
      ],
    );

  const createdDate =
    safeDate(
      report.createdAt,
    );

  const improvement =
    getImprovement(
      report,
    );

  const average =
    numberValue(
      report.metrics
        .averageScore,
    );

  const attendancePercentage =
    numberValue(
      report.metrics
        .attendancePercentage,
    );

  const homeworkPercentage =
    numberValue(
      report.metrics
        .homeworkCompletionPercentage,
    );

  const accuracy =
    numberValue(
      report.metrics
        .accuracyPercentage,
    );

  const location =
    [
      report.student
        .address,
      report.student
        .city,
      report.student
        .state,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Not added";

  const totalAssigned =
    homework.reduce(
      (
        total,
        item,
      ) =>
        total +
        numberValue(
          item.assigned,
        ),
      0,
    );

  const totalCompleted =
    homework.reduce(
      (
        total,
        item,
      ) =>
        total +
        Math.min(
          numberValue(
            item.completed,
          ),
          numberValue(
            item.assigned,
          ),
        ),
      0,
    );

  const totalPending =
    Math.max(
      0,
      totalAssigned -
        totalCompleted,
    );

  const overdue =
    0;

  const correct =
    numberValue(
      accuracySplit.correct,
    );

  const wrong =
    numberValue(
      accuracySplit.wrong,
    );

  const unattempted =
    numberValue(
      accuracySplit.unattempted,
    );

  const answerTotal =
    correct +
      wrong +
      unattempted ||
    1;

  const correctShare =
    roundValue(
      (
        correct /
        answerTotal
      ) *
        100,
    );

  const wrongShare =
    roundValue(
      (
        wrong /
        answerTotal
      ) *
        100,
    );

  const unattemptedShare =
    Math.max(
      0,
      roundValue(
        100 -
          correctShare -
          wrongShare,
      ),
    );

  const subjectSlots =
    Array.from(
      {
        length:
          4,
      },
      (
        _,
        index,
      ) =>
        subjects[index] ??
        null,
    );

  const strongestSubject =
    [...subjects].sort(
      (
        first,
        second,
      ) =>
        numberValue(
          second.score,
        ) -
        numberValue(
          first.score,
        ),
    )[0];

  const weakestSubject =
    [...subjects].sort(
      (
        first,
        second,
      ) =>
        numberValue(
          first.score,
        ) -
        numberValue(
          second.score,
        ),
    )[0];

  const insightRows = [
    attendancePercentage >=
    90
      ? `Attendance is strong at ${displayPercent(
          attendancePercentage,
        )}%.`
      : `Attendance is currently ${displayPercent(
          attendancePercentage,
        )}%. Regular attendance can improve consistency.`,

    strongestSubject
      ? `Strongest performance is in ${strongestSubject.subject} at ${displayPercent(
          strongestSubject.score,
        )}%.`
      : "Add subject marks to identify the student's strongest subject.",

    weakestSubject &&
    subjects.length > 1
      ? `Focus on ${weakestSubject.subject} to improve the overall score.`
      : `Homework completion is ${displayPercent(
          homeworkPercentage,
        )}%.`,

    accuracy >= 80
      ? `Accuracy is strong at ${displayPercent(
          accuracy,
        )}%. Maintain the current practice routine.`
      : `Accuracy is ${displayPercent(
          accuracy,
        )}%. Review incorrect answers after each test.`,
  ];

  const attendanceRows =
    Array.from(
      {
        length:
          7,
      },
      (
        _,
        index,
      ) => {
        const item =
          attendance[index];

        if (!item) {
          return {
            label:
              DAYS[
                (
                  createdDate.getUTCDay() -
                  6 +
                  index +
                  14
                ) %
                  7
              ],

            percentage:
              0,

            present:
              false,
          };
        }

        const parsedDate =
          safeDate(
            item.date,
          );

        return {
          label:
            DAYS[
              parsedDate.getUTCDay()
            ],

          percentage:
            item.present
              ? 100
              : 0,

          present:
            item.present,
        };
      },
    );

  const recentActivities = [
    {
      icon:
        CalendarDays,

      title:
        "Study Plan",

      date:
        formatDate(
          report.createdAt,
        ),

      text:
        subjects.length
          ? `${subjects.length} subject${
              subjects.length ===
              1
                ? ""
                : "s"
            } reviewed in this report.`
          : "No subject records added yet.",

      status:
        subjects.length
          ? "Completed"
          : "Pending",
    },

    {
      icon:
        FileText,

      title:
        "Mock Test Analysis",

      date:
        formatDate(
          report.createdAt,
        ),

      text:
        `Accuracy ${displayPercent(
          accuracy,
        )}%. Correct ${correct}, wrong ${wrong}.`,

      status:
        "Reviewed",
    },

    {
      icon:
        BookOpen,

      title:
        "Homework",

      date:
        formatDate(
          report.createdAt,
        ),

      text:
        `${totalCompleted} of ${totalAssigned} assigned items completed.`,

      status:
        homeworkPercentage >=
        80
          ? "Completed"
          : "In Progress",
    },

    {
      icon:
        TrendingUp,

      title:
        "Progress Tracker",

      date:
        formatDate(
          report.createdAt,
        ),

      text:
        report.metrics
          .improvementAvailable ===
        false
          ? "This report is the student's performance baseline."
          : `Performance change is ${improvement.display} compared with the previous report.`,

      status:
        numberValue(
          report.metrics
            .improvementPercentage,
        ) >= 0
          ? "On Track"
          : "Needs Focus",
    },

    {
      icon:
        Bell,

      title:
        "Attendance",

      date:
        formatDate(
          report.createdAt,
        ),

      text:
        `Overall attendance is ${displayPercent(
          attendancePercentage,
        )}%.`,

      status:
        attendancePercentage >=
        85
          ? "Active"
          : "Review",
    },
  ];

  const subjectColors = [
    "#28b974",
    "#2e8fe5",
    "#cb72d2",
    "#f28a28",
  ];

  return (
    <>
      <style>
        {REPORT_CSS}
      </style>

      <main className="sprx-root">
        <section className="sprx-page">
          {/* TOP HEADER */}

          <div className="sprx-header">
            <div className="sprx-logo-card">
              <img
                src="/logoSIQ.png"
                alt="SmartIQ Institute"
              />
            </div>

            <div className="sprx-header-divider" />

            <div className="sprx-header-title">
              <span className="small">
                {report.reportType ===
                "monthly"
                  ? "MONTHLY STUDENT"
                  : "WEEKLY STUDENT"}
              </span>

              <h1>
                PERFORMANCE REPORT
              </h1>

              <div className="sprx-academy-title">
                {academyName}
              </div>
            </div>

            <div className="sprx-header-kpis">
              <HeaderKpi
                icon={
                  BarChart3
                }
                label="Average Score"
                value={`${displayPercent(
                  average,
                )}%`}
                helper="Current average"
              />

              <HeaderKpi
                icon={
                  CalendarDays
                }
                label="Attendance"
                value={`${displayPercent(
                  attendancePercentage,
                )}%`}
                helper="Overall attendance"
              />

              <HeaderKpi
                icon={
                  CheckCircle2
                }
                label="Status"
                value={
                  report.status ||
                  (
                    average >=
                    70
                      ? "On Track"
                      : "Needs Focus"
                  )
                }
                helper="Current status"
                green
              />
            </div>

            <div className="sprx-dreams">
              Small
              <br />
              Steps
              <br />
              Big
              <br />
              Dreams ♡
            </div>
          </div>

          <div className="sprx-content">
            {/* STUDENT DETAILS */}

            <section className="sprx-student-panel">
              <div className="sprx-photo-card">
                <div className="sprx-photo-area">
                  {report.student
                    .photo ? (
                    <img
                      src={
                        report
                          .student
                          .photo
                      }
                      alt={
                        report
                          .student
                          .name ||
                        "Student"
                      }
                    />
                  ) : (
                    <div className="sprx-avatar">
                      {getInitials(
                        report
                          .student
                          .name,
                      )}
                    </div>
                  )}
                </div>

                <div className="sprx-photo-name">
                  {report.student
                    .name ||
                    "Student"}
                </div>
              </div>

              <div className="sprx-info-grid">
                <InfoCell
                  icon={
                    User
                  }
                  label="Student Name"
                  value={
                    report.student
                      .name
                  }
                />

                <InfoCell
                  icon={
                    GraduationCap
                  }
                  label="Class"
                  value={
                    report.student
                      .classLevel
                  }
                />

                <InfoCell
                  icon={
                    BookOpen
                  }
                  label="Course"
                  value={
                    report.student
                      .course
                  }
                />

                <InfoCell
                  icon={
                    Users
                  }
                  label="Parent"
                  value={`${report.student.parentName || "Not added"}${
                    report
                      .student
                      .parentRelation
                      ? ` (${report.student.parentRelation})`
                      : ""
                  }`}
                />

                <InfoCell
                  icon={
                    Phone
                  }
                  label="Contact"
                  value={
                    report.student
                      .parentContact
                  }
                />

                <InfoCell
                  icon={
                    MapPin
                  }
                  label="Location"
                  value={
                    location
                  }
                />
              </div>
            </section>

            {/* PERFORMANCE */}

            <section className="sprx-card-section">
              <SectionTitle
                icon={
                  BarChart3
                }
                title={
                  report.reportType ===
                  "monthly"
                    ? "Monthly Performance"
                    : "Weekly Performance"
                }
                right={
                  <>
                    <span className="sprx-period-info">
                      <CalendarDays
                        size={
                          12
                        }
                      />

                      {report.reportType ===
                      "monthly"
                        ? `This Month: ${
                            MONTHS[
                              createdDate.getUTCMonth()
                            ]
                          } ${createdDate.getUTCFullYear()}`
                        : `This Week: ${getWeekRange(
                            report.createdAt,
                          )}`}
                    </span>

                    <span className="sprx-select-pill">
                      Last 4 Weeks

                      <ChevronDown
                        size={
                          11
                        }
                      />
                    </span>
                  </>
                }
              />

              <div className="sprx-metrics-grid">
                <MetricCard
                  icon={
                    Target
                  }
                  label={
                    report.reportType ===
                    "monthly"
                      ? "Monthly Average Score"
                      : "Weekly Average Score"
                  }
                  value={`${displayPercent(
                    average,
                  )}%`}
                  change={
                    improvement.delta
                  }
                  helper="vs. previous report"
                />

                <MetricCard
                  icon={
                    CalendarDays
                  }
                  label="Attendance"
                  value={`${displayPercent(
                    attendancePercentage,
                  )}%`}
                  change={
                    attendancePercentage >=
                    85
                      ? "On Track"
                      : "Needs Focus"
                  }
                  helper="overall attendance"
                />

                <MetricCard
                  icon={
                    ClipboardList
                  }
                  label="Homework Completion"
                  value={`${displayPercent(
                    homeworkPercentage,
                  )}%`}
                  change={
                    homeworkPercentage >=
                    80
                      ? "On Track"
                      : "Needs Focus"
                  }
                  helper="completion rate"
                />

                <MetricCard
                  icon={
                    TrendingUp
                  }
                  label="Improvement"
                  value={
                    improvement.display
                  }
                  change={
                    improvement.delta
                  }
                  helper="vs. previous report"
                />

                <MetricCard
                  icon={
                    Target
                  }
                  label="Accuracy"
                  value={`${displayPercent(
                    accuracy,
                  )}%`}
                  change={
                    accuracy >=
                    80
                      ? "Strong"
                      : "Improve"
                  }
                  helper="correct vs. wrong"
                />
              </div>

              {/* HOMEWORK + SUBJECT MARKS */}

              <div className="sprx-dual-grid">
                <div className="sprx-subcard">
                  <div className="sprx-subcard-header">
                    <div className="sprx-subcard-title">
                      <ClipboardList
                        size={
                          18
                        }
                      />

                      <h3>
                        Homework &
                        Assignments
                      </h3>
                    </div>

                    <span className="sprx-mini-btn">
                      View All
                    </span>
                  </div>

                  <div className="sprx-homework-layout">
                    <div className="sprx-homework-stats">
                      <div className="sprx-homework-stat completed">
                        <div className="icon">
                          <CheckCircle2
                            size={
                              17
                            }
                          />
                        </div>

                        <span>
                          Completed
                        </span>

                        <strong>
                          {
                            totalCompleted
                          }
                        </strong>

                        <small>
                          This report
                        </small>
                      </div>

                      <div className="sprx-homework-stat pending">
                        <div className="icon">
                          <Clock3
                            size={
                              17
                            }
                          />
                        </div>

                        <span>
                          Pending
                        </span>

                        <strong>
                          {
                            totalPending
                          }
                        </strong>

                        <small>
                          To be done
                        </small>
                      </div>

                      <div className="sprx-homework-stat overdue">
                        <div className="icon">
                          <XCircle
                            size={
                              17
                            }
                          />
                        </div>

                        <span>
                          Overdue
                        </span>

                        <strong>
                          {
                            overdue
                          }
                        </strong>

                        <small>
                          Needs attention
                        </small>
                      </div>
                    </div>

                    <div className="sprx-books-art">
                      <BookOpen
                        strokeWidth={
                          1.7
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="sprx-subcard">
                  <div className="sprx-subcard-header">
                    <div className="sprx-subcard-title">
                      <BarChart3
                        size={
                          18
                        }
                      />

                      <h3>
                        Subject-wise
                        Marks
                      </h3>
                    </div>

                    <span className="sprx-mini-btn">
                      View Details
                    </span>
                  </div>

                  <div className="sprx-subject-cards">
                    {subjectSlots.map(
                      (
                        subject,
                        index,
                      ) => (
                        <div
                          className="sprx-subject-card"
                          key={
                            subject
                              ? `${subject.subject}-${index}`
                              : `empty-${index}`
                          }
                        >
                          <span>
                            {subject
                              ?.subject ||
                              "Not added"}
                          </span>

                          <strong>
                            {subject
                              ? `${displayPercent(
                                  subject.score,
                                )}%`
                              : "—"}
                          </strong>

                          <small>
                            {subject ? (
                              <>
                                <ArrowUp
                                  size={
                                    10
                                  }
                                  strokeWidth={
                                    3
                                  }
                                />

                                Current
                              </>
                            ) : (
                              "No data"
                            )}
                          </small>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* PERFORMANCE ANALYSIS */}

            <section className="sprx-card-section">
              <SectionTitle
                icon={
                  BarChart3
                }
                title="Performance Analysis"
                right={
                  <span className="sprx-select-pill">
                    {report.reportType ===
                    "monthly"
                      ? "This Month"
                      : "This Week"}

                    <ChevronDown
                      size={
                        11
                      }
                    />
                  </span>
                }
              />

              <div className="sprx-analysis-grid">
                {/* ACCURACY */}

                <div className="sprx-analysis-card">
                  <h3>
                    Accuracy Breakdown
                  </h3>

                  <div className="sprx-accuracy-layout">
                    <div
                      className="sprx-donut"
                      style={{
                        background:
                          `conic-gradient(
                            #18ad78 0 ${correctShare}%,
                            #ffb21a ${correctShare}% ${
                              correctShare +
                              wrongShare
                            }%,
                            #ef3f4e ${
                              correctShare +
                              wrongShare
                            }% 100%
                          )`,
                      }}
                    >
                      <strong>
                        {displayPercent(
                          accuracy,
                        )}
                        %
                      </strong>
                    </div>

                    <div className="sprx-legend">
                      <div className="sprx-legend-row">
                        <span
                          className="sprx-legend-dot"
                          style={{
                            background:
                              "#18ad78",
                          }}
                        />

                        <span>
                          Correct
                        </span>

                        <strong>
                          {displayPercent(
                            correctShare,
                          )}
                          %
                        </strong>
                      </div>

                      <div className="sprx-legend-row">
                        <span
                          className="sprx-legend-dot"
                          style={{
                            background:
                              "#ffb21a",
                          }}
                        />

                        <span>
                          Wrong
                        </span>

                        <strong>
                          {displayPercent(
                            wrongShare,
                          )}
                          %
                        </strong>
                      </div>

                      <div className="sprx-legend-row">
                        <span
                          className="sprx-legend-dot"
                          style={{
                            background:
                              "#ef3f4e",
                          }}
                        />

                        <span>
                          Unattempted
                        </span>

                        <strong>
                          {displayPercent(
                            unattemptedShare,
                          )}
                          %
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="sprx-stacked">
                    <span
                      style={{
                        width:
                          `${correctShare}%`,

                        background:
                          "#18ad78",
                      }}
                    />

                    <span
                      style={{
                        width:
                          `${wrongShare}%`,

                        background:
                          "#ffb21a",
                      }}
                    />

                    <span
                      style={{
                        width:
                          `${unattemptedShare}%`,

                        background:
                          "#ef3f4e",
                      }}
                    />
                  </div>
                </div>

                {/* ATTENDANCE */}

                <div className="sprx-analysis-card">
                  <div className="sprx-subcard-header">
                    <h3
                      style={{
                        margin:
                          0,
                      }}
                    >
                      Attendance
                      Overview
                    </h3>

                    <span className="sprx-mini-btn">
                      View Details
                    </span>
                  </div>

                  <div className="sprx-attendance-chart">
                    <div className="sprx-axis">
                      <span>
                        100%
                      </span>

                      <span>
                        75%
                      </span>

                      <span>
                        50%
                      </span>

                      <span>
                        25%
                      </span>

                      <span>
                        0%
                      </span>
                    </div>

                    <div className="sprx-bars">
                      {attendanceRows.map(
                        (
                          day,
                          index,
                        ) => (
                          <div
                            className="sprx-bar-column"
                            key={`${day.label}-${index}`}
                          >
                            <div className="sprx-bar-wrap">
                              <div
                                className="sprx-bar"
                                style={{
                                  height:
                                    `${Math.max(
                                      day.present
                                        ? 12
                                        : 4,
                                      day.percentage,
                                    )}%`,

                                  opacity:
                                    day.present
                                      ? 1
                                      : .32,
                                }}
                              >
                                <b>
                                  {
                                    day.percentage
                                  }
                                  %
                                </b>
                              </div>
                            </div>

                            <span>
                              {
                                day.label
                              }
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* SUBJECT PERFORMANCE */}

                <div className="sprx-analysis-card">
                  <h3>
                    Subject Wise
                    Performance
                  </h3>

                  <div className="sprx-subject-performance">
                    {subjectSlots.map(
                      (
                        subject,
                        index,
                      ) => {
                        const score =
                          subject
                            ? numberValue(
                                subject.score,
                              )
                            : 0;

                        return (
                          <div
                            className="sprx-subject-performance-row"
                            key={`performance-${index}`}
                          >
                            <div className="sprx-subject-performance-top">
                              <span>
                                {subject
                                  ?.subject ||
                                  "Not added"}
                              </span>

                              <strong>
                                {subject
                                  ? `${displayPercent(
                                      score,
                                    )}%`
                                  : "—"}
                              </strong>
                            </div>

                            <div className="sprx-performance-track">
                              <div
                                className="sprx-performance-fill"
                                style={{
                                  width:
                                    `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        score,
                                      ),
                                    )}%`,

                                  background:
                                    subjectColors[
                                      index
                                    ],
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* FEEDBACK + INSIGHTS */}

              <div className="sprx-insights-grid">
                <div className="sprx-feedback-card">
                  <div className="sprx-subcard-header">
                    <div className="sprx-subcard-title">
                      <MessageCircle
                        size={
                          18
                        }
                      />

                      <h3>
                        Teacher
                        Feedback
                      </h3>
                    </div>

                    <span className="sprx-mini-btn">
                      View Feedback
                    </span>
                  </div>

                  <div className="sprx-feedback-body">
                    <div className="sprx-mentor-avatar">
                      <User
                        size={
                          24
                        }
                      />
                    </div>

                    <div>
                      <div className="sprx-feedback-text">
                        {suggestions.teacherRemark ||
                          "Performance feedback will appear here after the report is analysed."}
                      </div>

                      <div className="sprx-feedback-sign">
                        - Mentor
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sprx-insight-panel">
                  <div>
                    <div className="sprx-subcard-title">
                      <Lightbulb
                        size={
                          19
                        }
                      />

                      <h3>
                        Key Insights
                      </h3>
                    </div>

                    <div
                      className="sprx-insights"
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      {insightRows.map(
                        (
                          insight,
                          index,
                        ) => (
                          <div
                            className="sprx-insight"
                            key={
                              index
                            }
                          >
                            <CheckCircle2
                              size={
                                13
                              }
                              strokeWidth={
                                2.8
                              }
                            />

                            <span>
                              {
                                insight
                              }
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* RECENT ACTIVITY */}

            <section className="sprx-card-section">
              <SectionTitle
                icon={
                  Clock3
                }
                title="Recent Activities & Progress"
                right={
                  <span className="sprx-mini-btn">
                    View All
                  </span>
                }
              />

              <div className="sprx-activities">
                {recentActivities.map(
                  (
                    activity,
                    index,
                  ) => {
                    const Icon =
                      activity.icon;

                    return (
                      <article
                        className="sprx-activity-card"
                        key={`${activity.title}-${index}`}
                      >
                        <div className="sprx-activity-heading">
                          <div className="sprx-activity-icon">
                            <Icon
                              size={
                                17
                              }
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                activity.title
                              }
                            </strong>

                            <small>
                              {
                                activity.date
                              }
                            </small>
                          </div>
                        </div>

                        <p>
                          {
                            activity.text
                          }
                        </p>

                        <span className="sprx-activity-status">
                          <CheckCircle2
                            size={
                              10
                            }
                          />

                          {
                            activity.status
                          }
                        </span>
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <div className="sprx-footer">
            <div className="sprx-footer-brand">
              <BookOpen
                size={
                  19
                }
              />

              SmartIQ Institute
            </div>

            <div className="sprx-footer-divider" />

            <div className="sprx-footer-tagline">
              Learn Smart.
              Perform Better.
              Achieve More.
            </div>
          </div>
        </section>
      </main>
    </>
  );
}