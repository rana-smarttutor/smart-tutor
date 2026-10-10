"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

type Stage =
  | "class-6-8"
  | "class-9-10"
  | "class-11-12"
  | "college"
  | "graduate"
  | "working";

type FilledBy = "staff" | "counsellor";

type WizardData = {
  filledBy: FilledBy;
  completedByName: string;

  stage: Stage | "";
  studentName: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email: string;
  city: string;
  language: string;

  guardianName: string;
  guardianRelation: string;
  guardianMobile: string;
  guardianConsent: boolean;

  privacyAccepted: boolean;
  whatsappConsent: boolean;
  aiConsent: boolean;

  currentClass: string;
  board: string;
  institution: string;
  recentScore: string;
  class10Score: string;
  class12Score: string;
  degree: string;
  currentStream: string;
  tuition: string;

  strongSubjects: string[];
  weakSubjects: string[];
  entranceExams: string[];

  interestAreas: string[];
  careerGoal: string;
  preferredStream: string;
  learningStyle: string;
  hobbies: string;
  parentExpectations: string;
  constraints: string;

  sleepHours: string;
  schoolHours: string;
  selfStudyHours: string;
  tuitionHours: string;
  screenHours: string;
  physicalHours: string;
  focusMinutes: string;
  wakeTime: string;
  bedtime: string;
  biggestObstacle: string;
  preferredStudyTime: string;
};

type WizardDraft = {
  version: 1;
  step: number;
  data: WizardData;
};

const DRAFT_KEY = "smartiq-career-counselling-session-draft-v1";

const EMPTY: WizardData = {
  filledBy: "counsellor",
  completedByName: "",

  stage: "",
  studentName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  email: "",
  city: "",
  language: "English",

  guardianName: "",
  guardianRelation: "",
  guardianMobile: "",
  guardianConsent: false,

  privacyAccepted: false,
  whatsappConsent: false,
  aiConsent: false,

  currentClass: "",
  board: "",
  institution: "",
  recentScore: "",
  class10Score: "",
  class12Score: "",
  degree: "",
  currentStream: "",
  tuition: "",

  strongSubjects: [],
  weakSubjects: [],
  entranceExams: [],

  interestAreas: [],
  careerGoal: "",
  preferredStream: "",
  learningStyle: "",
  hobbies: "",
  parentExpectations: "",
  constraints: "",

  sleepHours: "",
  schoolHours: "",
  selfStudyHours: "",
  tuitionHours: "",
  screenHours: "",
  physicalHours: "",
  focusMinutes: "",
  wakeTime: "",
  bedtime: "",
  biggestObstacle: "",
  preferredStudyTime: "",
};

const STAGES: { value: Stage; label: string }[] = [
  { value: "class-6-8", label: "Class 6–8" },
  { value: "class-9-10", label: "Class 9–10" },
  { value: "class-11-12", label: "Class 11–12" },
  { value: "college", label: "College" },
  { value: "graduate", label: "Graduate" },
  { value: "working", label: "Working professional" },
];

const SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Economics",
  "Accountancy",
  "Computer Science",
  "Art",
  "Business Studies",
  "Languages",
];

const INTERESTS = [
  "Technology",
  "Coding",
  "AI",
  "Engineering",
  "Medicine",
  "Research",
  "Business",
  "Finance",
  "Design",
  "Arts",
  "Writing",
  "Law",
  "Government jobs",
  "Defence",
  "Teaching",
  "Sports",
  "Hospitality",
  "Undecided",
];

const EXAMS = [
  "JEE",
  "NEET",
  "CUET",
  "MHT-CET",
  "CLAT",
  "NDA",
  "UPSC",
  "MPSC",
  "SSC",
  "Banking",
  "Railway",
  "CAT",
  "Other",
  "None yet",
];

const STREAMS = [
  "Science - PCM",
  "Science - PCB",
  "Science - PCMB",
  "Commerce",
  "Arts / Humanities",
  "Vocational",
  "Undecided",
  "Not applicable",
];

const STEP_TITLES = [
  "About You",
  "Education",
  "Interests & Goals",
  "Routine & Study Habits",
  "Review & Submit",
];

