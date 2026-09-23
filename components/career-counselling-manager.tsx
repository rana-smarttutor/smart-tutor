"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  Trash2,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

type CareerStatus = "new" | "in-progress" | "follow-up" | "completed";

type CareerDetails = {
  studentName: string;
  dateOfBirth: string;
  studentPhone: string;
  parentName: string;
  parentWhatsapp: string;
  email: string;
  city: string;
  classLevel: string;
  board: string;
  school: string;
  academicPercentage: string;
  strongSubjects: string[];
  weakSubjects: string[];
  interests: string[];
  careerGoal: string;
  preferredStream: string;
  preferredLearningStyle: string;
  examInterests: string[];
  parentExpectations: string;
  challenges: string;
  counsellorNotes: string;
  recommendedPrograms: string[];
  followUpDate: string;
  status: CareerStatus;
  aiConsent: boolean;
  whatsappConsent: boolean;
};

type CareerRecord = CareerDetails & {
  id: string;
  aiSuggestion: string;
  aiReviewed: boolean;
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

type StringField = {
  [K in keyof CareerDetails]: CareerDetails[K] extends string ? K : never;
}[keyof CareerDetails];

type ArrayField = {
  [K in keyof CareerDetails]: CareerDetails[K] extends string[] ? K : never;
}[keyof CareerDetails];

const EMPTY_FORM: CareerDetails = {
  studentName: "",
  dateOfBirth: "",
  studentPhone: "",
  parentName: "",
  parentWhatsapp: "",
  email: "",
  city: "",
  classLevel: "",
  board: "",
  school: "",
  academicPercentage: "",
  strongSubjects: [],
  weakSubjects: [],
  interests: [],
  careerGoal: "",
  preferredStream: "",
  preferredLearningStyle: "",
  examInterests: [],
  parentExpectations: "",
  challenges: "",
  counsellorNotes: "",
  recommendedPrograms: [],
  followUpDate: "",
  status: "new",
  aiConsent: false,
  whatsappConsent: false,
};

// ============================================================
// CLASS, BOARD AND STREAM BASED SUBJECT OPTIONS
// ============================================================

const PRIMARY_SUBJECTS = [
  "English",
  "Hindi",
  "Marathi",
  "Mathematics",
  "Environmental Studies",
  "Science",
  "Social Studies",
  "Computer Science",
  "General Knowledge",
];

const SECONDARY_SUBJECTS = [
  "English",
  "Hindi",
  "Marathi",
  "Mathematics",
  "Science",
  "History",
  "Geography",
  "Civics",
  "Economics",
  "Computer Science",
  "Information Technology",
];

const SCIENCE_SUBJECTS = [
  "English",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Psychology",
  "Physical Education",
];

const COMMERCE_SUBJECTS = [
  "English",
  "Accountancy",
  "Book Keeping",
  "Economics",
  "Business Studies",
  "Organisation of Commerce",
  "Secretarial Practice",
  "Mathematics",
  "Statistics",
  "Computer Science",
  "Information Technology",
];

const ARTS_SUBJECTS = [
  "English",
  "History",
  "Geography",
  "Political Science",
  "Psychology",
  "Sociology",
  "Economics",
  "Philosophy",
  "Mathematics",
  "Fine Arts",
  "Hindi",
  "Marathi",
];

function getCareerSubjects(
  classLevel: string,
  board: string,
  stream: string,
): string[] {
  if (!classLevel) {
    return [];
  }

  const normalizedBoard = board.toLowerCase();

  const isMaharashtra = normalizedBoard.includes("maharashtra");

  const isCBSE = normalizedBoard.includes("cbse");

  const isICSE = normalizedBoard.includes("icse");

  const isCambridge = normalizedBoard.includes("cambridge");

  const isIB = normalizedBoard === "ib";

  // Classes 6, 7 and 8
  if (["Class 6", "Class 7", "Class 8"].includes(classLevel)) {
    if (isMaharashtra) {
      return [
        "English",
        "Marathi",
        "Hindi",
        "Mathematics",
        "General Science",
        "History",
        "Civics",
        "Geography",
        "Computer Science",
      ];
    }

    if (isCBSE) {
      return [
        "English",
        "Hindi",
        "Mathematics",
        "Science",
        "Social Science",
        "Computer Science",
        "Sanskrit",
        "Marathi",
      ];
    }

    if (isICSE) {
      return [
        "English",
        "Hindi",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Civics",
        "Geography",
        "Computer Studies",
      ];
    }

    if (isCambridge || isIB) {
      return [
        "English",
        "Mathematics",
        "Science",
        "Biology",
        "Chemistry",
        "Physics",
        "Individuals and Societies",
        "Humanities",
        "Computer Science",
        "Design",
        "Languages",
      ];
    }

    return PRIMARY_SUBJECTS;
  }

  // Classes 9 and 10
  if (["Class 9", "Class 10"].includes(classLevel)) {
    if (isMaharashtra) {
      return [
        "English",
        "Marathi",
        "Hindi",
        "Mathematics",
        "Algebra",
        "Geometry",
        "Science and Technology",
        "Science and Technology Part 1",
        "Science and Technology Part 2",
        "History",
        "Political Science",
        "Geography",
        "Economics",
        "Information Technology",
      ];
    }

    if (isCBSE) {
      return [
        "English",
        "Hindi",
        "Mathematics",
        "Science",
        "Physics",
        "Chemistry",
        "Biology",
        "Social Science",
        "History",
        "Geography",
        "Political Science",
        "Economics",
        "Information Technology",
        "Artificial Intelligence",
        "Sanskrit",
      ];
    }

    if (isICSE) {
      return [
        "English",
        "Hindi",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Civics",
        "Geography",
        "Computer Applications",
        "Economics",
        "Commercial Studies",
      ];
    }

    return SECONDARY_SUBJECTS;
  }

  // Classes 11 and 12
  if (["Class 11", "Class 12"].includes(classLevel)) {
    if (stream.startsWith("Science")) {
      return SCIENCE_SUBJECTS;
    }

    if (stream === "Commerce") {
      return COMMERCE_SUBJECTS;
    }

    if (stream === "Arts / Humanities") {
      return ARTS_SUBJECTS;
    }

    // Until a stream is selected, show options
    // across the three major streams.
    return [
      ...new Set([...SCIENCE_SUBJECTS, ...COMMERCE_SUBJECTS, ...ARTS_SUBJECTS]),
    ];
  }

  // Diploma, undergraduate, postgraduate and
  // working professionals have programme-specific
  // subjects. Allow users to enter custom subjects.
  return [];
}

const INTEREST_OPTIONS = [
  "Technology",
  "Coding",
  "Artificial Intelligence",
  "Robotics",
  "Engineering",
  "Medicine",
  "Research",
  "Business",
  "Entrepreneurship",
  "Finance",
  "Design",
  "Creative Arts",
  "Writing",
  "Public Speaking",
  "Law",
  "Civil Services",
  "Defence",
  "Sports",
  "Teaching",
  "Social Work",
  "Media",
  "Hospitality",
];

const EXAM_OPTIONS = [
  "JEE",
  "NEET",
  "MHT-CET",
  "CUET",
  "NDA",
  "CLAT",
  "CA Foundation",
  "CSEET",
  "CMA Foundation",
  "UPSC",
  "MPSC",
  "SSC",
  "Banking Exams",
  "Railway Exams",
  "IPMAT",
  "NPAT",
];

const CLASS_OPTIONS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Diploma",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Working Professional",
  "Other",
];

