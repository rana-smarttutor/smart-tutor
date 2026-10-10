"use client";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { CareerCounsellingWizard } from "@/components/career-counselling-wizard";
import { CareerCounsellingQuestionnaireEditor } from "@/components/career-counselling-questionnaire-editor";
import { CareerAssessmentTest } from "@/components/career-assessment-test";
import {
  careerReportHtml,
  type ReportAssessment,
} from "@/lib/career-counselling-report";

import { CareerCounsellingWhatsAppShare } from "@/components/career-counselling-whatsapp-share";
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
  questionnaire?: unknown;
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
const PROGRAM_OPTIONS = [
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
];
const STATUS_OPTIONS: {
  value: CareerStatus;
  label: string;
}[] = [
  {
    value: "new",
    label: "New Enquiry",
  },
  {
    value: "in-progress",
    label: "In Progress",
  },
  {
    value: "follow-up",
    label: "Follow-up",
  },
  {
    value: "completed",
    label: "Completed",
  },
];
const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white hover:bg-[#092F78] disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50";
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
function getCareerSubjects(
  classLevel: string,
  board: string,
  stream: string,
): string[] {
  const name = board.toLowerCase();
  if (["Class 6", "Class 7", "Class 8"].includes(classLevel)) {
    if (name.includes("maharashtra")) {
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
    if (name.includes("cbse")) {
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
    if (name.includes("icse")) {
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
    if (name.includes("cambridge") || name === "ib") {
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
  if (["Class 9", "Class 10"].includes(classLevel)) {
    if (name.includes("maharashtra")) {
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
    if (name.includes("cbse")) {
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
    if (name.includes("icse")) {
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
    return Array.from(
      new Set([...SCIENCE_SUBJECTS, ...COMMERCE_SUBJECTS, ...ARTS_SUBJECTS]),
    );
  }
  return [];
}
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
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
      <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-black text-[#0B40A1]">
          {number}
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
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
  onChange: (next: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={INPUT}
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
function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${INPUT} resize-y leading-6`}
      />
    </label>
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
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }
  function addCustom() {
    const next = [...selected];
    for (const value of customValue
      .split(/[,;\n]+/)
      .map((v) => v.trim())
      .filter(Boolean)) {
      if (!next.some((v) => v.toLowerCase() === value.toLowerCase())) {
        next.push(value);
      }
    }
    onChange(next);
    setCustomValue("");
  }
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            aria-pressed={selected.includes(option)}
            onClick={() => toggle(option)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
              selected.includes(option)
                ? "border-blue-400 bg-blue-100 text-blue-800"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50"
            }`}
          >
            {selected.includes(option) ? "✓ " : "+ "}
            {option}
          </button>
        ))}
        {selected
          .filter((value) => !options.includes(value))
          .map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              title="Click to remove"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
            >
              ✓ {value} ×
            </button>
          ))}
      </div>
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
          className={INPUT}
        />
        <button type="button" onClick={addCustom} className={SECONDARY}>
          Add
        </button>
      </div>
    </div>
  );
}

export function CareerCounsellingManager() {
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [form, setForm] = useState<CareerDetails>(createEmptyForm);
  const [selectedRecord, setSelectedRecord] = useState<CareerRecord | null>(
    null,
  );
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [search, setSearch] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const availableSubjects = useMemo(
    () => getCareerSubjects(form.classLevel, form.board, form.preferredStream),
    [form.classLevel, form.board, form.preferredStream],
  );
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
        if (controller.signal.aborted) {
          return;
        }
        setRecords(Array.isArray(payload.records) ? payload.records : []);
        setCanDelete(payload.canDelete === true);
        setCanCreate(payload.canCreate === true);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load records.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    void loadRecords();
    return () => controller.abort();
  }, [refreshKey]);
  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return !needle
      ? records
      : records.filter((record) =>
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
            .includes(needle),
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
  function updateString(key: StringField, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setDirty(true);
    setSuccess("");
  }
  function updateArray(key: ArrayField, values: string[]) {
    setForm((previous) => ({
      ...previous,
      [key]: values,
    }));
    setDirty(true);
    setSuccess("");
  }
  function updateBoolean(key: "aiConsent" | "whatsappConsent", value: boolean) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setDirty(true);
    setSuccess("");
  }
  function openNewForm() {
    if (!canCreate) {
      setError("You do not have permission to create counselling enquiries.");
      return;
    }
    setSelectedRecord(null);
    setForm(createEmptyForm());
    setAiSuggestion("");
    setShowAssessment(false);
    setShowForm(false);
    setDirty(false);
    setError("");
    setSuccess("");
    setShowWizard(true);
  }
  function openRecord(record: CareerRecord, resetAssessment = true) {
    if (resetAssessment) {
      setShowAssessment(false);
    }
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
    const merged: CareerRecord = {
      ...record,
      questionnaire:
        record.questionnaire ??
        (selectedRecord?.id === record.id
          ? selectedRecord.questionnaire
          : undefined),
    };

    setRecords((previous) =>
      previous.some((item) => item.id === merged.id)
        ? previous.map((item) =>
            item.id === merged.id
              ? {
                  ...merged,
                  questionnaire: merged.questionnaire ?? item.questionnaire,
                }
              : item,
          )
        : [merged, ...previous],
    );

    setSelectedRecord(merged);

    setForm({
      ...merged,
      strongSubjects: [...merged.strongSubjects],
      weakSubjects: [...merged.weakSubjects],
      interests: [...merged.interests],
      examInterests: [...merged.examInterests],
      recommendedPrograms: [...merged.recommendedPrograms],
    });

    setAiSuggestion(merged.aiSuggestion || "");
    setDirty(false);
    setError("");
    setShowForm(true);
  }

  async function saveRecord(reviewed = false): Promise<CareerRecord | null> {
    if (!selectedRecord && !canCreate) {
      setError("You do not have permission to create counselling entries.");
      return null;
    }
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
      const id = selectedRecord?.id;
      const response = await fetch(
        id
          ? `/api/career-counselling/${encodeURIComponent(id)}`
          : "/api/career-counselling",
        {
          method: id ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            questionnaire: undefined,
            aiSuggestion,
            aiReviewed: reviewed,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.record) {
        throw new Error(payload.error || "Unable to save record.");
      }
      const record = payload.record as CareerRecord;

      // Approval is valid only when the server confirms it was saved.
      if (reviewed && record.aiReviewed !== true) {
        throw new Error(
          "The report was saved, but the server did not confirm approval.",
        );
      }

      upsertRecord(record);
      setSuccess(
        reviewed
          ? "Career guidance reviewed and approved."
          : "Career counselling enquiry saved successfully.",
      );
      return record;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save record.",
      );
      return null;
    } finally {
      setSaving(false);
      setReviewing(false);
    }
  }
  async function saveQuestionnaire(questionnaire: unknown): Promise<void> {
    if (!selectedRecord) {
      throw new Error("Select a counselling record first.");
    }
    if (dirty || saving || generating || reviewing) {
      throw new Error(
        "Save any pending counselling changes before editing the questionnaire.",
      );
    }
    const response = await fetch(
      `/api/career-counselling/${encodeURIComponent(selectedRecord.id)}`,
      {
        method: "PATCH",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionnaire,
          updatedAt: selectedRecord.updatedAt,
        }),
      },
    );
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.record) {
      throw new Error(result?.error || "Unable to save questionnaire.");
    }
    const updatedRecord = result.record as CareerRecord;
    upsertRecord(updatedRecord);
    setSuccess("The student's questionnaire was updated successfully.");
  }
  async function deleteCareerEnquiry(record: CareerRecord) {
    if (!canDelete || deletingId) {
      return;
    }
    if (
      !window.confirm(
        `Permanently delete the career counselling enquiry for ${record.studentName}?
This action cannot be undone.`,
      )
    ) {
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
      setRecords((previous) =>
        previous.filter((item) => item.id !== record.id),
      );
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
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete counselling enquiry.",
      );
    } finally {
      setDeletingId(null);
    }
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
      setError("Record the student or parent's consent for AI analysis.");
      return;
    }
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/career-counselling/${encodeURIComponent(selectedRecord.id)}/ai`,
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
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "AI generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function approveAI() {
    if (!selectedRecord) {
      setError("Select a counselling enquiry first.");
      return;
    }

    if (!aiSuggestion.trim()) {
      setError("Generate or enter a report first.");
      return;
    }

    if (saving || generating || reviewing) {
      return;
    }

    setReviewing(true);
    setError("");
    setSuccess("");

    try {
      // Save edited report first.
      if (dirty) {
        const saved = await saveRecord(false);

        if (!saved) return;

        setSuccess(
          "Changes saved successfully. Review the saved report and click Approve Career Guidance again.",
        );
        return;
      }

      // Approve only already-saved content.
      const approved = await saveRecord(true);

      if (approved) {
        setSuccess(
          "Career guidance approved. PDF export and WhatsApp sharing are now available.",
        );
      }
    } finally {
      setReviewing(false);
    }
  }

  function sendWhatsApp() {
    if (
      !selectedRecord ||
      dirty ||
      !selectedRecord.aiReviewed ||
      !selectedRecord.aiSuggestion.trim()
    ) {
      setError("Save and approve the career guidance before sharing.");
      return;
    }

    if (!selectedRecord.whatsappConsent) {
      setError("Record WhatsApp sharing consent before sharing.");
      return;
    }

    setError("");
    setShowShare(true);
  }
  async function printReport() {
    if (
      !selectedRecord ||
      dirty ||
      !selectedRecord.aiReviewed ||
      !selectedRecord.aiSuggestion.trim()
    ) {
      setError("Save and approve the report before exporting it.");
      return;
    }

    // Open synchronously to avoid popup blocking.
    const popup = window.open("", "_blank");

    if (!popup) {
      setError("Allow pop-ups to open the printable report.");
      return;
    }

    popup.document.write(
      "<p style='padding:30px;font-family:Arial'>Preparing your SmartIQ report...</p>",
    );

    try {
      const response = await fetch(
        `/api/career-assessment?enquiryId=${encodeURIComponent(
          selectedRecord.id,
        )}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load saved assessment results.");
      }

      const data = await response.json();

      popup.document.open();