const INPUT =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function freshData(): WizardData {
  return {
    ...EMPTY,
    strongSubjects: [],
    weakSubjects: [],
    entranceExams: [],
    interestAreas: [],
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}

function readWizardDraft(): WizardDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!isObject(parsed)) return null;
    if (parsed.version !== 1) return null;
    if (!isObject(parsed.data)) return null;

    const previous = parsed.data;
    const data = freshData();

    for (const key of Object.keys(data) as Array<keyof WizardData>) {
      const incoming = previous[key];
      const defaultValue = data[key];

      if (typeof defaultValue === "string" && typeof incoming === "string") {
        Object.assign(data, {
          [key]: incoming.slice(0, 4000),
        });
      } else if (
        typeof defaultValue === "boolean" &&
        typeof incoming === "boolean"
      ) {
        Object.assign(data, {
          [key]: incoming,
        });
      } else if (Array.isArray(defaultValue) && Array.isArray(incoming)) {
        Object.assign(data, {
          [key]: incoming
            .filter((value): value is string => typeof value === "string")
            .slice(0, 30),
        });
      }
    }

    if (!STAGES.some((stage) => stage.value === data.stage)) {
      data.stage = "";
    }

    if (!["staff", "counsellor"].includes(data.filledBy)) {
      data.filledBy = "counsellor";
    }

    const rawStep =
      typeof parsed.step === "number" && Number.isFinite(parsed.step)
        ? parsed.step
        : 1;

    return {
      version: 1,
      step: Math.max(1, Math.min(5, Math.floor(rawStep))),
      data,
    };
  } catch {
    return null;
  }
}

function clearWizardDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be unavailable.
  }
}

function dateAge(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  const dob = new Date(year, month - 1, day);
  const today = new Date();

  if (
    year < 1900 ||
    dob.getFullYear() !== year ||
    dob.getMonth() !== month - 1 ||
    dob.getDate() !== day ||
    dob > today
  ) {
    return null;
  }

  let age = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age--;
  }

  return age;
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required ? " *" : ""}

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={INPUT}
      />
    </label>
  );
}

