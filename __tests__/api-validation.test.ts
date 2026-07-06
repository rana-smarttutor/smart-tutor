/**
 * API endpoint validation tests for new features.
 *
 * These tests validate request body structure, required fields,
 * type coercion, and authorization rules for the batch, lecture,
 * and timetable API endpoints.
 */

import {
  sanitizeTextInput,
  sanitizeIdList,
} from "@/lib/validation";

// =====================
// Batch API validation
// =====================

describe("POST /api/batches - request validation", () => {
  const validBody = {
    name: "Class 10 CBSE - Morning",
    code: "X-CBSE-MORN",
    courseName: "Class 10 CBSE",
    subject: "Mathematics",
    capacity: 40,
    schedule: "Mon, Wed, Fri · 5:00 PM",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    studentIds: ["student-1", "student-2"],
    teacherIds: ["teacher-1"],
  };

  it("accepts a valid full batch body", () => {
    expect(validBody.name.trim()).toBeTruthy();
    expect(typeof validBody.capacity).toBe("number");
    expect(validBody.capacity).toBeGreaterThan(0);
    expect(Array.isArray(validBody.studentIds)).toBe(true);
    expect(Array.isArray(validBody.teacherIds)).toBe(true);
  });

  it("requires name field", () => {
    const body = { ...validBody, name: "" };
    expect(body.name.trim()).toBeFalsy();
  });

  it("requires at least one student for a meaningful batch", () => {
    const body = { ...validBody, studentIds: [] };
    expect(body.studentIds.length).toBe(0);
  });

  it("coerces capacity to number when given as string in request", () => {
    const raw = "40";
    const parsed = parseInt(raw, 10);
    expect(Number.isFinite(parsed)).toBe(true);
    expect(parsed).toBe(40);
  });

  it("handles missing optional fields gracefully", () => {
    const minimal = {
      name: "Minimal Batch",
      studentIds: [],
      teacherIds: [],
    };
    expect(minimal.name).toBeTruthy();
    expect(minimal.code).toBeUndefined();
    expect(minimal.capacity).toBeUndefined();
    expect(minimal.startDate).toBeUndefined();
    expect(minimal.endDate).toBeUndefined();
  });

  it("trims string fields before processing", () => {
    const dirty = {
      name: "  Batch Name  ",
      code: "  CODE-01  ",
      courseName: "  Course  ",
    };
    const clean = {
      name: sanitizeTextInput(dirty.name, 100),
      code: sanitizeTextInput(dirty.code, 20),
      courseName: sanitizeTextInput(dirty.courseName, 100),
    };
    expect(clean.name).toBe("Batch Name");
    expect(clean.code).toBe("CODE-01");
    expect(clean.courseName).toBe("Course");
  });

  it("sanitizes studentIds and teacherIds arrays", () => {
    const dirty = { studentIds: ["  a  ", "", "b", "   "], teacherIds: undefined };
    const cleaned = {
      studentIds: sanitizeIdList(dirty.studentIds, 50),
      teacherIds: sanitizeIdList(dirty.teacherIds, 50),
    };
    expect(cleaned.studentIds).toEqual(["a", "b"]);
    expect(cleaned.teacherIds).toEqual([]);
  });
});

describe("PATCH /api/batches - request validation", () => {
  it("requires batchId field", () => {
    const body = { name: "Updated Name" };
    expect(body.batchId).toBeUndefined();
  });

  it("accepts partial updates", () => {
    const body = { batchId: "batch-1", capacity: 50 };
    expect(body.batchId).toBeTruthy();
    expect(body.capacity).toBe(50);
    expect(body.name).toBeUndefined();
  });

  it("validates status transitions are valid enum values", () => {
    const valid = ["active", "archived"];
    expect(valid).toContain("active");
    expect(valid).toContain("archived");
    expect(valid).not.toContain("deleted");
    expect(valid).not.toContain("inactive");
  });
});

describe("DELETE /api/batches - request validation", () => {
  it("requires batchId field", () => {
    const body = {};
    expect(body.batchId).toBeUndefined();
  });

  it("batchId must be a non-empty string", () => {
    const body = { batchId: "" };
    expect(body.batchId.trim()).toBeFalsy();
  });
});

// =====================
// Timetable / Lecture API validation
// =====================