const reportHtml = careerReportHtml(
  {
    ...selectedRecord,
    questionnaire: selectedRecord.questionnaire,
  },
  data.session as ReportAssessment,
);

const logoUrl = new URL(
  "/smartiq-logo.png",
  window.location.origin,
).href;

popup.document.write(
  reportHtml.replaceAll(
    'src="/smartiq-logo.png"',
    `src="${logoUrl}"`,
  ),
);

      popup.document.close();

      popup.document.close();
    } catch (cause) {
      popup.close();

      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to prepare the report.",
      );
    }
  }
  // ============================================
  // NEW CAREER COUNSELLING FIVE-STEP WIZARD
  // ============================================
  if (showWizard) {
    return (
      <CareerCounsellingWizard
        onCancel={() => {
          setShowWizard(false);
          setError("");
        }}
        onSaved={() => {
          setShowWizard(false);
          setRefreshKey((previous) => previous + 1);
          setSuccess("Career counselling entry created successfully.");
        }}
      />
    );
  }
  // ============================================
  // EXISTING CAREER COUNSELLING DASHBOARD
  // ============================================
  return (
    <div className="space-y-6 pb-12">
      {showShare && selectedRecord && (
        <CareerCounsellingWhatsAppShare
          record={selectedRecord}
          onClose={() => setShowShare(false)}
        />
      )}
      {/* HEADER */}
      <section className="rounded-2xl bg-gradient-to-r from-[#071A45] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              <Sparkles size={15} />
              SmartIQ Institute
            </p>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              Career Counselling
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Manage student enquiries, assess strengths and prepare
              personalised career guidance reports.
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={openNewForm}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#0B40A1] hover:bg-blue-50"
            >
              <Plus size={17} />
              New Counselling Enquiry
            </button>
          )}
        </div>
      </section>
      {/* NOTIFICATIONS */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700"
        >
          {success}
        </div>
      )}
      {!showForm ? (
        <>
          {/* DASHBOARD STATISTICS */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              {
                label: "Total Enquiries",
                value: stats.total,
              },
              {
                label: "New Enquiries",
                value: stats.new,
              },
              {
                label: "In Progress",
                value: stats.progress,
              },
              {
                label: "Completed",
                value: stats.completed,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-black text-[#0B40A1]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {/* ENQUIRY DIRECTORY */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-black">Counselling Enquiries</h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and update student counselling records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                className={SECONDARY}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <div className="p-5">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-4 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, parent, class, career or counsellor..."
                  className={`${INPUT} pl-11`}
                />
              </div>
              {loading ? (
                <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={20} />
                  Loading enquiries...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <ClipboardList size={42} className="text-blue-300" />
                  <h3 className="mt-4 text-lg font-black">
                    No counselling enquiries found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {records.length
                      ? "Try a different search."
                      : "Create a new counselling enquiry to get started."}
                  </p>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={openNewForm}
                      className={`${PRIMARY} mt-5`}
                    >
                      <Plus size={16} />
                      Create Enquiry
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  {filteredRecords.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-xl border border-slate-200 p-5 hover:bg-blue-50/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-[#0B40A1]">
                            <UserRound size={23} />
                          </div>
                          <div>
                            <h3 className="font-black">{record.studentName}</h3>
                            <p className="mt-1 text-xs text-slate-500">
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
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0B40A1]">
                            {
                              STATUS_OPTIONS.find(
                                (item) => item.value === record.status,
                              )?.label
                            }
                          </span>
                          {record.aiReviewed && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              AI Reviewed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openRecord(record)}
                            className={PRIMARY}
                          >
                            View / Edit
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              disabled={deletingId !== null}
                              onClick={() => void deleteCareerEnquiry(record)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
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
              className={SECONDARY}
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
          {/* COMPLETE SAVED QUESTIONNAIRE */}
          {selectedRecord && (
            <CareerCounsellingQuestionnaireEditor
              key={selectedRecord.id}
              questionnaire={selectedRecord.questionnaire}
              onSave={saveQuestionnaire}
            />
          )}
          {/* CAREER APTITUDE & INTEREST ASSESSMENT */}
          {selectedRecord && (
            <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-100 bg-blue-50 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    SmartIQ Career Assessment
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-[#0B1F4B]">
                    Aptitude & Interest Assessment
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Complete 25 aptitude questions and 18 career interest
                    statements. Assessment results are linked to this student's
                    counselling enquiry.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-800">
                      25 Aptitude Questions
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-800">
                      18 Interest Statements
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-800">
                      45 Minutes
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={dirty || saving || generating || reviewing}
                  onClick={() => setShowAssessment((current) => !current)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#092F78] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showAssessment ? "Hide Assessment" : "Open Assessment"}
                </button>
              </div>
              {showAssessment && (
                <div className="p-4 sm:p-6">
                  <CareerAssessmentTest
                    key={selectedRecord.id}
                    enquiryId={selectedRecord.id}
                  />
                </div>
              )}
              {!showAssessment && (
                <div className="border-t border-slate-100 p-4 text-sm text-slate-500 sm:px-6">
                  Open the assessment to start, resume, or review the student's
                  results. Results require counsellor interpretation.
                </div>
              )}
            </section>
          )}
          {/* EXISTING COUNSELLING EDITOR */}
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void saveRecord(false);
            }}
            className="space-y-6"
          >
            {/* STUDENT INFORMATION */}
            <Section
              number="01"
              title="Student Information"
              description="Basic personal and academic information."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Student Full Name"
                  required
                  value={form.studentName}
                  onChange={(v) => updateString("studentName", v)}
                />
                <Field
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(v) => updateString("dateOfBirth", v)}
                />
                <SelectField
                  label="Current Class / Education Level"
                  required
                  value={form.classLevel}
                  options={CLASS_OPTIONS}
                  onChange={(v) => {
                    setForm((old) => ({
                      ...old,
                      classLevel: v,
                      strongSubjects: [],
                      weakSubjects: [],
                    }));
                    setDirty(true);
                  }}
                />
                <SelectField
                  label="Education Board"
                  value={form.board}
                  options={BOARD_OPTIONS}
                  onChange={(v) => {
                    setForm((old) => ({
                      ...old,
                      board: v,
                      strongSubjects: [],
                      weakSubjects: [],
                    }));
                    setDirty(true);
                  }}
                />
                <Field
                  label="School / College Name"
                  value={form.school}
                  onChange={(v) => updateString("school", v)}
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => updateString("city", v)}
                />
              </div>
            </Section>
            {/* CONTACT DETAILS */}
            <Section
              number="02"
              title="Student & Parent Contact"
              description="Contact details for counselling and follow-up."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Student Phone Number"
                  value={form.studentPhone}
                  onChange={(v) => updateString("studentPhone", v)}
                />
                <Field
                  label="Parent / Guardian Name"
                  value={form.parentName}
                  onChange={(v) => updateString("parentName", v)}
                />
                <Field
                  label="Parent / Customer WhatsApp"
                  required
                  value={form.parentWhatsapp}
                  onChange={(v) => updateString("parentWhatsapp", v)}
                />
                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateString("email", v)}
                />
              </div>
            </Section>
            {/* ACADEMIC ASSESSMENT */}
            <Section
              number="03"
              title="Academic Assessment"
              description="Understand strengths and areas for improvement."
            >
              <Field
                label="Overall Academic Percentage / CGPA"
                value={form.academicPercentage}
                onChange={(v) => updateString("academicPercentage", v)}
              />
              <MultiSelect
                label="Strong Subjects"
                options={availableSubjects}
                selected={form.strongSubjects}
                onChange={(v) => updateArray("strongSubjects", v)}
              />
              <MultiSelect
                label="Weak Subjects / Areas for Improvement"
                options={availableSubjects}
                selected={form.weakSubjects}
                onChange={(v) => updateArray("weakSubjects", v)}
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
                onChange={(v) => updateString("preferredLearningStyle", v)}
              />
            </Section>
            {/* INTERESTS */}
            <Section
              number="04"
              title="Interests & Career Preferences"
              description="Understand interests, ambitions and preferred pathways."
            >
              <MultiSelect
                label="Student Interests"
                options={INTEREST_OPTIONS}
                selected={form.interests}
                onChange={(v) => updateArray("interests", v)}
              />
              <Field
                label="Current Career Goal"
                value={form.careerGoal}
                onChange={(v) => updateString("careerGoal", v)}
                placeholder="e.g. Engineer, Doctor, Entrepreneur"
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
                onChange={(v) => updateString("preferredStream", v)}
              />
              <MultiSelect
                label="Entrance Exam Interests"
                options={EXAM_OPTIONS}
                selected={form.examInterests}
                onChange={(v) => updateArray("examInterests", v)}
              />
              <TextAreaField
                label="Parent / Guardian Expectations"
                value={form.parentExpectations}
                onChange={(v) => updateString("parentExpectations", v)}
              />
            </Section>
            {/* COUNSELLOR ASSESSMENT */}
            <Section
              number="05"
              title="Counsellor Assessment"
              description="Professional observations and follow-up plan."
            >
              <TextAreaField
                label="Student Challenges"
                value={form.challenges}
                onChange={(v) => updateString("challenges", v)}
              />
              <TextAreaField
                label="Counsellor Observations"
                rows={5}
                value={form.counsellorNotes}
                onChange={(v) => updateString("counsellorNotes", v)}
              />
              <MultiSelect
                label="Suggested SmartIQ Programs"
                options={PROGRAM_OPTIONS}
                selected={form.recommendedPrograms}
                onChange={(v) => updateArray("recommendedPrograms", v)}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Follow-up Date"
                  type="date"
                  value={form.followUpDate}
                  onChange={(v) => updateString("followUpDate", v)}
                />
                <SelectField
                  label="Enquiry Status"
                  value={form.status}
                  options={STATUS_OPTIONS.map((s) => s.value)}
                  onChange={(v) => {
                    setForm((old) => ({
                      ...old,
                      status: v as CareerStatus,
                    }));
                    setDirty(true);
                  }}
                />
              </div>
            </Section>
            {/* CONSENT */}
            <Section
              number="06"
              title="Consent & Communication"
              description="Record permission before AI analysis or sharing."
            >
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={form.aiConsent}
                  onChange={(e) => updateBoolean("aiConsent", e.target.checked)}
                  className="mt-1 accent-blue-700"
                />
                The student or parent has agreed to AI-assisted career guidance.
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={form.whatsappConsent}
                  onChange={(e) =>
                    updateBoolean("whatsappConsent", e.target.checked)
                  }
                  className="mt-1 accent-blue-700"
                />
                The customer has agreed to receive the counselling report via
                WhatsApp.
              </label>
            </Section>
            {/* SAVE */}
            <div className="flex justify-end rounded-2xl border border-slate-200 bg-white p-5">
              <button type="submit" disabled={saving} className={PRIMARY}>
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
          {/* AI CAREER GUIDANCE */}
          <Section
            number="07"
            title="AI Career Guidance"
            description="Generate draft suggestions, review and share approved reports."
          >
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-black text-[#0B40A1]">
                <Sparkles size={20} />
                SmartIQ AI Career Assistant
              </div>
              <p className="mt-2 leading-6">
                AI examines the recorded academic strengths, improvement areas
                and interests for counsellor review.
              </p>
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
              className={PRIMARY}
            >
              <Sparkles size={17} />
              {generating
                ? "Generating AI Guidance..."
                : "Generate AI Career Suggestions"}
            </button>
            {!selectedRecord && (
              <p className="text-xs text-amber-700">
                Save the enquiry first to enable AI guidance.
              </p>
            )}
            <TextAreaField
              label="AI Career Guidance Report"
              rows={16}
              value={aiSuggestion}
              onChange={(value) => {
                setAiSuggestion(value);
                setDirty(true);
                setSuccess("");
              }}
              placeholder="The generated report will appear here. You may edit the guidance manually."
            />
            {selectedRecord?.aiReviewed && !dirty && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={18} />
                Reviewed and approved for sharing
              </p>
            )}
            {aiSuggestion.trim() && !selectedRecord?.aiReviewed && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Your AI career report has been generated. Review the text, then
                click "Approve Career Guidance" to enable PDF export and
                WhatsApp sharing.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void approveAI()}
                disabled={
                  !selectedRecord ||
                  !aiSuggestion.trim() ||
                  reviewing ||
                  saving ||
                  generating
                }
                className={PRIMARY}
              >
                <CheckCircle2 size={17} />
                {reviewing ? "Approving..." : "Approve Career Guidance"}
              </button>
              <button
                type="button"
                onClick={printReport}
                disabled={!selectedRecord?.aiReviewed || dirty}
                className={SECONDARY}
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
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <MessageCircle size={17} />
                Send on WhatsApp
              </button>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