function Pick({
  label,
  value,
  values,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required ? " *" : ""}

      <select
        className={INPUT}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option</option>

        {values.map((item) => {
          const displayLabels: Record<string, string> = {
            staff: "Staff",
            counsellor: "Counsellor",
          };

          return (
            <option key={item} value={item}>
              {displayLabels[item] ??
                STAGES.find((stage) => stage.value === item)?.label ??
                item}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Chips({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>

      <div className="flex flex-wrap gap-2">
        {values.map((item) => {
          const selectedNow = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              aria-pressed={selectedNow}
              onClick={() =>
                onChange(
                  selectedNow
                    ? selected.filter((value) => value !== item)
                    : [...selected, item],
                )
              }
              className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                selectedNow
                  ? "border-blue-600 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {selectedNow ? "✓ " : "+ "}
              {item}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-[#0B1F4B]">{title}</h2>

      {children}
    </section>
  );
}

function classLevel(data: WizardData): string {
  if (data.stage.startsWith("class-")) {
    return data.currentClass;
  }

  if (data.stage === "college") {
    return "Undergraduate";
  }

  if (data.stage === "graduate") {
    return "Graduate";
  }

  if (data.stage === "working") {
    return "Working Professional";
  }

  return "";
}

/* ==========================================
   MAIN WIZARD
========================================== */

export function CareerCounsellingWizard({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(1);

  const [data, setData] = useState<WizardData>(freshData);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftError, setDraftError] = useState("");

  const submittedRef = useRef(false);

  const age = dateAge(data.dateOfBirth);

  const minor = age !== null && age < 18;

  const stageLabel = STAGES.find((item) => item.value === data.stage)?.label;

  const isSchool = data.stage.startsWith("class-");

  useEffect(() => {
    const draft = readWizardDraft();

    if (draft) {
      setData(draft.data);
      setStep(draft.step);

      setDraftMessage(
        "Previous draft restored. You can continue where you left off.",
      );
    }

    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || submittedRef.current) {
      return;
    }

    const draft: WizardDraft = {
      version: 1,
      step,
      data,
    };

    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftError("");
    } catch {
      setDraftError("Automatic draft saving is unavailable in this browser.");
    }
  }, [data, step, draftReady]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
    setDraftMessage("");
  }

  function startFresh() {
    if (
      !window.confirm("Discard the current counselling draft and start fresh?")
    ) {
      return;
    }

    clearWizardDraft();

    setData(freshData());
    setStep(1);
    setError("");
    setDraftError("");
    setDraftMessage("Fresh counselling form started.");
  }

  function cancelWizard() {
    if (
      !window.confirm(
        "Leave this form? Your progress will remain saved in this browser tab so you can resume later.",
      )
    ) {
      return;
    }

    onCancel();
  }

  function validateStep(number: number): string | null {
    if (number === 1) {
      if (!data.completedByName.trim()) {
        return "Enter the Staff / Counsellor Name.";
      }

      if (!["staff", "counsellor"].includes(data.filledBy)) {
        return "Select who is completing the entry.";
      }

      if (!data.stage) {
        return "Select the student's education stage.";
      }

      if (data.studentName.trim().length < 2) {
        return "Enter the student's full name.";
      }

      if (age === null) {
        return "Enter a valid date of birth.";
      }

      if (!data.gender) {
        return "Select gender.";
      }

      if (data.city.trim().length < 2) {
        return "Enter city or locality.";
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "Enter a valid email address.";
      }

      if (data.mobile && !validMobile(data.mobile)) {
        return "Enter a valid 10-digit student mobile number.";
      }

      if (data.guardianMobile && !validMobile(data.guardianMobile)) {
        return "Enter a valid 10-digit parent/guardian mobile number.";
      }

      if (minor) {
        if (
          !data.guardianName.trim() ||
          !data.guardianRelation ||
          !validMobile(data.guardianMobile)
        ) {
          return "Complete parent/guardian name, relationship and mobile number.";
        }
      }

      if (!validMobile(data.mobile) && !validMobile(data.guardianMobile)) {
        return "Enter at least one valid student or guardian mobile number.";
      }

      if (minor && !data.guardianConsent) {
        return "Record parent or guardian consent before continuing.";
      }
    }

    if (number === 2) {
      if (isSchool && !data.currentClass) {
        return "Select the current class.";
      }

      if (isSchool && !data.institution.trim()) {
        return "Enter the student's school.";
      }

      if (!isSchool && !data.degree.trim()) {
        return "Enter the current or highest qualification.";
      }
    }

    if (
      number === 3 &&
      data.interestAreas.length === 0 &&
      !data.careerGoal.trim()
    ) {
      return "Choose at least one interest or enter a career goal.";
    }

    if (number === 4) {
      const numberFields: Array<[string, string, number]> = [
        ["Sleep hours", data.sleepHours, 24],
        ["School/college hours", data.schoolHours, 24],
        ["Self-study hours", data.selfStudyHours, 24],
        ["Tuition hours", data.tuitionHours, 24],
        ["Screen hours", data.screenHours, 24],
        ["Physical activity hours", data.physicalHours, 24],
        ["Focus minutes", data.focusMinutes, 600],
      ];

      for (const [label, value, max] of numberFields) {
        if (
          value &&
          (!Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > max)
        ) {
          return `${label} must be between 0 and ${max}.`;
        }
      }
    }

    if (number === 5 && !data.privacyAccepted) {
      return "Record acceptance of the Privacy Policy before submission.";
    }

    return null;
  }

  function goNext() {
    const issue = validateStep(step);

    if (issue) {
      setError(issue);
      return;
    }

    setError("");
    setStep((value) => Math.min(5, value + 1));
  }

  function classChoices(): string[] {
    if (data.stage === "class-6-8") {
      return ["Class 6", "Class 7", "Class 8"];
    }

    if (data.stage === "class-9-10") {
      return ["Class 9", "Class 10"];
    }

    return ["Class 11", "Class 12"];
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (step < 5) {
      goNext();
      return;
    }

    for (let number = 1; number <= 5; number++) {
      const issue = validateStep(number);

      if (issue) {
        setStep(number);
        setError(issue);
        return;
      }
    }

    const parentPhone = data.guardianMobile || data.mobile;

    const questionnaire = {
      version: 1,

      aboutYou: {
        filledBy: data.filledBy,
        completedByName: data.completedByName.trim(),

        educationStage: data.stage,
        studentName: data.studentName.trim(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        mobile: data.mobile,
        email: data.email.trim(),
        city: data.city.trim(),
        language: data.language,

        guardianName: data.guardianName.trim(),
        guardianRelation: data.guardianRelation,
        guardianMobile: data.guardianMobile,
        guardianConsent: data.guardianConsent,

        privacyAccepted: data.privacyAccepted,
        sendReportOnWhatsApp: data.whatsappConsent,
      },

      education: {
        currentClass: data.currentClass,
        board: data.board,
        institution: data.institution,
        recentScore: data.recentScore,
        class10Score: data.class10Score,
        class12Score: data.class12Score,
        degree: data.degree,
        currentStream: data.currentStream,
        tuition: data.tuition,
        strongSubjects: data.strongSubjects,
        weakSubjects: data.weakSubjects,
        entranceExams: data.entranceExams,
      },

      interests: {
        areas: data.interestAreas,
        careerGoal: data.careerGoal,
        preferredStream: data.preferredStream,
        learningStyle: data.learningStyle,
        hobbies: data.hobbies,
        parentExpectations: data.parentExpectations,
        constraints: data.constraints,
      },

      routine: {
        sleepHours: data.sleepHours,
        schoolHours: data.schoolHours,
        selfStudyHours: data.selfStudyHours,
        tuitionHours: data.tuitionHours,
        screenHours: data.screenHours,
        physicalHours: data.physicalHours,
        focusMinutes: data.focusMinutes,
        wakeTime: data.wakeTime,
        bedtime: data.bedtime,
        biggestObstacle: data.biggestObstacle,
        preferredStudyTime: data.preferredStudyTime,
      },

      consent: {
        aiConsent: data.aiConsent,
        whatsappConsent: data.whatsappConsent,
      },
    };

    const payload = {
      studentName: data.studentName.trim(),
      dateOfBirth: data.dateOfBirth,
      studentPhone: data.mobile,
      parentName: data.guardianName.trim(),
      parentWhatsapp: parentPhone,
      email: data.email.trim(),
      city: data.city.trim(),
      classLevel: classLevel(data),
      board: data.board,
      school: data.institution,
      academicPercentage: data.recentScore,

      strongSubjects: data.strongSubjects,
      weakSubjects: data.weakSubjects,
      interests: data.interestAreas,

      careerGoal: data.careerGoal.trim(),
      preferredStream: data.preferredStream || data.currentStream,
      preferredLearningStyle: data.learningStyle,
      examInterests: data.entranceExams,

      parentExpectations: data.parentExpectations,
      challenges: data.biggestObstacle,
      counsellorNotes: "",
      recommendedPrograms: [],
      followUpDate: "",
      status: "new",

      aiConsent: data.aiConsent,
      whatsappConsent: data.whatsappConsent,

      questionnaire,
    };

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/career-counselling", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.record?.id) {
        throw new Error(result?.error || "Unable to save counselling entry.");
      }

      submittedRef.current = true;

      clearWizardDraft();

      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save counselling entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* SIDEBAR */}

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
          Career Counselling
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#0B1F4B]">
          New entry
        </h2>

        <button
          type="button"
          onClick={startFresh}
          disabled={!draftReady || saving}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Start Fresh
        </button>

        <p className="mb-5 mt-4 text-sm text-slate-500">
          {stageLabel || "Select education stage"}
        </p>

        <ol className="space-y-3">
          {STEP_TITLES.map((label, index) => {
            const number = index + 1;

            return (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-lg p-2 text-sm ${
                  number === step
                    ? "bg-blue-50 font-bold text-blue-900"
                    : "text-slate-600"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                    number <= step
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {number}
                </span>

                {label}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="flex items-center gap-2 text-xs font-bold text-blue-800">
            <Clock3 size={15} />
            Temporary draft
          </p>

          <p className="mt-2 text-xs leading-5 text-blue-700">
            Changes are automatically saved in this browser tab.
          </p>
        </div>
      </aside>

      {/* MAIN FORM */}

      <form
        onSubmit={(event) => void submit(event)}
        className="min-w-0 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0B1F4B] p-5 text-white">
          <div>
            <p className="text-xs font-semibold text-blue-200">
              New counselling entry · Step {step} of 5
            </p>

            <h1 className="mt-1 text-xl font-extrabold">
              {STEP_TITLES[step - 1]}
            </h1>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={cancelWizard}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm disabled:opacity-50"
          >
            <X size={16} />
            Close
          </button>
        </div>

        {draftMessage && (
          <p
            role="status"
            className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800"
          >
            {draftMessage}
          </p>
        )}

        {draftError && (
          <p
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            {draftError}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        {/* STEP 1 */}

        {step === 1 && (
          <>
            <Block title="Student information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Pick
                  label="Who is completing this entry?"
                  required
                  value={data.filledBy}
                  values={["staff", "counsellor" , "Admin", "branch manager"]}
                  onChange={(value) => update("filledBy", value as FilledBy)}
                />

                <InputField
                  label="Staff / Counsellor Name"
                  required
                  placeholder="Enter full name"
                  value={data.completedByName}
                  onChange={(value) => update("completedByName", value)}
                />

                <Pick
                  label="Education stage"
                  required
                  value={data.stage}
                  values={STAGES.map((item) => item.value)}
                  onChange={(value) =>
                    setData((previous) => ({
                      ...previous,
                      stage: value as Stage,
                      currentClass: "",
                    }))
                  }
                />

                <InputField
                  label="Student full name"
                  required
                  value={data.studentName}
                  onChange={(value) => update("studentName", value)}
                />

                <InputField
                  label="Date of birth"
                  required
                  type="date"
                  value={data.dateOfBirth}
                  onChange={(value) => update("dateOfBirth", value)}
                />

                <Pick
                  label="Gender"
                  required
                  value={data.gender}
                  values={["Male", "Female", "Other", "Prefer not to say"]}
                  onChange={(value) => update("gender", value)}
                />

                <InputField
                  label="Student mobile (if available)"
                  value={data.mobile}
                  placeholder="10 digits"
                  onChange={(value) =>
                    update("mobile", value.replace(/\D/g, "").slice(0, 10))
                  }
                />

                <InputField
                  label="Email (optional)"
                  type="email"
                  value={data.email}
                  onChange={(value) => update("email", value)}
                />

                <InputField
                  label="City or locality"
                  required
                  value={data.city}
                  onChange={(value) => update("city", value)}
                />

                <Pick
                  label="Counselling language"
                  value={data.language}
                  values={["English", "Hindi", "Marathi"]}
                  onChange={(value) => update("language", value)}
                />
              </div>

              {age !== null && (
                <p className="text-sm text-slate-500">
                  Student age: {age} years
                </p>
              )}
            </Block>

            <Block
              title={`Parent or guardian ${
                minor ? "(required)" : "(optional)"
              }`}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <InputField
                  label="Parent / guardian name"
                  value={data.guardianName}
                  onChange={(value) => update("guardianName", value)}
                />

                <Pick
                  label="Relationship"
                  value={data.guardianRelation}
                  values={["Mother", "Father", "Guardian"]}
                  onChange={(value) => update("guardianRelation", value)}
                />

                <InputField
                  label="Parent / guardian mobile"
                  value={data.guardianMobile}
                  onChange={(value) =>
                    update(
                      "guardianMobile",
                      value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                />
              </div>

              {minor && (
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={data.guardianConsent}
                    onChange={(event) =>
                      update("guardianConsent", event.target.checked)
                    }
                  />
                  I confirm that parent/guardian consent was obtained for
                  collecting this minor&apos;s counselling information.
                </label>
              )}
            </Block>
          </>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <>
            <Block title="Academic information">
              <div className="grid gap-4 sm:grid-cols-2">
                {isSchool && (
                  <Pick
                    label="Current class"
                    required
                    value={data.currentClass}
                    values={
                      data.stage === "class-6-8"
                        ? ["Class 6", "Class 7", "Class 8"]
                        : data.stage === "class-9-10"
                          ? ["Class 9", "Class 10"]
                          : ["Class 11", "Class 12"]
                    }
                    onChange={(value) => update("currentClass", value)}
                  />
                )}

                <Pick
                  label="Education board"
                  value={data.board}
                  values={[
                    "Maharashtra State Board",
                    "CBSE",
                    "ICSE / ISC",
                    "Cambridge",
                    "IB",
                    "University",
                    "Other",
                  ]}
                  onChange={(value) => update("board", value)}
                />

                <InputField
                  label={
                    isSchool ? "School name" : "College / institution name"
                  }
                  required={isSchool}
                  value={data.institution}
                  onChange={(value) => update("institution", value)}
                />

                <InputField
                  label="Most recent percentage / CGPA"
                  value={data.recentScore}
                  placeholder="e.g. 85% or 8.2 CGPA"
                  onChange={(value) => update("recentScore", value)}
                />

                {!isSchool && (
                  <>
                    <InputField
                      label="Highest/current qualification"
                      required
                      value={data.degree}
                      onChange={(value) => update("degree", value)}
                    />

                    <InputField
                      label="Class 10 percentage"
                      value={data.class10Score}
                      onChange={(value) => update("class10Score", value)}
                    />

                    <InputField
                      label="Class 12 percentage"
                      value={data.class12Score}
                      onChange={(value) => update("class12Score", value)}
                    />
                  </>
                )}

                {data.stage === "class-11-12" && (
                  <InputField
                    label="Class 10 percentage"
                    value={data.class10Score}
                    onChange={(value) => update("class10Score", value)}
                  />
                )}

                {(data.stage === "class-11-12" || !isSchool) && (
                  <Pick
                    label="Current / previous stream"
                    value={data.currentStream}
                    values={STREAMS}
                    onChange={(value) => update("currentStream", value)}
                  />
                )}

                {data.stage === "class-6-8" && (
                  <Pick
                    label="Attends tuition?"
                    value={data.tuition}
                    values={["Yes", "No"]}
                    onChange={(value) => update("tuition", value)}
                  />
                )}
              </div>
            </Block>

            <Block title="Academic strengths and exams">
              <Chips
                label="Strong subjects"
                values={SUBJECTS}
                selected={data.strongSubjects}
                onChange={(values) => update("strongSubjects", values)}
              />

              <Chips
                label="Subjects needing support"
                values={SUBJECTS}
                selected={data.weakSubjects}
                onChange={(values) => update("weakSubjects", values)}
              />

              <Chips
                label="Entrance / competitive exams of interest"
                values={EXAMS}
                selected={data.entranceExams}
                onChange={(values) => update("entranceExams", values)}
              />
            </Block>
          </>
        )}

        {/* STEP 3 */}

        {step === 3 && (
          <Block title="Interests and career direction">
            <Chips
              label="What does the student enjoy?"
              values={INTERESTS}
              selected={data.interestAreas}
              onChange={(values) => update("interestAreas", values)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Career goal (optional if exploring)"
                value={data.careerGoal}
                onChange={(value) => update("careerGoal", value)}
              />

              <Pick
                label="Preferred stream"
                value={data.preferredStream}
                values={STREAMS}
                onChange={(value) => update("preferredStream", value)}
              />

              <Pick
                label="Preferred learning style"
                value={data.learningStyle}
                values={[
                  "Practical / hands-on",
                  "Theory / reading",
                  "Visual",
                  "Projects",
                  "Interactive",
                  "Mixed",
                  "Not sure",
                ]}
                onChange={(value) => update("learningStyle", value)}
              />

              <InputField
                label="Hobbies / extracurricular interests"
                value={data.hobbies}
                onChange={(value) => update("hobbies", value)}
              />
            </div>

            <InputField
              label="Parent / guardian expectations"
              value={data.parentExpectations}
              onChange={(value) => update("parentExpectations", value)}
            />

            <InputField
              label="Practical constraints (budget, location, travel, etc.)"
              value={data.constraints}
              onChange={(value) => update("constraints", value)}
            />
          </Block>
        )}

        {/* STEP 4 */}

        {step === 4 && (
          <Block title="Typical daily routine">
            <p className="text-sm text-slate-500">
              Approximate daily hours. Leave a field blank if unknown.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {(
                [
                  ["sleepHours", "Sleep (hours)"],
                  ["schoolHours", "School / college (hours)"],
                  ["selfStudyHours", "Self-study (hours)"],
                  ["tuitionHours", "Tuition (hours)"],
                  ["screenHours", "Recreational screen time (hours)"],
                  ["physicalHours", "Exercise / outdoor play (hours)"],
                ] as const
              ).map(([key, label]) => (
                <InputField
                  key={key}
                  label={label}
                  type="number"
                  value={data[key]}
                  onChange={(value) => update(key, value)}
                />
              ))}

              <InputField
                label="Wake-up time"
                type="time"
                value={data.wakeTime}
                onChange={(value) => update("wakeTime", value)}
              />

              <InputField
                label="Bedtime"
                type="time"
                value={data.bedtime}
                onChange={(value) => update("bedtime", value)}
              />

              <InputField
                label="Focused sitting capacity (minutes)"
                type="number"
                value={data.focusMinutes}
                onChange={(value) => update("focusMinutes", value)}
              />

              <Pick
                label="Best study time"
                value={data.preferredStudyTime}
                values={[
                  "Morning",
                  "Afternoon",
                  "Evening",
                  "Late night",
                  "Not sure",
                ]}
                onChange={(value) => update("preferredStudyTime", value)}
              />
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Biggest challenge with studying
              <textarea
                rows={3}
                className={INPUT}
                value={data.biggestObstacle}
                onChange={(event) =>
                  update("biggestObstacle", event.target.value)
                }
                placeholder="e.g. focus, procrastination, time management"
              />
            </label>
          </Block>
        )}

        {/* STEP 5 */}

        {step === 5 && (
          <>
            <Block title="Review student details">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Entry completed by", data.completedByName],
                  [
                    "Staff role",
                    data.filledBy === "staff" ? "Staff" : "Counsellor",
                  ],
                  ["Student", data.studentName],
                  ["Stage", stageLabel || "Not selected"],
                  ["Class/level", classLevel(data)],
                  ["City", data.city],
                  ["Contact", data.mobile || data.guardianMobile],
                  ["Parent/guardian", data.guardianName || "Not provided"],
                  ["Institution", data.institution || "Not provided"],
                  ["Academic score", data.recentScore || "Not provided"],
                  ["Career goal", data.careerGoal || "Exploring options"],
                  [
                    "Interests",
                    data.interestAreas.join(", ") || "Not selected",
                  ],
                  [
                    "Strong subjects",
                    data.strongSubjects.join(", ") || "Not selected",
                  ],
                  [
                    "Entrance exams",
                    data.entranceExams.join(", ") || "Not selected",
                  ],
                  ["Self-study hours", data.selfStudyHours || "Not specified"],
                  ["Study challenge", data.biggestObstacle || "Not specified"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <dt className="font-semibold text-slate-500">{label}</dt>

                    <dd className="mt-1 break-words font-medium text-slate-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="text-xs text-slate-500">
                Use Back to correct any section. The full answers will be stored
                with this counselling entry.
              </p>
            </Block>

            <Block title="Consent and submission">
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={data.privacyAccepted}
                  onChange={(event) =>
                    update("privacyAccepted", event.target.checked)
                  }
                  className="mt-1"
                />

                <span>
                  The applicant (and parent/guardian where required) has
                  reviewed and accepted the institute&apos;s Privacy Policy for
                  recording this counselling enquiry. *
                </span>
              </label>

              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={data.aiConsent}
                  onChange={(event) =>
                    update("aiConsent", event.target.checked)
                  }
                  className="mt-1"
                />

                <span>
                  Consent was given for AI-assisted career guidance. Optional;
                  this is not consent to publish data.
                </span>
              </label>

              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={data.whatsappConsent}
                  onChange={(event) =>
                    update("whatsappConsent", event.target.checked)
                  }
                  className="mt-1"
                />

                <span>
                  Consent was given to send an approved report by WhatsApp.
                  Optional.
                </span>
              </label>

              <p className="text-xs text-slate-500">
                This creates an enquiry, not an approved career recommendation.
                AI guidance and sharing still require counsellor review.
              </p>
            </Block>
          </>
        )}

        {/* FORM NAVIGATION */}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            onClick={() => {
              if (step === 1) {
                cancelWizard();
              } else {
                setError("");
                setStep((value) => value - 1);
              }
            }}
          >
            <ArrowLeft size={16} />
            {step === 1 ? "Close" : "Back"}
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={!draftReady || saving}
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draftReady || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B40A1] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}

              {saving ? "Saving..." : "Save Counselling Enquiry"}
            </button>
          )}
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 size={14} />
          Your form is temporarily saved in this browser tab. It is not
          submitted to MongoDB until you click Save.
        </p>
      </form>
    </div>
  );
}
