
export const CAREER_COUNSELLING_DRAFT_KEY =
  "smartiq-career-counselling-draft-v1";

export type FormFiller =
  | "student"
  | "parent"
  | "counsellor";

export type EducationStage =
  | "class-6-8"
  | "class-9-10"
  | "class-11-12"
  | "college"
  | "graduate"
  | "working";

export type Gender =
  | ""
  | "Male"
  | "Female"
  | "Other";

export type SessionLanguage =
  | "English"
  | "Hindi"
  | "Marathi";

export type GuardianRelation =
  | ""
  | "Father"
  | "Mother"
  | "Guardian";

export type AboutYouDetails = {
  filledBy: FormFiller;
  educationStage: EducationStage | "";
  studentName: string;
  dateOfBirth: string;
  gender: Gender;
  mobile: string;
  sendReportOnWhatsApp: boolean;
  email: string;
  city: string;
  language: SessionLanguage;
  guardianName: string;
  guardianRelation: GuardianRelation;
  guardianMobile: string;
  guardianConsent: boolean;
  privacyAccepted: boolean;
};

export type AdditionalQualification = {
  qualification: string;
  institution: string;
  year: string;
};

export type AttemptedExam = {
  exam: string;
  year: string;
  stage: string;
  scoreOrRank: string;
};

export type EducationDetails = {
  presentClass: string;
  board: string;
  schoolName: string;
  lastExamPercentage: string;
  attendsTuition: "" | "yes" | "no";
  favouriteSubjects: string[];
  difficultSubjects: string[];
  activities: string[];
  consideredStream: string;
  streamInfluence: string;

  class10Board: string;
  class10Year: string;
  class10Percentage: string;

  currentClass: string;
  currentStream: string;
  currentExamPercentage: string;
  entranceExams: string[];

  class12Stream: string;
  class12Board: string;
  class12Year: string;
  class12Percentage: string;

  degree: string;
  mainSubject: string;
  university: string;
  graduationStatus: string;
  graduationScore: string;

  additionalQualifications:
    AdditionalQualification[];

  attemptedExams: AttemptedExam[];
};

export type CounsellingDraft = {
  version: 1;
  aboutYou: AboutYouDetails;
  education?: EducationDetails;
  interests?: unknown;
  routine?: unknown;
  updatedAt: string;
};

export const EMPTY_ABOUT_YOU: AboutYouDetails = {
  filledBy: "student",
  educationStage: "",
  studentName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  sendReportOnWhatsApp: false,
  email: "",
  city: "",
  language: "English",
  guardianName: "",
  guardianRelation: "",
  guardianMobile: "",
  guardianConsent: false,
  privacyAccepted: false,
};

export const EMPTY_EDUCATION: EducationDetails = {
  presentClass: "",
  board: "",
  schoolName: "",
  lastExamPercentage: "",
  attendsTuition: "",
  favouriteSubjects: [],
  difficultSubjects: [],
  activities: [],
  consideredStream: "",
  streamInfluence: "",

  class10Board: "",
  class10Year: "",
  class10Percentage: "",

  currentClass: "",
  currentStream: "",
  currentExamPercentage: "",
  entranceExams: [],

  class12Stream: "",
  class12Board: "",
  class12Year: "",
  class12Percentage: "",

  degree: "",
  mainSubject: "",
  university: "",
  graduationStatus: "",
  graduationScore: "",

  additionalQualifications: [],
  attemptedExams: [],
};

export function getStudentAge(
  value: string,
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  if (year < 1900) {
    return null;
  }

  const dob = new Date(
    year,
    month - 1,
    day,
  );

  if (
    Number.isNaN(dob.getTime()) ||
    dob.getFullYear() !== year ||
    dob.getMonth() !== month - 1 ||
    dob.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();

  if (dob > today) {
    return null;
  }

  let age = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (
      today.getMonth() === month - 1 &&
      today.getDate() < day
    )
  ) {
    age -= 1;
  }

  return age;
}

const EDUCATION_STRING_FIELDS = [
  "presentClass",
  "board",
  "schoolName",
  "lastExamPercentage",
  "consideredStream",
  "streamInfluence",
  "class10Board",
  "class10Year",
  "class10Percentage",
  "currentClass",
  "currentStream",
  "currentExamPercentage",
  "class12Stream",
  "class12Board",
  "class12Year",
  "class12Percentage",
  "degree",
  "mainSubject",
  "university",
  "graduationStatus",
  "graduationScore",
] as const;

