"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  PenLine,
  Plus,
  Save,
  UserRound,
} from "lucide-react";

type Academic = {
  level: string;
  institution: string;
  board: string;
  year: string;
  marks: string;
};

type Achievement = {
  year: string;
  exam: string;
  level: string;
  score: string;
};

type FileKey = "photo" | "signatureImage" | "photoId" | "marksheet";

type Admission = {
  course: string;
  exam: string;
  programme: string;
  session: string;
  studyMode: string;
  medium: string;
  batchTime: string;
  heardFrom: string;
  name: string;
  day: string;
  month: string;
  year: string;
  gender: string;
  category: string;
  pwd: boolean;
  mobile: string;
  email: string;
  whatsappSame: boolean;
  flat: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  qualification: string;
  otherQualification: string;
  currentStatus: string;
  academics: Academic[];
  achievements: Achievement[];
  fatherName: string;
  fatherOccupation: string;
  fatherMobile: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherMobile: string;
  motherEmail: string;
  contactPreference: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyMobile: string;
  declarationCorrect: boolean;
  declarationTerms: boolean;
  declarationContact: boolean;
  signature: string;
};

const examGroups: Record<string, string[]> = {
  Schooling: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ],
  UPSC: ["UPSC CSE", "UPSC CAPF", "UPSC EPFO", "Other UPSC Exam"],
  SSC: [
    "SSC CGL",
    "SSC CHSL",
    "SSC MTS",
    "SSC GD Constable",
    "SSC CPO",
    "SSC JE",
    "Other SSC Exam",
  ],
  Banking: [
    "IBPS PO",
    "IBPS Clerk",
    "IBPS RRB",
    "SBI PO",
    "SBI Clerk",
    "RBI Grade B",
    "NABARD",
    "Other Banking Exam",
  ],
  Railway: [
    "RRB NTPC",
    "RRB Group D",
    "RRB ALP",
    "RRB Technician",
    "RRB JE",
    "RPF",
    "Other Railway Exam",
  ],
  Law: ["CLAT", "AILET", "MAH LLB CET (3 Years)", "MAH LLB CET (5 Years)"],
  MBA: ["CAT", "MAH MBA CET", "CMAT", "XAT", "SNAP", "NMAT", "MAT", "ATMA"],
  "Board Exams": [
    "Class 10 SSC",
    "Class 10 CBSE",
    "Class 12 HSC",
    "Class 12 CBSE",
  ],
  Engineering: [
    "JEE Main",
    "JEE Advanced",
    "MHT-CET",
    "BITSAT",
    "VITEEE",
    "NATA",
  ],
  Medical: [
    "NEET UG",
    "NEET Foundation",
    "Nursing Entrance",
    "Paramedical Entrance",
  ],
  Defence: ["NDA", "CDS", "AFCAT", "Agniveer", "IMU-CET"],
  Commerce: [
    "CA Foundation",
    "CA Intermediate",
    "CSEET",
    "CS Executive",
    "CMA Foundation",
    "CMA Intermediate",
  ],
  Other: [
    "CUET UG",
    "CUET PG",
    "NIFT",
    "NID DAT",
    "UCEED",
    "NIMCET",
    "Hotel Management Entrance",
    "Other Entrance Exam",
  ],
};

const topGroups = [
  "Schooling",
  "UPSC",
  "SSC",
  "Banking",
  "Railway",
  "Law",
  "MBA",
];

const steps = [
  "Course",
  "Student details",
  "Education",
  "Parents and emergency contact",
  "Review and submit",
];

const PROGRAMMES = [
  "Regular batch",
  "Weekend batch",
  "Crash course",
  "Test series only",
];

const QUALIFICATIONS = [
  "Class 10",
  "Class 12",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Other",
];

const STATES = [
  "Maharashtra",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Goa",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Rajasthan",
  "Telangana",
  "Tamil Nadu",
  "Kerala",
  "Other",
];

const STORAGE_KEY = "smartiq-admission-draft-v1";

const inputClass =
  "h-10 w-full min-w-0 rounded border border-[#c7d2e6] bg-white px-3 text-xs text-[#14244a] outline-none focus:border-[#2458ef] focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-[11px] font-bold text-[#132c62]";

const emptyAcademic = (): Academic => ({
  level: "",
  institution: "",
  board: "",
  year: "",
  marks: "",
});

const emptyAchievement = (): Achievement => ({
  year: "",
  exam: "",
  level: "",
  score: "",
});

function previousClass(selected: string): string {
  const match = /^Class (\d+)$/.exec(selected);

  if (!match) return "";

  const n = Number(match[1]);

  return n >= 2 && n <= 12 ? `Class ${n - 1}` : "";
}

function qualificationLevels(value: string): string[] {
  switch (value) {
    case "Class 10":
      return ["Class 10"];

    case "Class 12":
      return ["Class 10", "Class 12"];

    case "Undergraduate":
    case "Graduate":
      return ["Class 10", "Class 12", "Graduation"];

    case "Postgraduate":
      return ["Class 10", "Class 12", "Graduation", "Postgraduation"];

    case "Other":
      return ["Other qualification"];

    default:
      return [];
  }
}

const standardLevels = [
  "Class 10",
  "Class 12",
  "Graduation",
  "Postgraduation",
  "Other qualification",
];

