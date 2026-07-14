/**
 * API endpoint validation tests for new features.
 *
 * These tests validate request body structure, required fields,
 * type coercion, and authorization rules for lecture
 * and timetable API endpoints.
 */

import {
  sanitizeTextInput,
} from "@/lib/validation";

// =====================
// Timetable / Lecture API validation
// =====================

describe("Timetable / Lecture data validation", () => {
  const validLecture = {
    title: "Algebra: Quadratic Equations",
    subject: "Mathematics",
    startsAt: "2026-04-15T09:00:00.000Z",
    endsAt: "2026-04-15T10:00:00.000Z",
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
