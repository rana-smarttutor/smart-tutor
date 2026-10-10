
"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Pencil,
  Save,
  X,
} from "lucide-react";

type SectionName =
  | "aboutYou"
  | "education"
  | "interests"
  | "routine";

type Questionnaire = {
  version: 1;
  aboutYou: Record<string, unknown>;
  education: Record<string, unknown>;
  interests: Record<string, unknown>;
  routine: Record<string, unknown>;
  consent: Record<string, unknown>;
};

type FieldDefinition = {
  key: string;
  label: string;
  multiline?: boolean;
};

type SectionDefinition = {
  id: SectionName;
  title: string;
  fields: FieldDefinition[];
};

const SECTIONS: SectionDefinition[] = [
  {
    id: "aboutYou",
    title: "1. About You",
    fields: [
      {
        key: "studentName",
        label: "Student Name",
      },
      {
        key: "dateOfBirth",
        label: "Date of Birth",
      },
      {
        key: "gender",
        label: "Gender",
      },
      {
        key: "mobile",
        label: "Student Mobile",
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "city",
        label: "City",
      },
      {
        key: "language",
        label: "Language",
      },
      {
        key: "guardianName",
        label: "Guardian Name",
      },
      {
        key: "guardianRelation",
        label: "Guardian Relationship",
      },
      {
        key: "guardianMobile",
        label: "Guardian Mobile",
      },
    ],
  },
  {
    id: "education",
    title: "2. Education",
    fields: [
      {
        key: "currentClass",
        label: "Current Class",
      },
      {
        key: "board",
        label: "Education Board",
      },
      {
        key: "institution",
        label: "School / College",
      },
      {
        key: "recentScore",
        label: "Recent Academic Score",
      },
      {
        key: "class10Score",
        label: "Class 10 Score",
      },
      {
        key: "class12Score",
        label: "Class 12 Score",
      },
      {
        key: "degree",
        label: "Degree / Qualification",
      },
      {
        key: "currentStream",
        label: "Current Stream",
      },
      {
        key: "tuition",
        label: "Tuition",
      },
      {
        key: "strongSubjects",
        label: "Strong Subjects",
      },
      {
        key: "weakSubjects",
        label: "Subjects Needing Support",
      },
      {
        key: "entranceExams",
        label: "Entrance Exams",
      },
    ],
  },
  {
    id: "interests",
    title: "3. Interests & Goals",
    fields: [
      {
        key: "areas",
        label: "Interest Areas",
      },
      {
        key: "careerGoal",
        label: "Career Goal",
      },
      {
        key: "preferredStream",
        label: "Preferred Stream",
      },
      {
        key: "learningStyle",
        label: "Learning Style",
      },
      {
        key: "hobbies",
        label: "Hobbies",
      },
      {
        key: "parentExpectations",
        label: "Parent Expectations",
        multiline: true,
      },
      {
        key: "constraints",
        label: "Practical Constraints",
        multiline: true,
      },
    ],
  },
  {
    id: "routine",
    title: "4. Routine & Study Habits",
    fields: [
      {
        key: "sleepHours",
        label: "Sleep Hours",
      },
      {
        key: "schoolHours",
        label: "School / College Hours",
      },
      {
        key: "selfStudyHours",
        label: "Self-Study Hours",
      },
      {
        key: "tuitionHours",
        label: "Tuition Hours",
      },
      {
        key: "screenHours",
        label: "Screen Hours",
      },
      {
        key: "physicalHours",
        label: "Physical Activity Hours",
      },
      {
        key: "focusMinutes",
        label: "Focus Minutes",
      },
      {
        key: "wakeTime",
        label: "Wake-Up Time",
      },
      {
        key: "bedtime",
        label: "Bedtime",
      },
      {
        key: "biggestObstacle",
        label: "Biggest Study Challenge",
        multiline: true,
      },
      {
        key: "preferredStudyTime",
        label: "Preferred Study Time",
      },
    ],
  },
];

const ARRAY_FIELDS = new Set([
  "strongSubjects",
  "weakSubjects",
  "entranceExams",
  "areas",
]);