function academicsForQualification(
  qualification: string,
  existing: Academic[] = [],
): Academic[] {
  const levels = qualificationLevels(qualification);

  if (!levels.length) return [];

  const required = levels.map((level) => ({
    ...emptyAcademic(),
    ...existing.find((r) => r.level === level),
    level,
  }));

  const extras = existing.filter(
    (r) =>
      !standardLevels.includes(r.level) &&
      Object.values(r).some((value) => value.trim().length > 0),
  );

  return [...required, ...extras].slice(0, 8);
}

const initial: Admission = {
  course: "",
  exam: "",
  programme: "",
  session: "2026-27",
  studyMode: "",
  medium: "",
  batchTime: "",
  heardFrom: "",
  name: "",
  day: "",
  month: "",
  year: "",
  gender: "",
  category: "General",
  pwd: false,
  mobile: "",
  email: "",
  whatsappSame: true,
  flat: "",
  street: "",
  city: "",
  state: "Maharashtra",
  pin: "",
  qualification: "",
  otherQualification: "",
  currentStatus: "",
  academics: [],
  achievements: [emptyAchievement()],
  fatherName: "",
  fatherOccupation: "",
  fatherMobile: "",
  fatherEmail: "",
  motherName: "",
  motherOccupation: "",
  motherMobile: "",
  motherEmail: "",
  contactPreference: "Father",
  emergencyName: "",
  emergencyRelation: "",
  emergencyMobile: "",
  declarationCorrect: false,
  declarationTerms: false,
  declarationContact: false,
  signature: "",
};