const BOARD_OPTIONS = [
  "Maharashtra State Board",
  "CBSE",
  "ICSE / ISC",
  "Cambridge",
  "IB",
  "University",
  "Other",
];

const STATUS_OPTIONS: {
  value: CareerStatus;
  label: string;
}[] = [
  { value: "new", label: "New Enquiry" },
  { value: "in-progress", label: "In Progress" },
  { value: "follow-up", label: "Follow-up" },
  { value: "completed", label: "Completed" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS =
  "mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#092F78] disabled:cursor-not-allowed disabled:opacity-50";

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50";

function createEmptyForm(): CareerDetails {
  return {
    ...EMPTY_FORM,
    strongSubjects: [],
    weakSubjects: [],
    interests: [],
    examInterests: [],
    recommendedPrograms: [],
  };
}

function formatDate(value: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: CareerStatus) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character] ?? character;
  });
}

function joinValues(values: string[]) {
  return values.length ? values.join(", ") : "Not specified";
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-[#0B40A1]">
            {number}
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">{title}</h2>

            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={INPUT_CLASS}
      >
        <option value="">Select an option</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${INPUT_CLASS} resize-y leading-6`}
      />
    </div>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [customValue, setCustomValue] = useState("");

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  }

  function addCustom() {
    const values = customValue
      .split(/[,;\n]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!values.length) return;

    const combined = [...selected];

    for (const value of values) {
      if (
        !combined.some((item) => item.toLowerCase() === value.toLowerCase())
      ) {
        combined.push(value);
      }
    }

    onChange(combined);
    setCustomValue("");
  }

  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                active
                  ? "border-blue-400 bg-blue-100 text-blue-800"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              {active ? "✓ " : "+ "}
              {option}
            </button>
          );
        })}
      </div>

      {selected.some((item) => !options.includes(item)) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected
            .filter((item) => !options.includes(item))
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                title="Click to remove"
              >
                ✓ {item} ×
              </button>
            ))}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <input
          value={customValue}
          onChange={(event) => setCustomValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add another option"
          className={INPUT_CLASS}
        />

        <button type="button" onClick={addCustom} className={SECONDARY_BUTTON}>
          Add
        </button>
      </div>
    </div>
  );
}

function buildWhatsAppMessage(record: CareerRecord) {
  const lines = [
    "*SMARTIQ INSTITUTE*",
    "*CAREER COUNSELLING REPORT*",
    "",
    `Student: ${record.studentName}`,
    `Class / Level: ${record.classLevel}`,
    `Board: ${record.board || "Not specified"}`,
    "",
    "*ACADEMIC PROFILE*",
    `Strong Subjects: ${joinValues(record.strongSubjects)}`,
    `Subjects to Improve: ${joinValues(record.weakSubjects)}`,
    `Interests: ${joinValues(record.interests)}`,
    `Career Interest: ${record.careerGoal || "Exploring options"}`,
    "",
    "*CAREER GUIDANCE*",
    record.aiSuggestion.trim(),
    "",
    "This report is intended to support career exploration and discussion with a counsellor.",
    "",
    "SmartIQ Institute",
  ];

  return lines.join("\n");
}

function buildPrintableHtml(record: CareerRecord) {
  const row = (label: string, value: string) => `
    <div class="row">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value || "Not specified")}</div>
    </div>
  `;

  const aiText = escapeHtml(record.aiSuggestion || "Not generated");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Career Counselling - ${escapeHtml(record.studentName)}</title>

<style>
  @page {
    size: A4;
    margin: 16mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    color: #17243a;
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.6;
  }

  .header {
    padding: 22px;
    background: #0b40a1;
    color: white;
    border-radius: 12px;
  }

  .brand {
    font-size: 21px;
    font-weight: 800;
  }

  .subtitle {
    margin-top: 5px;
    font-size: 12px;
    opacity: .9;
  }

  h2 {
    font-size: 15px;
    margin: 25px 0 10px;
    color: #0b40a1;
    border-bottom: 1px solid #dce5f2;
    padding-bottom: 7px;
  }

  .row {
    display: flex;
    gap: 15px;
    padding: 8px 0;
    border-bottom: 1px solid #edf1f7;
    break-inside: avoid;
  }

  .label {
    width: 160px;
    min-width: 160px;
    font-weight: 700;
    color: #64748b;
  }

  .value {
    flex: 1;
    white-space: pre-wrap;
  }

  .ai-report {
    margin-top: 12px;
    padding: 18px;
    background: #f3f7ff;
    border: 1px solid #dce7ff;
    border-radius: 10px;
    white-space: pre-wrap;
    line-height: 1.7;
  }

  .footer {
    margin-top: 25px;
    padding-top: 12px;
    border-top: 1px solid #dce5f2;
    color: #64748b;
    font-size: 10px;
  }

  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>
</head>

<body>

  <div class="header">
    <div class="brand">SmartIQ Institute</div>

    <div class="subtitle">
      Personalised Career Counselling Report
    </div>
  </div>

  <h2>Student Information</h2>

  ${row("Student Name", record.studentName)}
  ${row("Class / Level", record.classLevel)}
  ${row("Board", record.board)}
  ${row("School / College", record.school)}
  ${row("City", record.city)}

  <h2>Academic Assessment</h2>

  ${row("Academic Percentage", record.academicPercentage)}
  ${row("Strong Subjects", joinValues(record.strongSubjects))}
  ${row("Subjects to Improve", joinValues(record.weakSubjects))}
  ${row("Learning Preference", record.preferredLearningStyle)}

  <h2>Career Interests</h2>

  ${row("Interests", joinValues(record.interests))}
  ${row("Career Goal", record.careerGoal)}
  ${row("Preferred Stream", record.preferredStream)}
  ${row("Entrance Exams", joinValues(record.examInterests))}
  ${row("Suggested Programs", joinValues(record.recommendedPrograms))}

  <h2>Career Counselling Guidance</h2>

  <div class="ai-report">${aiText}</div>

  <div class="footer">
    Reviewed counselling guidance prepared by SmartIQ Institute.
    This report supports exploration and does not guarantee
    admission, eligibility or career outcomes.
  </div>

  <button
    class="no-print"
    onclick="window.print()"
    style="
      margin-top:20px;
      background:#0b40a1;
      color:white;
      border:0;
      padding:12px 20px;
      border-radius:8px;
      cursor:pointer;
    "
  >
    Print / Save as PDF
  </button>

</body>
</html>
`;
}

