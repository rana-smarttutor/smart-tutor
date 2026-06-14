"use client";

import { useEffect, useState } from "react";

import type { LectureItem, ManagedUser, Role } from "@/lib/types";

type LectureManagerProps = {
  role: Role;
  lectures: LectureItem[];
  studentDirectory: ManagedUser[];
};

type SelectOption = {
  label: string;
  value: string;
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const checkboxLabelClass =
  "flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-bold text-[var(--color-heading)] shadow-sm";

const statusOptions: SelectOption[] = [
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative space-y-2">
      <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
        {label}
      </span>
      {children}
    </div>
  );
}

const fallbackDropdownTheme = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  borderColor: "#cbd5e1",
};

type DropdownTheme = typeof fallbackDropdownTheme;

function parseColor(color: string) {
  const value = color.trim();

  if (value.startsWith("#")) {
    const hex = value.replace("#", "");

    if (hex.length === 3) {
      return hex.split("").map((char) => parseInt(char + char, 16));
    }

    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  const match = value.match(/rgba?\(([^)]+)\)/);

  if (!match) return null;

  const parts = match[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if (parts.some((part) => Number.isNaN(part))) return null;

  return parts;
}

function getLuminance(color: string) {
  const rgb = parseColor(color);

  if (!rgb) return 0;

  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readCssVariable(name: string) {
  if (typeof window === "undefined") return "";

  const rootValue = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (rootValue) return rootValue;

  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function getDropdownTheme(): DropdownTheme {
  if (typeof window === "undefined") {
    return fallbackDropdownTheme;
  }

  const headingColor =
    readCssVariable("--color-heading") ||
    getComputedStyle(document.body).color ||
    fallbackDropdownTheme.color;

  const borderColor =
    readCssVariable("--color-border") || fallbackDropdownTheme.borderColor;

  const isDarkTheme = getLuminance(headingColor) > 0.55;

  return {
    backgroundColor: isDarkTheme ? "#020617" : "#ffffff",
    color: headingColor,
    borderColor,
  };
}

function useDropdownTheme() {
  const [theme, setTheme] = useState<DropdownTheme>(fallbackDropdownTheme);

  useEffect(() => {
    function updateTheme() {
      setTheme(getDropdownTheme());
    }

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  small = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownTheme = useDropdownTheme();

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <div className={`relative ${open ? "z-[9999]" : "z-30"}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={dropdownTheme}
        className={`flex w-full items-center justify-between gap-3 border text-left font-semibold shadow-sm outline-none transition hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
          small
            ? "rounded-xl px-3 py-2 text-sm"
            : "rounded-2xl px-4 py-3 text-sm"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-xs opacity-70">▾</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          />

          <div
            style={dropdownTheme}
            className="absolute left-0 top-full z-[9999] mt-1 w-full overflow-hidden rounded-xl border shadow-2xl"
          >
            <div className="max-h-44 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={
                      isSelected
                        ? undefined
                        : { color: dropdownTheme.color }
                    }
                    className={`block w-full px-4 py-3 text-left text-sm font-semibold transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-500/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function LectureManager({
  role,
  lectures,
  studentDirectory,
}: LectureManagerProps) {
  const canEdit = role === "admin" || role === "educator";

  const [items, setItems] = useState(lectures);
  const [title, setTitle] = useState("Live Class");
  const [subject, setSubject] = useState("");
  const [batchName, setBatchName] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [materialLink, setMaterialLink] = useState("");
  const [status, setStatus] = useState<LectureItem["status"]>("scheduled");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  async function createLecture() {
    if (!canEdit || !title || !startsAt) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subject,
          batchName,
          description,
          startsAt,
          endsAt,
          meetingLink,
          recordingLink,
          materialLink,
          assignedStudentIds: selectedStudentIds,
          status,
        }),
      });

      const payload = await response.json();

      if (response.ok && payload.lecture) {
        setItems((current) => [payload.lecture, ...current]);
        setTitle("Live Class");
        setSubject("");
        setBatchName("");
        setDescription("");
        setStartsAt("");
        setEndsAt("");
        setMeetingLink("");
        setRecordingLink("");
        setMaterialLink("");
        setStatus("scheduled");
        setSelectedStudentIds([]);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function updateLectureStatus(
    lectureId: string,
    nextStatus: LectureItem["status"],
  ) {
    if (!canEdit) return;

    const lecture = items.find((item) => item.id === lectureId);

    if (!lecture) return;

    const optimisticLecture = {
      ...lecture,
      status: nextStatus,
    };

    setItems((current) =>
      current.map((item) => (item.id === lectureId ? optimisticLecture : item)),
    );

    await fetch(`/api/lectures/${lectureId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
      }),
    });
  }

  function formatDateTime(value: string) {
    if (!value) return "Not scheduled";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <section className="space-y-6">
      <div className="surface overflow-visible rounded-[2rem] p-6">
        <div className="flex flex-col gap-2">
          <p className="section-label">Lectures</p>
          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Live Classes & Recordings
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            {canEdit
              ? "Create live class schedules, meeting links, recordings, and study material links."
              : "View upcoming lectures, join live classes, and access recordings."}
          </p>
        </div>

        {canEdit ? (
          <div className="mt-6 grid overflow-visible gap-4 md:grid-cols-3">
            <FieldLabel label="Lecture Title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Live Class"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Subject">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Batch / Class">
              <input
                value={batchName}
                onChange={(event) => setBatchName(event.target.value)}
                placeholder="Batch / Class"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Start Time">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="End Time">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Lecture Status">
              <CustomSelect
                value={status}
                options={statusOptions}
                onChange={(nextStatus: string) =>
                  setStatus(nextStatus as LectureItem["status"])
                }
              />
            </FieldLabel>

            <FieldLabel label="Meeting Link">
              <input
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                placeholder="Google Meet / Zoom link"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Recording Link">
              <input
                value={recordingLink}
                onChange={(event) => setRecordingLink(event.target.value)}
                placeholder="Recording link"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Material Link">
              <input
                value={materialLink}
                onChange={(event) => setMaterialLink(event.target.value)}
                placeholder="Notes / material link"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Lecture Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Lecture description"
                className={`${fieldClass} min-h-24 md:col-span-3`}
              />
            </FieldLabel>

            <div className="surface-soft rounded-2xl border border-[var(--color-border)] p-4 md:col-span-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-black text-[var(--color-heading)]">
                  Assign Students
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Leave all unchecked to make this lecture visible to all
                  students.
                </p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {studentDirectory.length ? (
                  studentDirectory.map((student) => (
                    <label key={student.id} className={checkboxLabelClass}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {student.name}
                    </label>
                  ))
                ) : (
                  <p className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-3 text-sm font-semibold text-[var(--color-heading)] sm:col-span-2 lg:col-span-3">
                    No students found. Add students first, or leave this lecture
                    unassigned.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={createLecture}
              disabled={isSaving || !startsAt}
              className="action-button px-5 py-3 md:col-span-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Creating..." : "Create Lecture"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.length ? (
          items.map((lecture) => (
            <div
              key={lecture.id}
              className="surface overflow-visible rounded-[2rem] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[var(--color-heading)]">
                    {lecture.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    {lecture.subject || "General"}
                    {lecture.batchName ? ` • ${lecture.batchName}` : ""}
                  </p>
                </div>

                {canEdit ? (
                  <div className="min-w-36">
                    <CustomSelect
                      value={lecture.status}
                      options={statusOptions}
                      small
                      onChange={(nextStatus: string) =>
                        updateLectureStatus(
                          lecture.id,
                          nextStatus as LectureItem["status"],
                        )
                      }
                    />
                  </div>
                ) : (
                  <span className="pill capitalize">{lecture.status}</span>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Starts
                  </p>
                  <p className="mt-1 text-sm font-black text-[var(--color-heading)]">
                    {formatDateTime(lecture.startsAt)}
                  </p>
                </div>

                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Ends
                  </p>
                  <p className="mt-1 text-sm font-black text-[var(--color-heading)]">
                    {lecture.endsAt ? formatDateTime(lecture.endsAt) : "—"}
                  </p>
                </div>
              </div>

              {lecture.description ? (
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                  {lecture.description}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                {lecture.meetingLink ? (
                  <a
                    href={lecture.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="action-button px-5 py-3 text-sm"
                  >
                    Join Lecture
                  </a>
                ) : null}

                {lecture.recordingLink ? (
                  <a
                    href={lecture.recordingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                  >
                    Watch Recording
                  </a>
                ) : null}

                {lecture.materialLink ? (
                  <a
                    href={lecture.materialLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                  >
                    Open Material
                  </a>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="surface-soft rounded-[2rem] border border-[var(--color-border)] p-10 text-center lg:col-span-2">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              No lectures yet
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canEdit
                ? "Create your first lecture schedule above."
                : "Upcoming live classes and recordings will appear here."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}