import type { ExamUpdate } from "@/lib/exam-updates";

/**
 * A possible match between a course slug and an official
 * examination notice.
 *
 * IMPORTANT:
 * Matching a notice does not verify the examination date.
 */
export type CourseExamNoticeMatch = {
  update: ExamUpdate;
  courseSlug: string;
  examYear: number | null;
  eventType: ExamUpdate["type"];
  confidence: "candidate";
  requiresReview: true;
};

type ExamRule = {
  aliases: string[];
  exclude?: string[];
  allowedSourceKeys?: string[];
};

/**
 * Examination matching configuration.
 *
 * Each course slug is matched against the notice TITLE.
 * Generic authority names alone are not sufficient.
 */
const EXAM_RULES: Record<string, ExamRule> = {
  "jee-main": {
    aliases: ["jee main", "jee mains", "joint entrance examination main"],
    allowedSourceKeys: ["jee-main"],
    exclude: ["jee advanced"],
  },

  "jee-advanced": {
    aliases: ["jee advanced", "joint entrance examination advanced"],
    allowedSourceKeys: ["jee-advanced"],
    exclude: ["jee main"],
  },

  "neet-coaching": {
    aliases: [
      "neet ug",
      "neet undergraduate",
      "national eligibility cum entrance test ug",
    ],
    allowedSourceKeys: ["neet"],
    exclude: ["neet pg", "neet ss", "neet mds"],
  },

  "ssc-cgl": {
    aliases: ["ssc cgl", "combined graduate level"],
    exclude: ["ssc chsl"],
  },

  "ssc-chsl": {
    aliases: ["ssc chsl", "combined higher secondary"],
  },

  "ssc-mts": {
    aliases: [
      "ssc mts",
      "multi tasking staff",
      "multi tasking non technical staff",
    ],
  },

  "ssc-cpo": {
    aliases: [
      "ssc cpo",
      "sub inspector in delhi police",
      "sub inspectors in delhi police",
    ],
  },

  "upsc-coaching": {
    aliases: ["civil services examination", "upsc cse"],
    exclude: [
      "engineering services",
      "medical services",
      "forest service",
      "economic service",
      "statistical service",
    ],
  },

  "ibps-po": {
    aliases: ["ibps po", "crp po", "probationary officers"],
    exclude: ["sbi po"],
  },

  "ibps-clerk": {
    aliases: ["ibps clerk", "crp csa", "customer service associates"],
    allowedSourceKeys: ["ibps"],
    exclude: [
      "document verification",
      "biometric verification",
      "language proficiency test",
      "provisionally selected",
      "reserve list",
      "joining",
      "onboarding",
    ],
  },

  "sbi-po": {
    aliases: [
      "sbi po",
      "sbi probationary officer",
      "sbi probationary officers",
    ],
  },

  "sbi-clerk": {
    aliases: ["sbi clerk", "sbi junior associates"],
  },

  "rbi-grade-b": {
    aliases: ["rbi grade b", "grade b dr", "officers in grade b"],
  },

  cat: {
    aliases: ["common admission test", "cat 2026", "cat 2027"],
    exclude: ["mock cat"],
  },
};

/**
 * Normalize text for consistent matching.
 *
 * Example:
 * "JEE (Main) - 2027"
 * becomes:
 * " jee main 2027 "
 */
function normalize(value: string): string {
  return ` ${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/**
 * Match a complete phrase rather than a partial word.
 */
function containsPhrase(normalizedText: string, phrase: string): boolean {
  return normalizedText.includes(normalize(phrase));
}

/**
 * Extract examination year when exactly one year
 * is present in the notice title.
 *
 * Multiple years are treated as ambiguous.
 */
function getExamYear(title: string): number | null {
  const matches = title.match(/\b20\d{2}\b/g);

  if (!matches) {
    return null;
  }

  const years = [...new Set(matches.map(Number))].filter(
    (year) => year >= 2020 && year <= 2100,
  );

  if (years.length !== 1) {
    return null;
  }

  return years[0];
}

/**
 * Match official notices to a specific course slug.
 *
 * This function:
 * - Does not fetch external websites
 * - Does not write to MongoDB
 * - Does not publish examination dates
 * - Does not modify the Exam Updates feed
 *
 * Every result requires verification.
 */
export function matchCourseExamUpdates(
  courseSlug: string,
  updates: ExamUpdate[],
): CourseExamNoticeMatch[] {
  const rule = EXAM_RULES[courseSlug];

  if (!rule) {
    return [];
  }

  const matches: CourseExamNoticeMatch[] = [];

  for (const update of updates) {
    const normalizedTitle = normalize(update.title);
    if (
      rule.allowedSourceKeys &&
      !rule.allowedSourceKeys.includes(update.sourceKey)
    ) {
      continue;
    }
    // Exclude notices for unrelated examinations.
    const isExcluded = (rule.exclude ?? []).some((phrase) =>
      containsPhrase(normalizedTitle, phrase),
    );

    if (isExcluded) {
      continue;
    }

    // Require an examination-specific phrase.
    const isMatched = rule.aliases.some((phrase) =>
      containsPhrase(normalizedTitle, phrase),
    );

    if (!isMatched) {
      continue;
    }

    matches.push({
      update,
      courseSlug,
      examYear: getExamYear(update.title),
      eventType: update.type,
      confidence: "candidate",
      requiresReview: true,
    });
  }

  return matches;
}