function Field({
  title,
  value,
  onChange,
  required = false,
  placeholder = "",
  type = "text",
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>
        {title}
        {required && <span className="text-red-600"> *</span>}
      </span>

      <input
        type={type}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function SelectField({
  title,
  value,
  onChange,
  options,
  required = false,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>
        {title}
        {required && <span className="text-red-600"> *</span>}
      </span>

      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Select an option</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Choices({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <label
          key={value}
          className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-[11px] ${
            selected === value
              ? "border-blue-600 bg-blue-50 font-bold"
              : "border-slate-300 bg-white"
          }`}
        >
          <input
            type="radio"
            className="accent-[#2458ef]"
            checked={selected === value}
            onChange={() => onSelect(value)}
          />
          {value}
        </label>
      ))}
    </div>
  );
}

function Detail({ title, value }: { title: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500">{title}</p>
      <p className="break-words text-xs font-semibold">{value || "—"}</p>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded border border-[#d7e1f1]">
      <div className="flex items-center justify-between bg-[#edf3fc] px-4 py-2">
        <h3 className="text-xs font-bold">{title}</h3>

        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-bold text-blue-600 underline"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

const digits = (value: string, max: number) =>
  value.replace(/\D/g, "").slice(0, max);

const validPhone = (value: string) => /^[6-9]\d{9}$/.test(value);

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function AdmissionApplicationForm({
  draftOwnerId,
}: {
  draftOwnerId: string;
}) {
  const router = useRouter();

  const storageKey = `${STORAGE_KEY}:${draftOwnerId}`;

  const [step, setStep] = useState(0);
  const [data, setData] = useState<Admission>(initial);
  const [more, setMore] = useState(false);

  const [files, setFiles] = useState<Partial<Record<FileKey, File>>>({});

  const [photoUrl, setPhotoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  const [draftExists, setDraftExists] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [today, setToday] = useState("");

  const photoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const schooling = data.course === "Schooling";

  const prevClass = schooling ? previousClass(data.exam) : "";

  const academicLevels = schooling
    ? [prevClass]
    : qualificationLevels(data.qualification);

  const exams = useMemo(() => examGroups[data.course] || [], [data.course]);

  const dob =
    `${data.year}-${data.month.padStart(2, "0")}` +
    `-${data.day.padStart(2, "0")}`;

  const birth = /^\d{4}-\d{2}-\d{2}$/.test(dob)
    ? new Date(`${dob}T00:00:00`)
    : null;

  const minor =
    birth !== null &&
    !Number.isNaN(birth.getTime()) &&
    (Date.now() - birth.getTime()) / (365.25 * 86400000) < 18;

  function patch<K extends keyof Admission>(key: K, value: Admission[K]) {
    setData((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function updateAcademic(index: number, key: keyof Academic, value: string) {
    setData((old) => ({
      ...old,
      academics: old.academics.map((record, i) =>
        i === index ? { ...record, [key]: value } : record,
      ),
    }));
  }

  function updateAchievement(
    index: number,
    key: keyof Achievement,
    value: string,
  ) {
    setData((old) => ({
      ...old,
      achievements: old.achievements.map((record, i) =>
        i === index ? { ...record, [key]: value } : record,
      ),
    }));
  }

  function chooseCourse(course: string) {
    setData((old) =>
      old.course === course
        ? old
        : {
            ...old,
            course,
            exam: "",
            programme: "",
            qualification: "",
            otherQualification: "",
            currentStatus: course === "Schooling" ? "Studying" : "",
            academics: course === "Schooling" ? [emptyAcademic()] : [],
          },
    );
  }

  function chooseExam(exam: string) {
    setData((old) => {
      const isSchooling = old.course === "Schooling";

      const previous = isSchooling ? previousClass(exam) : "";

      return {
        ...old,
        exam,
        qualification: isSchooling ? exam : old.qualification,
        currentStatus: isSchooling ? "Studying" : old.currentStatus,
        academics: isSchooling
          ? [
              {
                ...(old.exam === exam && old.academics[0]
                  ? old.academics[0]
                  : emptyAcademic()),
                level: previous,
              },
            ]
          : old.academics,
      };
    });
  }

  function chooseQualification(qualification: string) {
    setData((old) => ({
      ...old,
      qualification,
      otherQualification:
        qualification === "Other" ? old.otherQualification : "",
      academics: academicsForQualification(qualification, old.academics),
    }));
  }

  // Check whether this staff member has a draft.
  useEffect(() => {
    try {
      setDraftExists(Boolean(localStorage.getItem(storageKey)));
    } catch {
      setDraftExists(false);
    }

    setToday(
      new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(new Date()),
    );
  }, [storageKey]);

  useEffect(() => {
    if (!files.photo) {
      setPhotoUrl("");
      return;
    }

    const url = URL.createObjectURL(files.photo);
    setPhotoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [files.photo]);

  useEffect(() => {
    if (!files.signatureImage) {
      setSignatureUrl("");
      return;
    }

    const url = URL.createObjectURL(files.signatureImage);

    setSignatureUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [files.signatureImage]);

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ data, step }));

      setDraftExists(true);
      setError("");
      setMessage(
        "Draft saved on this device. Please re-upload documents after restoring.",
      );
    } catch {
      setError("Unable to save draft in this browser.");
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        data?: Admission;
        step?: number;
      };

      if (!parsed.data) return;

      const restored = {
        ...initial,
        ...parsed.data,
      };

      const records = Array.isArray(restored.academics)
        ? restored.academics
        : [];

      const previous = previousClass(restored.exam);

      const previousRecord =
        records.find((record) => record.level === previous) ??
        (records.length === 1 ? records[0] : undefined);

      setData({
        ...restored,
        qualification:
          restored.course === "Schooling"
            ? restored.exam
            : restored.qualification,
        currentStatus:
          restored.course === "Schooling" ? "Studying" : restored.currentStatus,
        academics:
          restored.course === "Schooling"
            ? [
                {
                  ...emptyAcademic(),
                  ...previousRecord,
                  level: previous,
                },
              ]
            : academicsForQualification(restored.qualification, records),
      });

      setFiles({});

      setStep(Math.max(0, Math.min(4, Number(parsed.step) || 0)));

      setError("");
      setMessage(
        "Draft restored. Re-upload your photograph, signature and documents.",
      );
    } catch {
      setError("Could not restore the saved draft.");
    }
  }

  function pickFile(key: FileKey, file?: File) {
    if (!file) return;

    const allowed =
      key === "photo" || key === "signatureImage"
        ? ["image/jpeg", "image/png"]
        : ["image/jpeg", "image/png", "application/pdf"];

    if (
      !allowed.includes(file.type) ||
      file.size === 0 ||
      file.size > 1024 * 1024
    ) {
      setError(
        "Only JPG/PNG images and PDF documents are allowed. Maximum 1 MB each.",
      );
      return;
    }

    setFiles((old) => ({
      ...old,
      [key]: file,
    }));

    setError("");
  }

  function validate(index: number): string {
    if (index === 0) {
      if (
        !data.course ||
        !data.exam ||
        !data.programme ||
        !data.studyMode ||
        !data.medium ||
        !data.batchTime
      ) {
        return "Complete all required course selection details.";
      }
    }

    if (index === 1) {
      if (
        !data.name.trim() ||
        !data.day ||
        !data.month ||
        !data.year ||
        !data.gender ||
        !data.category ||
        !data.flat.trim() ||
        !data.street.trim() ||
        !data.city.trim() ||
        !data.state
      ) {
        return "Complete the required student and address details.";
      }

      if (
        !birth ||
        Number.isNaN(birth.getTime()) ||
        birth.getFullYear() !== Number(data.year) ||
        birth.getMonth() + 1 !== Number(data.month) ||
        birth.getDate() !== Number(data.day) ||
        birth > new Date()
      ) {
        return "Enter a valid date of birth.";
      }

      if (!validPhone(data.mobile)) {
        return "Enter a valid 10-digit mobile number.";
      }

      if (!validEmail(data.email)) {
        return "Enter a valid email address.";
      }

      if (!/^\d{6}$/.test(data.pin)) {
        return "Enter a valid 6-digit PIN code.";
      }

      if (!files.photo || !files.signatureImage) {
        return "Upload the student's photo and handwritten signature.";
      }
    }

    if (index === 2) {
      if (schooling) {
        const record = data.academics[0];

        if (
          !prevClass ||
          !record ||
          data.academics.length !== 1 ||
          record.level !== prevClass ||
          !record.institution.trim() ||
          !record.board.trim() ||
          !record.year.trim()
        ) {
          return `Complete previous education details for ${prevClass}.`;
        }
      } else {
        if (!data.qualification || !data.currentStatus) {
          return "Select highest qualification and current status.";
        }

        if (data.qualification === "Other" && !data.otherQualification.trim()) {
          return "Specify your highest qualification.";
        }

        const levels = qualificationLevels(data.qualification);

        if (
          !levels.length ||
          data.academics.length < levels.length ||
          data.academics.length > 8
        ) {
          return "Select a valid qualification and fill its academic records.";
        }

        for (let i = 0; i < levels.length; i++) {
          const record = data.academics[i];

          if (
            !record ||
            record.level !== levels[i] ||
            !record.institution.trim() ||
            !record.board.trim() ||
            !record.year.trim()
          ) {
            return `Complete the education details for ${levels[i]}.`;
          }
        }

        for (const record of data.academics.slice(levels.length)) {
          const filled = Object.values(record).some((value) => value.trim());

          if (
            filled &&
            (!record.level.trim() ||
              !record.institution.trim() ||
              !record.board.trim() ||
              !record.year.trim())
          ) {
            return "Complete all details for additional qualifications.";
          }
        }
      }
    }

    if (index === 3) {
      if (!data.fatherName.trim() && !data.motherName.trim()) {
        return "Enter at least one parent or guardian.";
      }

      if (minor && (!data.fatherName.trim() || !data.motherName.trim())) {
        return "Complete both parent sections for applicants under 18.";
      }

      if (data.fatherName && !validPhone(data.fatherMobile)) {
        return "Enter a valid father's mobile number.";
      }

      if (data.motherName && !validPhone(data.motherMobile)) {
        return "Enter a valid mother's mobile number.";
      }

      if (
        !data.emergencyName.trim() ||
        !data.emergencyRelation ||
        !validPhone(data.emergencyMobile)
      ) {
        return "Complete emergency contact information.";
      }

      if (minor && data.contactPreference === "Student (18 or above)") {
        return "Applicants under 18 must select a parent as primary contact.";
      }
    }

    if (index === 4) {
      if (!data.declarationCorrect || !data.declarationTerms) {
        return "Accept both mandatory declarations.";
      }

      if (
        !data.signature.trim() ||
        data.signature.trim().toLowerCase() !== data.name.trim().toLowerCase()
      ) {
        return "The typed signature must match the student's full name.";
      }
    }

    return "";
  }

  function navigate(next: number) {
    if (next > step) {
      const issue = validate(step);

      if (issue) {
        setError(issue);
        setMessage("");
        return;
      }
    }

    setError("");
    setMessage("");
    setStep(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submit() {
    if (submitting) return;

    for (let i = 0; i < 5; i++) {
      const issue = validate(i);

      if (issue) {
        setStep(i);
        setError(issue);
        return;
      }
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = new FormData();

      payload.set("application", JSON.stringify(data));

      (Object.keys(files) as FileKey[]).forEach((key) => {
        const file = files[key];

        if (file) {
          payload.set(key, file);
        }
      });

      const response = await fetch("/api/admission", {
        method: "POST",
        body: payload,
      });

      const result = (await response.json()) as {
        applicationId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit your application.");
      }

      // MongoDB submission succeeded.
      // Clear only the current staff member's draft.
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Saving succeeded even if local storage fails.
      }

      // Return to the logged-in employee's dashboard.
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f5fb] text-[#09275e]">
      {/* INTERNAL HEADER */}

      <header className="border-b border-[#dce4f1] bg-white">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logoSIQ.png"
              alt="SmartIQ Institute"
              width={220}
              height={60}
              className="h-auto w-[180px] sm:w-[220px]"
              priority
            />
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1050px] gap-8 px-4 pb-16 pt-9 sm:px-7 lg:grid-cols-[212px_minmax(0,1fr)] lg:gap-10">
        {/* LEFT PROGRESS SIDEBAR */}

        <aside className="lg:sticky lg:top-7 lg:self-start">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Internal Admissions
          </p>

          <h1 className="mt-1 text-3xl font-extrabold leading-tight">
            New Admission
            <br />
            Form
          </h1>

          <p className="mt-2 text-[11px] text-slate-500">
            {data.exam
              ? `${data.course} · ${data.exam}`
              : "Choose the programme to begin."}
          </p>

          <nav className="mt-6 space-y-3" aria-label="Application progress">
            {steps.map((title, index) => (
              <button
                key={title}
                type="button"
                disabled={index > step}
                onClick={() => navigate(index)}
                className="flex w-full items-center gap-3 text-left text-xs disabled:cursor-default"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded border font-bold ${
                    index < step
                      ? "border-[#0b2e69] bg-[#0b2e69] text-white"
                      : index === step
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {index < step ? <Check size={13} /> : index + 1}
                </span>

                <span
                  className={index <= step ? "font-bold" : "text-slate-500"}
                >
                  {title}
                </span>
              </button>
            ))}
          </nav>

          {draftExists && (
            <button
              type="button"
              onClick={restoreDraft}
              className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-600 underline"
            >
              <Save size={13} />
              Restore saved draft
            </button>
          )}
        </aside>

        {/* MAIN FORM */}

        <main className="min-w-0 rounded border border-[#d3dceb] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-[10px] text-slate-500">Step {step + 1} of 5</p>

          <h2 className="mt-1 text-xl font-bold">
            {step === 0 ? "Course you are applying for" : steps[step]}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Fields marked * are required.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <p className="mt-4 rounded bg-emerald-50 p-3 text-xs text-emerald-700">
              {message}
            </p>
          )}

          {/* STEP 1 — COURSE */}

          {step === 0 && (
            <div className="mt-6 space-y-6">
              <section>
                <p className={labelClass}>Course *</p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ...topGroups,
                    ...(more
                      ? Object.keys(examGroups).filter(
                          (group) => !topGroups.includes(group),
                        )
                      : []),
                  ].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => chooseCourse(name)}
                      className={`relative min-h-[75px] rounded border p-3 text-left ${
                        data.course === name
                          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                          : "border-[#c9d5e7]"
                      }`}
                    >
                      <strong className="block text-xs">{name}</strong>

                      <span className="mt-1 block pr-3 text-[10px] leading-4 text-slate-500">
                        {name === "Schooling"
                          ? "School tuition and academic support"
                          : name === "SSC"
                            ? "Staff Selection Commission exams"
                            : name === "UPSC"
                              ? "Civil Services and UPSC exams"
                              : "Academic and entrance preparation"}
                      </span>

                      {data.course === name && (
                        <Check
                          size={12}
                          className="absolute right-2 top-2 text-blue-600"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMore(!more)}
                  className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600"
                >
                  {more ? "Show fewer categories" : "More exam categories"}

                  <ChevronDown size={14} />
                </button>
              </section>

              {data.course && (
                <section>
                  <p className={labelClass}>
                    {schooling
                      ? "Select your class for admission"
                      : "Exam you are preparing for"}{" "}
                    *
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {exams.map((exam) => (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => chooseExam(exam)}
                        className={`rounded border px-3 py-2 text-[11px] font-bold ${
                          data.exam === exam
                            ? "border-blue-900 bg-blue-900 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {data.exam === exam && "✓ "}
                        {exam}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  title="Programme"
                  required
                  value={data.programme}
                  onChange={(value) => patch("programme", value)}
                  options={PROGRAMMES}
                />

                <SelectField
                  title="Session"
                  required
                  value={data.session}
                  onChange={(value) => patch("session", value)}
                  options={["2026-27", "2027-28"]}
                />
              </div>

              <section>
                <p className={labelClass}>Mode of study *</p>

                <Choices
                  selected={data.studyMode}
                  onSelect={(value) => patch("studyMode", value)}
                  values={[
                    "Classroom at Vashi",
                    "Classroom at Panvel",
                    "Home Tuition",
                    "Offline",
                    "Online",
                  ]}
                />
              </section>

              <section>
                <p className={labelClass}>Medium *</p>

                <Choices
                  selected={data.medium}
                  onSelect={(value) => patch("medium", value)}
                  values={["English", "Hindi", "Marathi"]}
                />
              </section>

              <section>
                <p className={labelClass}>Preferred batch time *</p>

                <Choices
                  selected={data.batchTime}
                  onSelect={(value) => patch("batchTime", value)}
                  values={["Morning", "Afternoon", "Evening", "Weekend"]}
                />
              </section>

              <SelectField
                title="How did you hear about SmartIQ?"
                value={data.heardFrom}
                onChange={(value) => patch("heardFrom", value)}
                options={[
                  "Google Search",
                  "Instagram",
                  "Facebook",
                  "WhatsApp",
                  "Friend or Family",
                  "School/College",
                  "Walk-in",
                  "Other",
                ]}
              />

              {data.course && data.exam && (
                <p className="rounded bg-blue-50 p-3 text-xs font-semibold">
                  You are applying for: {data.course} · {data.exam}
                </p>
              )}
            </div>
          )}

          {/* STEP 2 — STUDENT DETAILS */}

          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_155px]">
                <div className="space-y-4">
                  <Field
                    title="Name of student"
                    required
                    value={data.name}
                    onChange={(value) => patch("name", value)}
                    placeholder="Full name on official documents"
                  />

                  <section>
                    <p className={labelClass}>Date of birth *</p>

                    <div className="grid max-w-[280px] grid-cols-3 gap-2">
                      {(["day", "month", "year"] as const).map((key) => (
                        <input
                          key={key}
                          aria-label={key}
                          placeholder={
                            key === "day"
                              ? "DD"
                              : key === "month"
                                ? "MM"
                                : "YYYY"
                          }
                          className={inputClass}
                          inputMode="numeric"
                          maxLength={key === "year" ? 4 : 2}
                          value={data[key]}
                          onChange={(event) =>
                            patch(
                              key,
                              digits(
                                event.target.value,
                                key === "year" ? 4 : 2,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className={labelClass}>Gender *</p>

                    <Choices
                      selected={data.gender}
                      onSelect={(value) => patch("gender", value)}
                      values={["Male", "Female", "Other"]}
                    />
                  </section>
                </div>

                {/* STUDENT PHOTO / SIGNATURE */}

                <div className="space-y-5">
                  <section>
                    <p className={labelClass}>Photo *</p>

                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-blue-200 bg-slate-50 p-2 text-blue-600"
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Student photograph preview"
                          className="h-20 w-20 rounded object-cover"
                        />
                      ) : (
                        <UserRound size={28} className="text-slate-400" />
                      )}

                      <span className="rounded border border-blue-300 bg-white px-2 py-1 text-[10px]">
                        {files.photo ? "Replace photo" : "Upload photo"}
                      </span>
                    </button>

                    <input
                      ref={photoRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={(event) =>
                        pickFile("photo", event.target.files?.[0])
                      }
                    />

                    <p className="mt-2 text-[10px] text-slate-500">
                      JPG/PNG, maximum 1 MB.
                    </p>
                  </section>

                  <section>
                    <p className={labelClass}>Student signature *</p>

                    <button
                      type="button"
                      onClick={() => signatureRef.current?.click()}
                      className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-blue-200 bg-slate-50 p-3 text-blue-600"
                    >
                      {signatureUrl ? (
                        <img
                          src={signatureUrl}
                          alt="Student signature preview"
                          className="h-16 w-full object-contain"
                        />
                      ) : (
                        <PenLine size={28} className="text-slate-400" />
                      )}

                      <span className="rounded border border-blue-300 bg-white px-2 py-1 text-[10px]">
                        {files.signatureImage
                          ? "Replace signature"
                          : "Upload signature"}
                      </span>
                    </button>

                    <input
                      ref={signatureRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={(event) =>
                        pickFile("signatureImage", event.target.files?.[0])
                      }
                    />

                    <p className="mt-2 text-[10px] text-slate-500">
                      Sign on white paper, JPG/PNG, maximum 1 MB.
                    </p>
                  </section>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  title="Category"
                  required
                  value={data.category}
                  onChange={(value) => patch("category", value)}
                  options={["General", "OBC", "SC", "ST", "EWS", "Other"]}
                />

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={data.pwd}
                    onChange={(event) => patch("pwd", event.target.checked)}
                  />
                  Person with disability (PwD)
                </label>

                <Field
                  title="Mobile number"
                  required
                  value={data.mobile}
                  onChange={(value) => patch("mobile", digits(value, 10))}
                />

                <Field
                  title="Email ID"
                  required
                  type="email"
                  value={data.email}
                  onChange={(value) => patch("email", value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={data.whatsappSame}
                  onChange={(event) =>
                    patch("whatsappSame", event.target.checked)
                  }
                />
                This number is also WhatsApp
              </label>

              <section className="space-y-4 border-t pt-5">
                <h3 className="text-sm font-bold">Address of student</h3>

                <Field
                  title="Flat, house number, building"
                  required
                  value={data.flat}
                  onChange={(value) => patch("flat", value)}
                />

                <Field
                  title="Street, sector, area"
                  required
                  value={data.street}
                  onChange={(value) => patch("street", value)}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field
                    title="City"
                    required
                    value={data.city}
                    onChange={(value) => patch("city", value)}
                  />

                  <SelectField
                    title="State"
                    required
                    value={data.state}
                    onChange={(value) => patch("state", value)}
                    options={STATES}
                  />

                  <Field
                    title="PIN code"
                    required
                    value={data.pin}
                    onChange={(value) => patch("pin", digits(value, 6))}
                  />
                </div>
              </section>
            </div>
          )}

          {/* STEP 3 — EDUCATION */}

          {step === 2 && (
            <div className="mt-6 space-y-6">
              {schooling ? (
                <div className="rounded border border-blue-100 bg-blue-50 p-4 text-xs leading-6">
                  <strong>Applying for {data.exam}.</strong> Please enter the
                  education details of <strong>{prevClass}</strong>, not the
                  class being joined.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      title="Highest / current qualification"
                      required
                      value={data.qualification}
                      onChange={chooseQualification}
                      options={QUALIFICATIONS}
                    />

                    <section>
                      <p className={labelClass}>At present you are *</p>

                      <Choices
                        selected={data.currentStatus}
                        onSelect={(value) => patch("currentStatus", value)}
                        values={["Studying", "Working", "Preparing full time"]}
                      />
                    </section>
                  </div>

                  {data.qualification === "Other" && (
                    <Field
                      title="Specify your highest qualification"
                      required
                      value={data.otherQualification}
                      onChange={(value) => patch("otherQualification", value)}
                      placeholder="Diploma, ITI, certification, etc."
                    />
                  )}

                  {!data.qualification ? (
                    <p className="rounded bg-slate-50 p-4 text-xs text-slate-600">
                      Select your highest qualification to display the required
                      academic detail boxes.
                    </p>
                  ) : (
                    <p className="rounded bg-blue-50 p-4 text-xs text-blue-900">
                      Complete the education records displayed below.
                      {data.qualification === "Undergraduate" &&
                        " If currently pursuing a degree, enter the expected completion year."}
                    </p>
                  )}
                </div>
              )}

              {(schooling || data.qualification) && (
                <section className="border-t pt-5">
                  <h3 className="text-sm font-bold">
                    {schooling
                      ? `Previous education — ${prevClass}`
                      : "Previous education details"}
                  </h3>

                  <div className="mt-4 space-y-4">
                    {data.academics.map((record, index) => {
                      const fixedLevel =
                        schooling || index < academicLevels.length;

                      const level = schooling ? prevClass : record.level;

                      const ongoing =
                        data.qualification === "Undergraduate" &&
                        record.level === "Graduation";

                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-[#d3dceb] bg-white p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <strong className="text-xs text-[#132c62]">
                              {fixedLevel ? level : "Additional qualification"}
                            </strong>

                            {fixedLevel ? (
                              <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                Required
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  patch(
                                    "academics",
                                    data.academics.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                                className="text-xs text-red-600 underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className={labelClass}>
                                {schooling ? "Previous class" : "Qualification"}{" "}
                                *
                              </span>

                              <input
                                className={`${inputClass} ${
                                  fixedLevel ? "bg-slate-50 font-bold" : ""
                                }`}
                                value={level}
                                readOnly={fixedLevel}
                                onChange={(event) =>
                                  updateAcademic(
                                    index,
                                    "level",
                                    event.target.value,
                                  )
                                }
                                placeholder="Qualification"
                              />
                            </label>

                            <Field
                              title="School / College / Institution"
                              required
                              value={record.institution}
                              onChange={(value) =>
                                updateAcademic(index, "institution", value)
                              }
                              placeholder="Institution name"
                            />

                            <Field
                              title="Board / University"
                              required
                              value={record.board}
                              onChange={(value) =>
                                updateAcademic(index, "board", value)
                              }
                              placeholder="CBSE, HSC, Mumbai University..."
                            />

                            <Field
                              title={
                                ongoing
                                  ? "Expected completion year"
                                  : "Passing / academic year"
                              }
                              required
                              value={record.year}
                              onChange={(value) =>
                                updateAcademic(index, "year", value)
                              }
                              placeholder="YYYY"
                            />

                            <Field
                              title="Marks / Percentage / CGPA (optional)"
                              value={record.marks}
                              onChange={(value) =>
                                updateAcademic(index, "marks", value)
                              }
                              placeholder="85% or 8.5 CGPA"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!schooling && (
                    <button
                      type="button"
                      disabled={data.academics.length >= 8}
                      onClick={() =>
                        patch("academics", [...data.academics, emptyAcademic()])
                      }
                      className="mt-3 flex items-center gap-1 rounded border border-blue-300 px-3 py-2 text-xs text-blue-600 disabled:opacity-50"
                    >
                      <Plus size={13} />
                      Add another qualification (optional)
                    </button>
                  )}
                </section>
              )}

              {/* ACHIEVEMENTS */}

              <section className="border-t pt-5">
                <h3 className="text-sm font-bold">
                  Other achievements
                  <span className="ml-1 font-normal text-slate-500">
                    (optional)
                  </span>
                </h3>

                <p className="my-3 text-[11px] text-slate-500">
                  Exams, Olympiads, scholarships and awards.
                </p>

                <div className="space-y-2">
                  {data.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-2 gap-2 rounded border p-3 sm:grid-cols-4"
                    >
                      {(["year", "exam", "level", "score"] as const).map(
                        (key) => (
                          <input
                            key={key}
                            className={inputClass}
                            value={achievement[key]}
                            aria-label={key}
                            placeholder={
                              {
                                year: "Year",
                                exam: "Exam / competition",
                                level: "Level / qualified",
                                score: "Marks / rank",
                              }[key]
                            }
                            onChange={(event) =>
                              updateAchievement(index, key, event.target.value)
                            }
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={data.achievements.length >= 8}
                  onClick={() =>
                    patch("achievements", [
                      ...data.achievements,
                      emptyAchievement(),
                    ])
                  }
                  className="mt-3 flex items-center gap-1 rounded border border-blue-300 px-3 py-2 text-xs text-blue-600 disabled:opacity-50"
                >
                  <Plus size={13} />
                  Add another
                </button>
              </section>
            </div>
          )}

          {/* STEP 4 — PARENTS AND CONTACT */}

          {step === 3 && (
            <div className="mt-6 space-y-5">
              {(["father", "mother"] as const).map((who) => {
                const title = who === "father" ? "Father" : "Mother";

                const nameKey = `${who}Name` as const;

                const occupationKey = `${who}Occupation` as const;

                const mobileKey = `${who}Mobile` as const;

                const emailKey = `${who}Email` as const;

                return (
                  <section key={who} className="border-b pb-5">
                    <h3 className="mb-4 text-sm font-bold">{title}</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        title={`${title}'s name`}
                        required={minor}
                        value={data[nameKey]}
                        onChange={(value) => patch(nameKey, value)}
                      />

                      <Field
                        title="Occupation"
                        value={data[occupationKey]}
                        onChange={(value) => patch(occupationKey, value)}
                      />

                      <Field
                        title="Mobile number"
                        required={minor}
                        value={data[mobileKey]}
                        onChange={(value) =>
                          patch(mobileKey, digits(value, 10))
                        }
                      />

                      <Field
                        title="Email ID"
                        type="email"
                        value={data[emailKey]}
                        onChange={(value) => patch(emailKey, value)}
                      />
                    </div>
                  </section>
                );
              })}

              <section>
                <p className={labelClass}>
                  Who should we contact about fees and progress? *
                </p>

                <Choices
                  selected={data.contactPreference}
                  onSelect={(value) => patch("contactPreference", value)}
                  values={["Father", "Mother", "Student (18 or above)"]}
                />
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-sm font-bold">Emergency contact</h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field
                    title="Name"
                    required
                    value={data.emergencyName}
                    onChange={(value) => patch("emergencyName", value)}
                  />

                  <SelectField
                    title="Relation"
                    required
                    value={data.emergencyRelation}
                    onChange={(value) => patch("emergencyRelation", value)}
                    options={[
                      "Uncle",
                      "Aunt",
                      "Sibling",
                      "Grandparent",
                      "Other relative",
                      "Guardian",
                      "Friend",
                      "Other",
                    ]}
                  />

                  <Field
                    title="Mobile number"
                    required
                    value={data.emergencyMobile}
                    onChange={(value) =>
                      patch("emergencyMobile", digits(value, 10))
                    }
                  />
                </div>
              </section>
            </div>
          )}

          {/* STEP 5 — REVIEW */}

          {step === 4 && (
            <div className="mt-6 space-y-4">
              <ReviewSection title="Course" onEdit={() => navigate(0)}>
                <Detail title="Course" value={data.course} />

                <Detail title="Exam / Class" value={data.exam} />

                <Detail title="Programme" value={data.programme} />

                <Detail title="Session" value={data.session} />

                <Detail title="Mode" value={data.studyMode} />

                <Detail title="Medium" value={data.medium} />
              </ReviewSection>

              <ReviewSection title="Student details" onEdit={() => navigate(1)}>
                <Detail title="Name" value={data.name} />

                <Detail title="DOB" value={dob} />

                <Detail title="Gender" value={data.gender} />

                <Detail title="Mobile" value={data.mobile} />

                <Detail title="Email" value={data.email} />

                <Detail
                  title="Address"
                  value={`${data.flat}, ${data.street}, ${data.city}, ${data.state} ${data.pin}`}
                />
              </ReviewSection>

              <ReviewSection title="Education" onEdit={() => navigate(2)}>
                <Detail
                  title={
                    schooling ? "Class applied for" : "Highest qualification"
                  }
                  value={
                    schooling
                      ? data.exam
                      : data.qualification === "Other"
                        ? `Other: ${data.otherQualification}`
                        : data.qualification
                  }
                />

                {schooling && (
                  <Detail title="Previous class" value={prevClass} />
                )}

                <Detail title="Current status" value={data.currentStatus} />

                {data.academics.map((record, index) => (
                  <div
                    key={index}
                    className="col-span-2 rounded border bg-slate-50 p-3 sm:col-span-3"
                  >
                    <p className="mb-2 text-xs font-bold">{record.level}</p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Detail title="Institution" value={record.institution} />

                      <Detail title="Board / University" value={record.board} />

                      <Detail title="Year" value={record.year} />

                      <Detail title="Marks / CGPA" value={record.marks} />
                    </div>
                  </div>
                ))}
              </ReviewSection>

              <ReviewSection
                title="Parents and emergency contact"
                onEdit={() => navigate(3)}
              >
                <Detail title="Father" value={data.fatherName} />

                <Detail title="Mother" value={data.motherName} />

                <Detail title="Emergency" value={data.emergencyName} />

                <Detail
                  title="Primary contact"
                  value={data.contactPreference}
                />
              </ReviewSection>

              {/* DOCUMENTS */}

              <section className="border-t pt-5">
                <h3 className="text-sm font-bold">Documents</h3>

                <p className="mt-1 text-[11px] text-slate-500">
                  Student photo and signature are required. Photo ID and
                  marksheet are optional. Maximum 1 MB each.
                </p>

                <div className="mt-3 space-y-2">
                  {(
                    [
                      {
                        key: "photo",
                        title: "Passport-size photo",
                        required: true,
                      },
                      {
                        key: "signatureImage",
                        title: "Student signature",
                        required: true,
                      },
                      {
                        key: "photoId",
                        title: "Photo ID proof",
                        required: false,
                      },
                      {
                        key: "marksheet",
                        title: "Latest marksheet",
                        required: false,
                      },
                    ] as const
                  ).map((doc) => (
                    <label
                      key={doc.key}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded border p-3 text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText size={17} className="text-blue-600" />

                        <span>
                          <strong className="block">
                            {doc.title}
                            {doc.required && " *"}
                          </strong>

                          <small className="block text-slate-500">
                            {files[doc.key]?.name || "No file selected"}
                          </small>
                        </span>
                      </span>

                      <span className="rounded border px-3 py-1 text-blue-600">
                        {files[doc.key] ? "Replace" : "Upload"}
                      </span>

                      <input
                        type="file"
                        className="hidden"
                        accept={
                          doc.key === "photo" || doc.key === "signatureImage"
                            ? "image/jpeg,image/png"
                            : "image/jpeg,image/png,application/pdf"
                        }
                        onChange={(event) =>
                          pickFile(doc.key, event.target.files?.[0])
                        }
                      />
                    </label>
                  ))}
                </div>
              </section>

              {/* DECLARATIONS */}

              <section className="space-y-3 border-t pt-5">
                <h3 className="text-sm font-bold">Declaration</h3>

                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={data.declarationCorrect}
                    onChange={(event) =>
                      patch("declarationCorrect", event.target.checked)
                    }
                  />
                  I declare that all details are true and correct. *
                </label>

                <div className="flex items-start gap-2 text-xs">
                  <input
                    id="admission-terms"
                    type="checkbox"
                    checked={data.declarationTerms}
                    onChange={(event) =>
                      patch("declarationTerms", event.target.checked)
                    }
                  />

                  <div>
                    I agree to SmartIQ Institute&apos;s{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    *
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={data.declarationContact}
                    onChange={(event) =>
                      patch("declarationContact", event.target.checked)
                    }
                  />
                  I agree to receive admission-related updates.
                </label>

                <p className="rounded bg-blue-50 p-3 text-xs text-slate-600">
                  Admission is subject to institute review and confirmation.
                </p>

                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <Field
                    title="Type full name as signature"
                    required
                    value={data.signature}
                    onChange={(value) => patch("signature", value)}
                  />

                  <div>
                    <p className={labelClass}>Date</p>

                    <div className={`${inputClass} flex items-center`}>
                      {today}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* NAVIGATION */}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            {step === 0 ? (
              <button
                type="button"
                onClick={saveDraft}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 underline"
              >
                <Save size={13} />
                Save and continue later
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(step - 1)}
                className="inline-flex items-center gap-1 rounded border border-blue-300 px-4 py-2 text-xs font-bold text-blue-600"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}

            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={saveDraft}
                  className="hidden text-xs text-blue-600 underline sm:inline"
                >
                  Save draft
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => navigate(step + 1)}
                  className="inline-flex items-center gap-2 rounded bg-[#2458ef] px-4 py-2.5 text-xs font-bold text-white"
                >
                  Next: {steps[step + 1]}
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit()}
                  className="inline-flex items-center gap-2 rounded bg-[#2458ef] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit application"}

                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
