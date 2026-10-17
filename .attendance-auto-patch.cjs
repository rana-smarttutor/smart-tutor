const fs = require("fs");
const path = require("path");

const root = process.cwd();

const files = {
  ui: "components/staff-lecture-attendance.tsx",
  report: "components/staff-attendance-manager.tsx",
  api: "app/api/lectures/[lectureId]/attendance/route.ts",
  store: "lib/data-store.ts",
  types: "lib/types.ts",
};

const original = {};
const output = {};

for (const [key, relative] of Object.entries(files)) {
  const fullPath = path.join(root, relative);

  original[key] = fs.readFileSync(fullPath, "utf8");
  output[key] = original[key];
}

function replaceOne(key, pattern, replacement, label) {
  const source = output[key];
  const matches = [...source.matchAll(
    new RegExp(pattern.source, pattern.flags.includes("g")
      ? pattern.flags
      : pattern.flags + "g")
  )];

  if (matches.length !== 1) {
    throw new Error(
      `${label}: expected exactly one match, found ${matches.length}. ` +
      "No project files have been written."
    );
  }

  output[key] = source.replace(pattern, replacement);
}

function replaceAllRequired(key, oldText, newText, label) {
  const count = output[key].split(oldText).length - 1;

  if (count < 1) {
    throw new Error(
      `${label}: source not found. No project files have been written.`
    );
  }

  output[key] = output[key].split(oldText).join(newText);
}

// ========================================================
// 1. TYPES: Add Leave to lecture attendance
// ========================================================

replaceAllRequired(
  "types",
  'lectureAttendanceStatus?: "present" | "absent" | "late";',
  'lectureAttendanceStatus?: "present" | "absent" | "late" | "leave";',
  "LectureItem status type"
);

// ========================================================
// 2. DATA STORE: Support Leave and calculate Present/Late
// ========================================================

replaceOne(
  "store",
  /attendanceStatus: "present" \| "absent" \| "late";/,
  'attendanceStatus: "present" | "absent" | "late" | "leave";',
  "Data-store attendance type"
);

replaceOne(
  "store",
  /if \(\s*status !== "present" &&\s*status !== "absent" &&\s*status !== "late"\s*\) \{\s*throw new Error\(\s*"Select Present, Absent or Late\.",\s*\);\s*\}/,
  `if (
    status !== "present" &&
    status !== "absent" &&
    status !== "late" &&
    status !== "leave"
  ) {
    throw new Error("Select a valid attendance status.");
  }`,
  "Data-store status validation"
);

