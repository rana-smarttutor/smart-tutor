export type ExamScheduleEventType =
  | "exam"
  | "application-start"
  | "application-deadline"
  | "admit-card"
  | "answer-key"
  | "result";

export type ExamScheduleVerification = "verified" | "pending-review";

export type VerifiedExamSchedule = {
  courseSlug: string;
  examYear: number;
  stage: string;
  eventType: ExamScheduleEventType;
  startDate: string;
  endDate?: string;
  sourceUrl: string;
  sourceTitle: string;
  verifiedAt?: string;
  verification: ExamScheduleVerification;
  notes?: string;
};

/**
 * Verified against NTA JEE(Main) 2027 Information Bulletin,
 * page 5 (PDF page index 5), on 2026-11-14.
 * The bulletin lists individual exam days, not continuous windows.
 */
const JEE_MAIN_2027_BULLETIN =
  "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/10/202610241890224107.pdf";

function jeeMain2027Event(
  stage: string,
  eventType: ExamScheduleEventType,
  startDate: string,
  notes?: string,
): VerifiedExamSchedule {
  return {
    courseSlug: "jee-main",
    examYear: 2027,
    stage,
    eventType,
    startDate,
    sourceUrl: JEE_MAIN_2027_BULLETIN,
    sourceTitle:
      "NTA JEE (Main) 2027 Information Bulletin — Important Dates, page 5",
    verifiedAt: "2026-11-14",
    verification: "verified",
    ...(notes ? { notes } : {}),
  };
}

/** Only manually reviewed official dates should be marked verified. */
export const verifiedExamSchedules: VerifiedExamSchedule[] = [
  jeeMain2027Event(
    "Session 1 — Application opens",
    "application-start",
    "2026-10-24",
  ),
  jeeMain2027Event(
    "Session 1 — Regular application deadline",
    "application-deadline",
    "2026-11-22",
    "11:50 PM IST; NTA also lists a late-fee application window, 23–26 Nov 2026.",
  ),
  jeeMain2027Event(
    "Session 1 — Admit cards",
    "admit-card",
    "2027-01-13",
    "Date given in the 2027 information bulletin; check NTA for updates.",
  ),
  ...[
    "2027-01-20",
    "2027-01-21",
    "2027-01-22",
    "2027-01-23",
    "2027-01-24",
    "2027-01-28",
  ].map((date) =>
    jeeMain2027Event(
      "Session 1 — Examination",
      "exam",
      date,
      "Scheduled examination day; individual paper and shift depend on the admit card.",
    ),
  ),
  jeeMain2027Event(
    "Session 2 — Application opens",
    "application-start",
    "2027-01-05",
  ),
  jeeMain2027Event(
    "Session 2 — Regular application deadline",
    "application-deadline",
    "2027-02-03",
    "11:50 PM IST; NTA also lists a late-fee application window, 4–7 Feb 2027.",
  ),
  jeeMain2027Event(
    "Session 2 — Admit cards",
    "admit-card",
    "2027-03-25",
    "Date given in the 2027 information bulletin; check NTA for updates.",
  ),
  ...[
    "2027-04-02",
    "2027-04-03",
    "2027-04-04",
    "2027-04-05",
    "2027-04-06",
    "2027-04-07",
  ].map((date) =>
    jeeMain2027Event(
      "Session 2 — Examination",
      "exam",
      date,
      "Scheduled examination day; individual paper and shift depend on the admit card.",
    ),
  ),
];

export function getVerifiedExamSchedules(
  courseSlug: string,
  examYear?: number,
): VerifiedExamSchedule[] {
  return verifiedExamSchedules
    .filter((event) => {
      if (event.courseSlug !== courseSlug) return false;
      if (event.verification !== "verified") return false;
      if (!event.verifiedAt || !event.sourceUrl) return false;
      if (examYear !== undefined && event.examYear !== examYear) return false;
      return true;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getVerifiedExamDates(
  courseSlug: string,
  examYear?: number,
): VerifiedExamSchedule[] {
  return getVerifiedExamSchedules(courseSlug, examYear).filter(
    (event) => event.eventType === "exam",
  );
}