function recordFrom(
  value: unknown,
): Record<string, unknown> {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value as Record<string, unknown>
    : {};
}

function readString(
  value: unknown,
  max = 180,
): string {
  return typeof value === "string"
    ? value.slice(0, max)
    : "";
}

function readStrings(
  value: unknown,
): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) =>
          item.slice(0, 100),
        )
        .slice(0, 20)
    : [];
}

export function normalizeEducationDetails(
  input: unknown,
): EducationDetails {
  const value = recordFrom(input);

  const result: EducationDetails = {
    ...EMPTY_EDUCATION,

    favouriteSubjects: readStrings(
      value.favouriteSubjects,
    ),

    difficultSubjects: readStrings(
      value.difficultSubjects,
    ),

    activities: readStrings(
      value.activities,
    ),

    entranceExams: readStrings(
      value.entranceExams,
    ),

    additionalQualifications:
      Array.isArray(
        value.additionalQualifications,
      )
        ? value.additionalQualifications
            .slice(0, 5)
            .map((entry) => {
              const item = recordFrom(entry);

              return {
                qualification: readString(
                  item.qualification,
                ),
                institution: readString(
                  item.institution,
                ),
                year: readString(
                  item.year,
                  8,
                ),
              };
            })
        : [],

    attemptedExams:
      Array.isArray(value.attemptedExams)
        ? value.attemptedExams
            .slice(0, 5)
            .map((entry) => {
              const item = recordFrom(entry);

              return {
                exam: readString(item.exam),
                year: readString(item.year, 8),
                stage: readString(item.stage),
                scoreOrRank: readString(
                  item.scoreOrRank,
                ),
              };
            })
        : [],

    attendsTuition:
      value.attendsTuition === "yes" ||
      value.attendsTuition === "no"
        ? value.attendsTuition
        : "",
  };

  for (const field of EDUCATION_STRING_FIELDS) {
    result[field] = readString(value[field]);
  }

  return result;
}

export function readCounsellingDraft():
  CounsellingDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(
      CAREER_COUNSELLING_DRAFT_KEY,
    );

    if (!raw) {
      return null;
    }

    const value = recordFrom(
      JSON.parse(raw) as unknown,
    );

    if (
      value.version !== 1 ||
      !value.aboutYou ||
      Array.isArray(value.aboutYou)
    ) {
      return null;
    }

    const about = recordFrom(
      value.aboutYou,
    );

    return {
      version: 1,

      aboutYou: {
        ...EMPTY_ABOUT_YOU,
        ...about,
      } as AboutYouDetails,

      ...(value.education
        ? {
            education:
              normalizeEducationDetails(
                value.education,
              ),
          }
        : {}),

      ...(value.interests !== undefined
        ? { interests: value.interests }
        : {}),

      ...(value.routine !== undefined
        ? { routine: value.routine }
        : {}),

      updatedAt: readString(
        value.updatedAt,
        60,
      ),
    };
  } catch {
    return null;
  }
}

export function saveAboutYouDraft(
  aboutYou: AboutYouDetails,
): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Browser storage is unavailable.",
    );
  }

  const existing = readCounsellingDraft();

  const stageChanged =
    existing?.aboutYou.educationStage !==
    aboutYou.educationStage;

  const next: CounsellingDraft = {
    version: 1,
    aboutYou,

    ...(!stageChanged && existing
      ? {
          education: existing.education,
          interests: existing.interests,
          routine: existing.routine,
        }
      : {}),

    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    CAREER_COUNSELLING_DRAFT_KEY,
    JSON.stringify(next),
  );
}

export function saveEducationDraft(
  education: EducationDetails,
): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Browser storage is unavailable.",
    );
  }

  const existing = readCounsellingDraft();

  if (!existing?.aboutYou.educationStage) {
    throw new Error(
      "Complete the About You step first.",
    );
  }

  const next: CounsellingDraft = {
    ...existing,

    education:
      normalizeEducationDetails(education),

    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    CAREER_COUNSELLING_DRAFT_KEY,
    JSON.stringify(next),
  );
}