replaceOne(
  "store",
  /if \(status !== "absent"\) \{\s*if \(checkInMs === null\)/,
  `if (status !== "absent" && status !== "leave") {
    if (checkInMs === null)`,
  "Data-store time validation"
);

replaceOne(
  "store",
  /const now = new Date\(\)\.toISOString\(\);\s*const setFields: Partial<LectureItem> = \{\s*lectureAttendanceStatus: status,/,
  `const scheduledStartMs = Date.parse(existing.startsAt);

  if (
    status !== "absent" &&
    status !== "leave" &&
    (!Number.isFinite(scheduledStartMs) || checkInMs === null)
  ) {
    throw new Error("Invalid scheduled or actual Check In time.");
  }

  const finalStatus =
    status === "absent" || status === "leave"
      ? status
      : checkInMs > scheduledStartMs
        ? "late"
        : "present";

  const now = new Date().toISOString();

  const setFields: Partial<LectureItem> = {
    lectureAttendanceStatus: finalStatus,`,
  "Data-store automatic classification"
);

replaceOne(
  "store",
  /if \(status === "absent"\) \{\s*unsetFields\.lectureCheckInAt/,
  `if (status === "absent" || status === "leave") {
    unsetFields.lectureCheckInAt`,
  "Data-store leave time clearing"
);

// ========================================================
// 3. API: Calculate status using scheduled lecture time
// ========================================================

replaceOne(
  "api",
  /type AttendanceStatus = "present" \| "absent" \| "late";/,
  'type AttendanceStatus = "present" | "absent" | "late" | "leave";',
  "API status type"
);

replaceOne(
  "api",
  /return value === "present" \|\| value === "absent" \|\| value === "late";/,
  'return value === "present" || value === "absent" || value === "late" || value === "leave";',
  "API status validation"
);

replaceOne(
  "api",
  /if \(!isAttendanceStatus\(body\.attendanceStatus\)\) \{\s*return errorResponse\("Select Present, Absent or Late\.", 400\);\s*\}/,
  `if (!isAttendanceStatus(body.attendanceStatus)) {
        return errorResponse(
          "Enter lecture times or select Absent / Leave.",
          400,
        );
      }`,
  "API missing status handling"
);

replaceOne(
  "api",
  /if \(attendanceStatus !== "absent"\) \{/,
  'if (attendanceStatus !== "absent" && attendanceStatus !== "leave") {',
  "API time validation for Leave"
);

replaceOne(
  "api",
  /try \{\s*updated = await saveLectureAttendanceTimes\(lectureId, \{\s*attendanceStatus,\s*checkInAt,\s*checkOutAt,\s*\}\);/,
  `const scheduledStartMs = Date.parse(lecture.startsAt);

      if (!Number.isFinite(scheduledStartMs)) {
        return errorResponse("Invalid scheduled lecture time.", 400);
      }

      const finalAttendanceStatus =
        attendanceStatus === "absent" || attendanceStatus === "leave"
          ? attendanceStatus
          : Date.parse(checkInAt) > scheduledStartMs
            ? "late"
            : "present";

      try {
        updated = await saveLectureAttendanceTimes(lectureId, {
          attendanceStatus: finalAttendanceStatus,
          checkInAt,
          checkOutAt,
        });`,
  "API automatic attendance status"
);

replaceOne(
  "api",
  /if \(lecture\.lectureAttendanceStatus === "absent"\) \{/,
  'if (lecture.lectureAttendanceStatus === "absent" || lecture.lectureAttendanceStatus === "leave") {',
  "API legacy actions protection"
);

// ========================================================
// 4. UI: Enable time inputs immediately
// ========================================================

replaceOne(
  "ui",
  /type AttendanceStatus = "" \| "present" \| "absent" \| "late";/,
  'type AttendanceStatus = "" | "present" | "absent" | "late" | "leave";',
  "UI attendance type"
);

replaceOne(
  "ui",
  /lectureAttendanceStatus\?: "present" \| "absent" \| "late";/,
  'lectureAttendanceStatus?: "present" | "absent" | "late" | "leave";',
  "UI lecture type"
);

replaceOne(
  "ui",
  /if \(lecture\.lectureAttendanceStatus === "absent"\) \{\s*return "Not Taken";\s*\}/,
  `if (lecture.lectureAttendanceStatus === "leave") {
    return "On Leave";
  }

  if (lecture.lectureAttendanceStatus === "absent") {
    return "Not Taken";
  }`,
  "UI Leave lecture state"
);

// Keep the saved selection in sync, but derive a new status
// whenever valid times are entered.
replaceOne(
  "ui",
  /function sameDraft\(a: TimeDraft, b: TimeDraft\) \{/,
  `function automaticAttendanceStatus(
  lecture: LectureWithAttendance,
  checkIn: string,
): AttendanceStatus {
  if (!checkIn) return "";

  const match = /^([01]\\\\d|2[0-3]):([0-5]\\\\d)$/.exec(checkIn);

  if (!match) return "";

  const lectureDate = istDate(lecture.startsAt);

  if (!lectureDate) return "";

  const actual = new Date(
    \`\${lectureDate}T\${checkIn}:00+05:30\`,
  ).getTime();

  const scheduled = Date.parse(lecture.startsAt);

  if (!Number.isFinite(actual) || !Number.isFinite(scheduled)) {
    return "";
  }

  return actual > scheduled ? "late" : "present";
}

function sameDraft(a: TimeDraft, b: TimeDraft) {`,
  "UI automatic status function"
);

// Replace the old three selectable radio options.
// The new cards allow manual Absent / Leave only.
replaceOne(
  "ui",
  /const ATTENDANCE_OPTIONS = \[[\s\S]*?\] as const;/,
  `const ATTENDANCE_OPTIONS = [
  {
    value: "absent",
    label: "Absent",
    description: "Faculty did not take the lecture",
    selected: "border-red-400 bg-red-50",
    labelColor: "text-red-600",
    radioColor: "accent-red-600",
  },
  {
    value: "leave",
    label: "Leave",
    description: "Faculty was on leave",
    selected: "border-violet-400 bg-violet-50",
    labelColor: "text-violet-700",
    radioColor: "accent-violet-600",
  },
] as const;`,
  "UI attendance options"
);

// Derive status when check-in changes.
replaceOne(
  "ui",
  /const current =\s*previous\[lectureId\] \?\?\s*\(lecture\s*\?\s*savedDraft\(lecture\)\s*:\s*\{\s*attendanceStatus: "" as const,\s*checkIn: "",\s*checkOut: "",\s*\}\);[\s\S]*?return \{\s*\.\.\.previous,\s*\[lectureId\]: \{\s*\.\.\.current,\s*\.\.\.changes,\s*\},\s*\};/,
  `const current =
          previous[lectureId] ??
          (lecture
            ? savedDraft(lecture)
            : {
                attendanceStatus: "" as const,
                checkIn: "",
                checkOut: "",
              });

        const next = {
          ...current,
          ...changes,
        };

        if (lecture && changes.checkIn !== undefined) {
          next.attendanceStatus = automaticAttendanceStatus(
            lecture,
            next.checkIn,
          );
        }

        return {
          ...previous,
          [lectureId]: next,
        };`,
  "UI automatic status updates"
);

// Allow check-in and check-out without preselecting Present.
replaceOne(
  "ui",
  /const canEditTimes =\s*canEdit &&\s*\(draft\.attendanceStatus === "present" \|\|\s*draft\.attendanceStatus === "late"\);/,
  `const canEditTimes =
              canEdit &&
              draft.attendanceStatus !== "absent" &&
              draft.attendanceStatus !== "leave";`,
  "UI immediate time editing"
);

replaceOne(
  "ui",
  /const duration =\s*draft\.attendanceStatus === "absent"\s*\? 0\s*:\s*minutesBetween\(draft\.checkIn, draft\.checkOut\);/,
  `const duration =
              draft.attendanceStatus === "absent" ||
              draft.attendanceStatus === "leave"
                ? 0
                : minutesBetween(draft.checkIn, draft.checkOut);`,
  "UI duration calculation"
);

// Permit manual Absent / Leave; Present / Late come from time.
replaceOne(
  "ui",
  /if \(\s*attendanceStatus !== "present" &&\s*attendanceStatus !== "absent" &&\s*attendanceStatus !== "late"\s*\) \{\s*setError\("Select Present, Absent or Late before saving\."\);\s*return;\s*\}/,
  `if (
      attendanceStatus !== "present" &&
      attendanceStatus !== "late" &&
      attendanceStatus !== "absent" &&
      attendanceStatus !== "leave"
    ) {
      setError("Enter Check In or select Absent / Leave.");
      return;
    }`,
  "UI save validation"
);

replaceAllRequired(
  "ui",
  'attendanceStatus === "absent" ? "" : draft.checkIn',
  '(attendanceStatus === "absent" || attendanceStatus === "leave") ? "" : draft.checkIn',
  "UI save check-in"
);

replaceAllRequired(
  "ui",
  'attendanceStatus === "absent" ? "" : draft.checkOut',
  '(attendanceStatus === "absent" || attendanceStatus === "leave") ? "" : draft.checkOut',
  "UI save check-out"
);

replaceOne(
  "ui",
  /if \(attendanceStatus !== "absent"\) \{/,
  'if (attendanceStatus !== "absent" && attendanceStatus !== "leave") {',
  "UI save time validation"
);

replaceOne(
  "ui",
  /if \(attendanceStatus === "absent" && lecture\.status === "completed"\) \{/,
  'if ((attendanceStatus === "absent" || attendanceStatus === "leave") && lecture.status === "completed") {',
  "UI completed lecture confirmation"
);

// Show automatic status above the two manual options.
replaceOne(
  "ui",
  /<div className="grid gap-2 sm:grid-cols-3">\s*\{ATTENDANCE_OPTIONS\.map/,
  `<div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-600">
                      Automatic Status:
                    </span>
                    <span className="font-bold text-[#0A54B7]">
                      {draft.attendanceStatus === "present"
                        ? "Present"
                        : draft.attendanceStatus === "late"
                          ? "Late"
                          : draft.attendanceStatus === "absent"
                            ? "Manually Absent"
                            : draft.attendanceStatus === "leave"
                              ? "Manually Leave"
                              : "Awaiting Check In"}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {ATTENDANCE_OPTIONS.map`,
  "UI automatic status display"
);

replaceOne(
  "ui",
  /option\.value === "absent"\s*\?\s*\{\s*attendanceStatus: "absent",\s*checkIn: "",\s*checkOut: "",\s*\}\s*:\s*\{\s*attendanceStatus: option\.value,\s*\}/,
  `checked
                                  ? {
                                      attendanceStatus: "",
                                      checkIn: "",
                                      checkOut: "",
                                    }
                                  : {
                                      attendanceStatus: option.value,
                                      checkIn: "",
                                      checkOut: "",
                                    }`,
  "UI manual attendance radio actions"
);

// Use blank check-in for Absent / Leave.
// A saved Leave entry must be clearly visible.
replaceOne(
  "ui",
  /draft\.attendanceStatus === "absent"\s*\?\s*"Faculty marked Absent"/,
  `draft.attendanceStatus === "absent"
                        ? "Faculty marked Absent"
                        : draft.attendanceStatus === "leave"
                          ? "Faculty marked Leave"`,
  "UI Leave confirmation"
);

// ========================================================
// 5. REPORTS: Recognise saved Leave records
// ========================================================

replaceOne(
  "report",
  /lectureAttendanceStatus\?: "present" \| "absent" \| "late";/,
  'lectureAttendanceStatus?: "present" | "absent" | "late" | "leave";',
  "Report lecture status type"
);

replaceOne(
  "report",
  /type FacultyAttendanceStatus =\s*\|\s*"present"\s*\|\s*"absent"\s*\|\s*"late"\s*\|\s*"partially present";/,
  `type FacultyAttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "leave"
  | "partially present";`,
  "Report faculty status type"
);

replaceOne(
  "report",
  /lateCount: number;\s*checkIn: string;/,
  `lateCount: number;
  leaveCount: number;
  checkIn: string;`,
  "Report leave count type"
);

replaceOne(
  "report",
  /case "pending":/,
  `case "leave":
    case "pending":`,
  "Report Leave badge colour"
);

replaceOne(
  "report",
  /function lectureStatusOf\(\s*lecture: LectureWithAttendance,\s*\): "present" \| "absent" \| "late" \| null \{/,
  `function lectureStatusOf(
  lecture: LectureWithAttendance,
): "present" | "absent" | "late" | "leave" | null {
  if (lecture.lectureAttendanceStatus === "leave") {
    return "leave";
  }`,
  "Report lecture status mapping"
);

replaceOne(
  "report",
  /const absentLectures = group\.lectures\.filter\(\s*\(lecture\) => lectureStatusOf\(lecture\) === "absent",\s*\);/,
  `const absentLectures = group.lectures.filter(
        (lecture) => lectureStatusOf(lecture) === "absent",
      );

      const leaveLectures = group.lectures.filter(
        (lecture) => lectureStatusOf(lecture) === "leave",
      );`,
  "Report Leave lecture grouping"
);

replaceOne(
  "report",
  /if \(!takenLectures\.length && !absentLectures\.length\) \{/,
  'if (!takenLectures.length && !absentLectures.length && !leaveLectures.length) {',
  "Report Leave-only entries"
);

replaceOne(
  "report",
  /const absentCount = absentLectures\.length;/,
  `const absentCount = absentLectures.length;
      const leaveCount = leaveLectures.length;`,
  "Report Leave counts"
);

replaceOne(
  "report",
  /if \(absentCount > 0 && takenLectures\.length > 0\) \{\s*attendanceStatus = "partially present";\s*\} else if \(absentCount > 0\) \{\s*attendanceStatus = "absent";\s*\} else if \(lateCount > 0\) \{\s*attendanceStatus = "late";\s*\} else \{\s*attendanceStatus = "present";\s*\}/,
  `if ((absentCount > 0 || leaveCount > 0) && takenLectures.length > 0) {
        attendanceStatus = "partially present";
      } else if (absentCount > 0) {
        attendanceStatus = "absent";
      } else if (leaveCount > 0) {
        attendanceStatus = "leave";
      } else if (lateCount > 0) {
        attendanceStatus = "late";
      } else {
        attendanceStatus = "present";
      }`,
  "Report aggregated status"
);

replaceOne(
  "report",
  /if \(!takenLectures\.length\) \{\s*lectureStatus = "not taken";/,
  `if (!takenLectures.length) {
        lectureStatus = leaveCount > 0 && absentCount === 0
          ? "on leave"
          : "not taken";`,
  "Report Leave lecture status"
);

replaceOne(
  "report",
  /presentCount,\s*absentCount,\s*lateCount,\s*checkIn: checkIns\[0\]/,
  `presentCount,
        absentCount,
        lateCount,
        leaveCount,
        checkIn: checkIns[0]`,
  "Report Leave output data"
);

// ========================================================
// WRITE: Only after every replacement succeeded
// ========================================================

for (const [key, relative] of Object.entries(files)) {
  const destination = path.join(root, relative);

  fs.writeFileSync(destination, output[key], "utf8");

  console.log("UPDATED:", relative);
}

console.log("");
console.log("Automatic faculty attendance patch completed.");
console.log("Run TypeScript and build checks next.");