export function CareerCounsellingManager() {
  const [records, setRecords] = useState<CareerRecord[]>([]);

  const [form, setForm] = useState<CareerDetails>(createEmptyForm);

  const availableSubjects = useMemo(() => {
    return getCareerSubjects(form.classLevel, form.board, form.preferredStream);
  }, [form.classLevel, form.board, form.preferredStream]);

  const [selectedRecord, setSelectedRecord] = useState<CareerRecord | null>(
    null,
  );

  const [aiSuggestion, setAiSuggestion] = useState("");

  const [dirty, setDirty] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [canDelete, setCanDelete] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);

  const [reviewing, setReviewing] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/career-counselling", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load records.");
        }

        setRecords(Array.isArray(payload.records) ? payload.records : []);

        setCanDelete(payload.canDelete === true);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load counselling records.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.studentName,
        record.classLevel,
        record.parentName,
        record.parentWhatsapp,
        record.careerGoal,
        record.createdByName,
        record.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [records, search]);

  const stats = useMemo(
    () => ({
      total: records.length,

      new: records.filter((record) => record.status === "new").length,

      progress: records.filter(
        (record) =>
          record.status === "in-progress" || record.status === "follow-up",
      ).length,

      completed: records.filter((record) => record.status === "completed")
        .length,
    }),
    [records],
  );

  function updateString(field: StringField, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setDirty(true);
    setSuccess("");
  }

  function updateArray(field: ArrayField, value: string[]) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setDirty(true);
    setSuccess("");
  }

  function updateBoolean(
    field: "aiConsent" | "whatsappConsent",
    value: boolean,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setDirty(true);
    setSuccess("");
  }

  function openNewForm() {
    setSelectedRecord(null);

    setForm(createEmptyForm());

    setAiSuggestion("");

    setDirty(false);

    setError("");
    setSuccess("");

    setShowForm(true);
  }

  function openRecord(record: CareerRecord) {
    setSelectedRecord(record);

    setForm({
      ...record,

      strongSubjects: [...record.strongSubjects],

      weakSubjects: [...record.weakSubjects],

      interests: [...record.interests],

      examInterests: [...record.examInterests],

      recommendedPrograms: [...record.recommendedPrograms],
    });

    setAiSuggestion(record.aiSuggestion || "");

    setDirty(false);

    setError("");
    setSuccess("");

    setShowForm(true);
  }

  function upsertRecord(record: CareerRecord) {
    setRecords((previous) => {
      const exists = previous.some((item) => item.id === record.id);

      return exists
        ? previous.map((item) => (item.id === record.id ? record : item))
        : [record, ...previous];
    });

    setSelectedRecord(record);

    setForm({
      ...record,

      strongSubjects: [...record.strongSubjects],

      weakSubjects: [...record.weakSubjects],

      interests: [...record.interests],

      examInterests: [...record.examInterests],

      recommendedPrograms: [...record.recommendedPrograms],
    });

    setAiSuggestion(record.aiSuggestion || "");

    setDirty(false);
  }

  async function saveRecord(reviewed = false): Promise<CareerRecord | null> {
    if (
      !form.studentName.trim() ||
      !form.classLevel.trim() ||
      !form.parentWhatsapp.trim()
    ) {
      setError(
        "Student name, class/level and parent WhatsApp number are required.",
      );

      return null;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const existingId = selectedRecord?.id;

      const url = existingId
        ? `/api/career-counselling/${existingId}`
        : "/api/career-counselling";

      const response = await fetch(url, {
        method: existingId ? "PATCH" : "POST",

        credentials: "same-origin",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,

          aiSuggestion,

          aiReviewed: reviewed,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || "Unable to save record.");
      }

      const record = payload.record as CareerRecord;

      upsertRecord(record);

      setSuccess(
        reviewed
          ? "Career guidance reviewed and approved."
          : "Career counselling enquiry saved successfully.",
      );

      return record;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save record.",
      );

      return null;
    } finally {
      setSaving(false);
      setReviewing(false);
    }
  }

  async function deleteCareerEnquiry(record: CareerRecord) {
    if (!canDelete || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete the career counselling enquiry for ${record.studentName}?

This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(record.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/career-counselling/${encodeURIComponent(record.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success !== true) {
        throw new Error(
          payload?.error || "Unable to delete counselling enquiry.",
        );
      }

      // Immediately remove the record from the directory.
      // Summary counts update automatically from records.
      setRecords((previous) =>
        previous.filter((item) => item.id !== record.id),
      );

      // Reset editor if the deleted record was selected.
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
        setForm(createEmptyForm());
        setAiSuggestion("");
        setDirty(false);
        setShowForm(false);
      }

      setSuccess(
        `Career counselling enquiry for ${record.studentName} deleted successfully.`,
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete counselling enquiry.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await saveRecord(false);
  }

  async function generateAI() {
    if (!selectedRecord) {
      setError("Save the counselling enquiry before generating AI guidance.");

      return;
    }

    if (dirty) {
      setError("Save the latest changes before generating AI guidance.");

      return;
    }

    if (!form.aiConsent) {
      setError(
        "Please record the student or parent's consent for AI analysis.",
      );

      return;
    }

    try {
      setGenerating(true);

      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/career-counselling/${selectedRecord.id}/ai`,
        {
          method: "POST",

          credentials: "same-origin",
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || "Unable to generate career guidance.");
      }

      upsertRecord(payload.record as CareerRecord);

      setSuccess(
        "AI guidance generated. Review and edit the report before approving it.",
      );
    } catch (aiError) {
      setError(
        aiError instanceof Error ? aiError.message : "AI generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function approveAI() {
    if (!selectedRecord) return;

    if (!aiSuggestion.trim()) {
      setError("Generate or enter a career guidance report before approval.");

      return;
    }

    if (dirty) {
      setError("Save the counselling changes before approving the AI report.");

      return;
    }

    setReviewing(true);

    await saveRecord(true);
  }

  function sendWhatsApp() {
    if (!selectedRecord) return;

    if (dirty) {
      setError("Save the latest changes before sharing.");

      return;
    }

    if (!selectedRecord.aiReviewed || !selectedRecord.aiSuggestion.trim()) {
      setError("Review and approve the career guidance before sharing.");

      return;
    }

    if (!selectedRecord.whatsappConsent) {
      setError("Record the customer's WhatsApp sharing consent first.");

      return;
    }

    let phone = selectedRecord.parentWhatsapp.replace(/\D/g, "");

    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    if (phone.length < 10 || phone.length > 15) {
      setError("Enter a valid parent/customer WhatsApp number.");

      return;
    }

    const message = buildWhatsAppMessage(selectedRecord);

    const url = `https://wa.me/${phone}?text=` + encodeURIComponent(message);

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function printReport() {
    if (!selectedRecord) return;

    if (dirty) {
      setError("Save the latest changes before exporting the report.");

      return;
    }

    if (!selectedRecord.aiReviewed || !selectedRecord.aiSuggestion.trim()) {
      setError("Approve the counselling report before exporting it.");

      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError("Allow pop-ups to open the printable report.");

      return;
    }

    printWindow.document.open();

    printWindow.document.write(buildPrintableHtml(selectedRecord));

    printWindow.document.close();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071A45] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              <Sparkles size={15} />
              SmartIQ Institute
            </div>

            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              Career Counselling
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Manage student enquiries, assess academic strengths and interests,
              and prepare personalised career guidance reports.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#0B40A1] shadow-sm transition hover:bg-blue-50"
          >
            <Plus size={17} />
            New Counselling Enquiry
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS */}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700"
        >
          {success}
        </div>
      ) : null}

      {!showForm ? (
        <>
          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              {
                label: "Total Enquiries",
                value: stats.total,
                color: "text-blue-700",
              },
              {
                label: "New Enquiries",
                value: stats.new,
                color: "text-violet-700",
              },
              {
                label: "In Progress",
                value: stats.progress,
                color: "text-amber-700",
              },
              {
                label: "Completed",
                value: stats.completed,
                color: "text-emerald-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>

                <p className={`mt-3 text-3xl font-black ${item.color}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* RECORD DIRECTORY */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Counselling Enquiries
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View and update student career counselling records.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                className={SECONDARY_BUTTON}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, parent, class, career or counsellor..."
                  className={`${INPUT_CLASS} pl-11`}
                />
              </div>

              {loading ? (
                <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
                  <Loader2 size={20} className="animate-spin" />
                  Loading enquiries...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <ClipboardList size={42} className="text-blue-300" />

                  <h3 className="mt-4 text-lg font-black text-slate-800">
                    No counselling enquiries found
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a new counselling enquiry to get started.
                  </p>

                  <button
                    type="button"
                    onClick={openNewForm}
                    className={`${PRIMARY_BUTTON} mt-5`}
                  >
                    <Plus size={16} />
                    Create Enquiry
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  {filteredRecords.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#0B40A1]">
                            <UserRound size={23} />
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900">
                              {record.studentName}
                            </h3>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {record.classLevel}

                              {record.board ? ` • ${record.board}` : ""}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              Career Interest:{" "}
                              {record.careerGoal || "Exploring options"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Created by{" "}
                              {record.createdByName || "Institute Staff"}
                              {" • "}
                              {formatDate(record.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0B40A1]">
                            {formatStatus(record.status)}
                          </span>

                          {record.aiReviewed ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              AI Reviewed
                            </span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => openRecord(record)}
                            className={PRIMARY_BUTTON}
                          >
                            View / Edit
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void deleteCareerEnquiry(record)}
                              disabled={deletingId !== null}
                              aria-label={`Delete career counselling enquiry for ${record.studentName}`}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === record.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}

                              {deletingId === record.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* FORM NAVIGATION */}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                if (dirty && !window.confirm("Discard unsaved changes?")) {
                  return;
                }

                setShowForm(false);
                setError("");
                setSuccess("");
              }}
              className={SECONDARY_BUTTON}
            >
              <ArrowLeft size={16} />
              Back to Enquiries
            </button>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#0B40A1]">
              {selectedRecord
                ? "Edit Counselling Enquiry"
                : "New Counselling Enquiry"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1 */}

            <Section
              number="01"
              title="Student Information"
              description="Basic academic and personal information about the student."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Student Full Name"
                  required
                  value={form.studentName}
                  onChange={(value) => updateString("studentName", value)}
                  placeholder="Enter student's full name"
                />

                <Field
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(value) => updateString("dateOfBirth", value)}
                />

                <SelectField
                  label="Current Class / Education Level"
                  required
                  value={form.classLevel}
                  options={CLASS_OPTIONS}
                  onChange={(value) => {
                    setForm((previous) => ({
                      ...previous,
                      classLevel: value,
                      strongSubjects: [],
                      weakSubjects: [],
                    }));

                    setDirty(true);
                    setSuccess("");
                  }}
                />

                <SelectField
                  label="Education Board"
                  value={form.board}
                  options={BOARD_OPTIONS}
                  onChange={(value) => {
                    setForm((previous) => ({
                      ...previous,
                      board: value,
                      strongSubjects: [],
                      weakSubjects: [],
                    }));

                    setDirty(true);
                    setSuccess("");
                  }}
                />

                <Field
                  label="School / College Name"
                  value={form.school}
                  onChange={(value) => updateString("school", value)}
                />

                <Field
                  label="City"
                  value={form.city}
                  onChange={(value) => updateString("city", value)}
                />
              </div>
            </Section>

            {/* SECTION 2 */}

            <Section
              number="02"
              title="Student & Parent Contact"
              description="Contact details for counselling and follow-up communication."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Student Phone Number"
                  value={form.studentPhone}
                  onChange={(value) => updateString("studentPhone", value)}
                />

                <Field
                  label="Parent / Guardian Name"
                  value={form.parentName}
                  onChange={(value) => updateString("parentName", value)}
                />

                <Field
                  label="Parent / Customer WhatsApp"
                  required
                  value={form.parentWhatsapp}
                  onChange={(value) => updateString("parentWhatsapp", value)}
                  placeholder="+91 9876543210"
                />

                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateString("email", value)}
                />
              </div>
            </Section>

            {/* SECTION 3 */}

            <Section
              number="03"
              title="Academic Assessment"
              description="Identify the student's academic strengths and subjects that need additional support."
            >
              <div className="space-y-6">
                <Field
                  label="Overall Academic Percentage / CGPA"
                  value={form.academicPercentage}
                  onChange={(value) =>
                    updateString("academicPercentage", value)
                  }
                  placeholder="e.g. 82% or 8.2 CGPA"
                />

                <MultiSelect
                  label="Strong Subjects"
                  options={availableSubjects}
                  selected={form.strongSubjects}
                  onChange={(values) => updateArray("strongSubjects", values)}
                />

                <MultiSelect
                  label="Weak Subjects / Areas for Improvement"
                  options={availableSubjects}
                  selected={form.weakSubjects}
                  onChange={(values) => updateArray("weakSubjects", values)}
                />

                <SelectField
                  label="Preferred Learning Style"
                  value={form.preferredLearningStyle}
                  options={[
                    "Practical / Hands-on",
                    "Theory / Reading",
                    "Visual Learning",
                    "Project-based Learning",
                    "Interactive Classes",
                    "Mixed Learning",
                    "Not Sure",
                  ]}
                  onChange={(value) =>
                    updateString("preferredLearningStyle", value)
                  }
                />
              </div>
            </Section>

            {/* SECTION 4 */}

            <Section
              number="04"
              title="Interests & Career Preferences"
              description="Understand the student's interests, ambitions and preferred future pathways."
            >
              <div className="space-y-6">
                <MultiSelect
                  label="Student Interests"
                  options={INTEREST_OPTIONS}
                  selected={form.interests}
                  onChange={(values) => updateArray("interests", values)}
                />

                <Field
                  label="Current Career Goal"
                  value={form.careerGoal}
                  onChange={(value) => updateString("careerGoal", value)}
                  placeholder="e.g. Engineer, Doctor, IAS Officer, Entrepreneur"
                />

                <SelectField
                  label="Preferred Stream"
                  value={form.preferredStream}
                  options={[
                    "Science - PCM",
                    "Science - PCB",
                    "Science - PCMB",
                    "Commerce",
                    "Arts / Humanities",
                    "Vocational",
                    "Undecided",
                    "Not Applicable",
                  ]}
                  onChange={(value) => updateString("preferredStream", value)}
                />

                <MultiSelect
                  label="Entrance Exam Interests"
                  options={EXAM_OPTIONS}
                  selected={form.examInterests}
                  onChange={(values) => updateArray("examInterests", values)}
                />

                <TextAreaField
                  label="Parent / Guardian Expectations"
                  value={form.parentExpectations}
                  onChange={(value) =>
                    updateString("parentExpectations", value)
                  }
                  placeholder="What does the parent expect from the student's career?"
                />
              </div>
            </Section>

            {/* SECTION 5 */}

            <Section
              number="05"
              title="Counsellor Assessment"
              description="Record your professional observations and follow-up plan."
            >
              <div className="space-y-5">
                <TextAreaField
                  label="Student Challenges"
                  value={form.challenges}
                  onChange={(value) => updateString("challenges", value)}
                  placeholder="Academic difficulties, uncertainty about career choices, study habits..."
                />

                <TextAreaField
                  label="Counsellor Observations"
                  value={form.counsellorNotes}
                  onChange={(value) => updateString("counsellorNotes", value)}
                  rows={5}
                  placeholder="Write your assessment and important discussion points..."
                />

                <MultiSelect
                  label="Suggested SmartIQ Programs"
                  options={[
                    "Regular Academic",
                    "JEE Foundation",
                    "NEET Foundation",
                    "JEE Preparation",
                    "NEET Preparation",
                    "MHT-CET",
                    "CUET",
                    "UPSC Foundation",
                    "Career Counselling",
                    "Spoken English",
                    "Personality Development",
                    "Coding",
                    "Robotics",
                    "AI Basics",
                    "Skill Development",
                  ]}
                  selected={form.recommendedPrograms}
                  onChange={(values) =>
                    updateArray("recommendedPrograms", values)
                  }
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Follow-up Date"
                    type="date"
                    value={form.followUpDate}
                    onChange={(value) => updateString("followUpDate", value)}
                  />

                  <div>
                    <label className={LABEL_CLASS}>Enquiry Status</label>

                    <select
                      value={form.status}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                        setForm((previous) => ({
                          ...previous,

                          status: event.target.value as CareerStatus,
                        }));

                        setDirty(true);
                      }}
                      className={INPUT_CLASS}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* SECTION 6 */}

            <Section
              number="06"
              title="Consent & Communication"
              description="Record permission before using AI analysis or sharing a counselling report."
            >
              <div className="space-y-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.aiConsent}
                    onChange={(event) =>
                      updateBoolean("aiConsent", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-blue-700"
                  />

                  <span className="text-sm leading-6 text-slate-700">
                    The student or parent has agreed to the use of relevant
                    academic information for AI-assisted career guidance.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.whatsappConsent}
                    onChange={(event) =>
                      updateBoolean("whatsappConsent", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-blue-700"
                  />

                  <span className="text-sm leading-6 text-slate-700">
                    The customer has agreed to receive the counselling summary
                    through WhatsApp.
                  </span>
                </label>
              </div>
            </Section>

            {/* SAVE BUTTON */}

            <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <button
                type="submit"
                disabled={saving}
                className={PRIMARY_BUTTON}
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {saving
                  ? "Saving..."
                  : selectedRecord
                    ? "Save Changes"
                    : "Save Counselling Enquiry"}
              </button>
            </div>
          </form>

          {/* AI GUIDANCE */}

          <Section
            number="07"
            title="AI Career Guidance"
            description="Generate draft suggestions, review them and share the approved report with the customer."
          >
            <div className="space-y-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Sparkles size={22} className="shrink-0 text-[#0B40A1]" />

                  <div>
                    <h3 className="font-black text-slate-900">
                      SmartIQ AI Career Assistant
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      AI will examine the recorded academic strengths,
                      improvement areas, interests and career preferences to
                      prepare possible career pathways for counsellor review.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void generateAI()}
                disabled={
                  !selectedRecord ||
                  dirty ||
                  !form.aiConsent ||
                  generating ||
                  saving
                }
                className={PRIMARY_BUTTON}
              >
                {generating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Sparkles size={17} />
                )}

                {generating
                  ? "Generating AI Guidance..."
                  : "Generate AI Career Suggestions"}
              </button>

              {!selectedRecord ? (
                <p className="text-xs font-semibold text-amber-700">
                  Save the enquiry first to enable AI guidance.
                </p>
              ) : dirty ? (
                <p className="text-xs font-semibold text-amber-700">
                  Save your latest changes before generating guidance.
                </p>
              ) : null}

              <TextAreaField
                label="AI Career Guidance Report"
                value={aiSuggestion}
                rows={16}
                onChange={(value) => {
                  setAiSuggestion(value);

                  setDirty(true);

                  setSuccess("");
                }}
                placeholder="The AI-generated report will appear here. You may also write or edit the guidance manually."
              />

              {selectedRecord?.aiReviewed && !dirty ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={18} />
                  Reviewed and approved for customer sharing
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void approveAI()}
                  disabled={
                    !selectedRecord ||
                    !aiSuggestion.trim() ||
                    dirty ||
                    reviewing ||
                    saving
                  }
                  className={PRIMARY_BUTTON}
                >
                  {reviewing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve Career Guidance
                </button>

                <button
                  type="button"
                  onClick={printReport}
                  disabled={!selectedRecord?.aiReviewed || dirty}
                  className={SECONDARY_BUTTON}
                >
                  <Download size={16} />
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={sendWhatsApp}
                  disabled={
                    !selectedRecord?.aiReviewed ||
                    !selectedRecord.whatsappConsent ||
                    dirty
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle size={17} />
                  Send on WhatsApp
                </button>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                WhatsApp opens with the report prepared for the customer's
                number. The staff member confirms sending the message. For PDF,
                select Save as PDF from the browser's print dialog.
              </p>
            </div>
          </Section>

          {/* END FORM */}
        </>
      )}
    </div>
  );
}