function asObject(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalize(
  value: unknown,
): Questionnaire | null {
  const source = asObject(value);

  if (
    source.version !== 1 ||
    !source.aboutYou
  ) {
    return null;
  }

  return {
    version: 1,
    aboutYou: {
      ...asObject(source.aboutYou),
    },
    education: {
      ...asObject(source.education),
    },
    interests: {
      ...asObject(source.interests),
    },
    routine: {
      ...asObject(source.routine),
    },
    consent: {
      ...asObject(source.consent),
    },
  };
}

function displayValue(
  value: unknown,
): string {
  if (Array.isArray(value)) {
    return value
      .filter(
        (entry) =>
          typeof entry === "string",
      )
      .join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

export function CareerCounsellingQuestionnaireEditor({
  questionnaire,
  onSave,
}: {
  questionnaire: unknown;
  onSave: (
    questionnaire: Questionnaire,
  ) => Promise<void>;
}) {
  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [draft, setDraft] =
    useState<Questionnaire | null>(() =>
      normalize(questionnaire),
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    if (!editing) {
      setDraft(normalize(questionnaire));
    }
  }, [questionnaire, editing]);

  function updateField(
    section: SectionName,
    key: string,
    value: string,
  ) {
    if (!draft) return;

    const nextValue = ARRAY_FIELDS.has(key)
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : value;

    setDraft((previous) => {
      if (!previous) return null;

      return {
        ...previous,
        [section]: {
          ...previous[section],
          [key]: nextValue,
        },
      };
    });

    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    if (
      !window.confirm(
        "Discard changes to this questionnaire?",
      )
    ) {
      return;
    }

    setDraft(normalize(questionnaire));
    setEditing(false);
    setError("");
  }

  async function saveChanges() {
    if (!draft || saving) return;

    const studentName =
      String(
        draft.aboutYou.studentName ?? "",
      ).trim();

    if (studentName.length < 2) {
      setError(
        "Student name must contain at least two characters.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await onSave(draft);

      setEditing(false);
      setSuccess(
        "Questionnaire changes saved.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save questionnaire.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-bold text-amber-900">
          Questionnaire not available
        </h2>

        <p className="mt-2 text-sm text-amber-800">
          This enquiry does not have a saved
          five-step questionnaire.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-2xl border border-blue-200 bg-[#F5F8FF] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Student Questionnaire
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-[#0B1F4B]">
            {editing
              ? "Edit Submitted Questionnaire"
              : "Submitted Questionnaire"}
          </h2>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(normalize(questionnaire));
              setEditing(true);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Pencil size={16} />
            Edit Questionnaire
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {SECTIONS.map((section) => (
        <div
          key={section.id}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <h3 className="mb-4 text-base font-extrabold text-[#0B1F4B]">
            {section.title}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const value = displayValue(
                draft[section.id][field.key],
              );

              return (
                <label
                  key={field.key}
                  className="block"
                >
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {field.label}
                  </span>

                  {editing ? (
                    field.multiline ? (
                      <textarea
                        rows={3}
                        value={value}
                        disabled={saving}
                        onChange={(event) =>
                          updateField(
                            section.id,
                            field.key,
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                      />
                    ) : (
                      <input
                        type={
                          field.key ===
                          "dateOfBirth"
                            ? "date"
                            : "text"
                        }
                        value={value}
                        disabled={saving}
                        onChange={(event) =>
                          updateField(
                            section.id,
                            field.key,
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                      />
                    )
                  ) : (
                    <p className="min-h-11 rounded-lg bg-slate-50 px-3 py-3 text-sm font-medium text-slate-800">
                      {value || "Not provided"}
                    </p>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm text-slate-600">
        Consent fields are not editable here.
        Changes to consent must be recorded
        separately through an authorised
        consent workflow.
      </div>

      {editing && (
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            <X size={16} />
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void saveChanges()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Save size={16} />
            {saving
              ? "Saving..."
              : "Save Questionnaire"}
          </button>
        </div>
      )}
    </section>
  );
}