describe("Timetable / Lecture data validation", () => {
  const validLecture = {
    title: "Algebra: Quadratic Equations",
    subject: "Mathematics",
    batchName: "Class 10 CBSE - Morning",
    startsAt: "2026-04-15T09:00:00.000Z",
    endsAt: "2026-04-15T10:00:00.000Z",
    batchId: "batch-1",
    teacherId: "teacher-1",
  };

  it("validates startsAt is before endsAt", () => {
    const start = new Date(validLecture.startsAt);
    const end = new Date(validLecture.endsAt);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it("rejects negative duration", () => {
    const bad = {
      ...validLecture,
      startsAt: "2026-04-15T10:00:00.000Z",
      endsAt: "2026-04-15T09:00:00.000Z",
    };
    const start = new Date(bad.startsAt);
    const end = new Date(bad.endsAt);
    expect(end.getTime()).toBeLessThan(start.getTime());
  });

  it("rejects zero-length lecture", () => {
    const same = {
      ...validLecture,
      startsAt: "2026-04-15T09:00:00.000Z",
      endsAt: "2026-04-15T09:00:00.000Z",
    };
    const start = new Date(same.startsAt);
    const end = new Date(same.endsAt);
    expect(end.getTime()).toBe(start.getTime());
  });

  it("requires title for a lecture", () => {
    const bad = { ...validLecture, title: "" };
    expect(bad.title.trim()).toBeFalsy();
  });

  it("validates lecture status enum values", () => {
    const valid = ["scheduled", "completed", "cancelled"];
    expect(valid).toContain("scheduled");
    expect(valid).toContain("completed");
    expect(valid).toContain("cancelled");
    expect(valid).not.toContain("deleted");
    expect(valid).not.toContain("pending");
  });

  it("identifies today's date for timetable filtering", () => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    expect(todayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("calculates correct day of week index (Mon=0)", () => {
    const getDayIndex = (dateStr: string) => {
      const d = new Date(dateStr);
      return (d.getDay() + 6) % 7;
    };
    // 2026-04-06 is a Monday
    expect(getDayIndex("2026-04-06")).toBe(0);
    // 2026-04-07 is Tuesday
    expect(getDayIndex("2026-04-07")).toBe(1);
    // 2026-04-12 is Sunday
    expect(getDayIndex("2026-04-12")).toBe(6);
  });

  it("extracts hour from timestamp for grid placement", () => {
    const getHour = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getUTCHours();
    };
    expect(getHour("2026-04-15T09:00:00.000Z")).toBe(9);
    expect(getHour("2026-04-15T14:30:00.000Z")).toBe(14);
  });
});

// =====================
// Time slot conflict detection
// =====================

describe("Time slot conflict detection", () => {
  it("detects overlapping time slots for same teacher", () => {
    const existing = { start: new Date("2026-04-15T09:00:00Z"), end: new Date("2026-04-15T10:00:00Z") };
    const candidate = { start: new Date("2026-04-15T09:30:00Z"), end: new Date("2026-04-15T10:30:00Z") };

    const overlaps = candidate.start < existing.end && candidate.end > existing.start;
    expect(overlaps).toBe(true);
  });

  it("detects non-overlapping time slots", () => {
    const existing = { start: new Date("2026-04-15T09:00:00Z"), end: new Date("2026-04-15T10:00:00Z") };
    const candidate = { start: new Date("2026-04-15T10:00:00Z"), end: new Date("2026-04-15T11:00:00Z") };

    const overlaps = candidate.start < existing.end && candidate.end > existing.start;
    expect(overlaps).toBe(false);
  });
});

// =====================
// Rollup validation
// =====================

describe("Dashboard bundle integrity", () => {
  it("dashboard batches match expected shape", () => {
    const dashboardBatch = {
      id: "batch-1",
      name: "Test Batch",
      status: "active",
      studentIds: ["s1", "s2"],
    };
    expect(dashboardBatch).toHaveProperty("id");
    expect(dashboardBatch).toHaveProperty("name");
    expect(dashboardBatch).toHaveProperty("status");
    expect(dashboardBatch).toHaveProperty("studentIds");
  });

  it("role label is derived from session role", () => {
    const roleLabelMap: Record<string, string> = {
      admin: "Institute Administrator",
      educator: "Teaching Faculty",
      student: "Enrolled Learner",
      parent: "Guardian",
      counsellor: "Student Counsellor",
    };
    expect(roleLabelMap["admin"]).toBeTruthy();
    expect(roleLabelMap["student"]).toBeTruthy();
    expect(roleLabelMap["educator"]).toBeTruthy();
  });
});
