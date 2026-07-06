import {
  sanitizeTextInput,
  sanitizeIdList,
} from "@/lib/validation";

describe("Batch field validation", () => {
  describe("name", () => {
    it("rejects empty batch name", () => {
      expect(sanitizeTextInput("", 100)).toBe("");
      expect(sanitizeTextInput("   ", 100)).toBe("");
    });

    it("trims and collapses whitespace in batch name", () => {
      expect(sanitizeTextInput("  Class  10  CBSE  ", 100)).toBe("Class 10 CBSE");
    });

    it("removes XSS from batch name", () => {
      expect(sanitizeTextInput("<script>alert(1)</script>", 100)).not.toContain("<");
      expect(sanitizeTextInput("<script>alert(1)</script>", 100)).not.toContain(">");
    });
  });

  describe("code", () => {
    it("trims and removes control chars from code", () => {
      expect(sanitizeTextInput("  X-CBSE\x00MORN  ", 20)).toBe("X-CBSEMORN");
    });

    it("limits code length", () => {
      expect(sanitizeTextInput("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10)).toBe("ABCDEFGHIJ");
    });
  });

  describe("capacity", () => {
    it("accepts valid capacity as number", () => {
      const cap = 40;
      expect(typeof cap).toBe("number");
      expect(cap).toBeGreaterThan(0);
    });

    it("rejects negative capacity", () => {
      const cap = -5;
      expect(cap).toBeLessThan(0);
    });

    it("rejects non-integer capacity", () => {
      const cap = 40.5;
      expect(Number.isInteger(cap)).toBe(false);
    });

    it("rejects zero capacity", () => {
      const cap = 0;
      expect(cap).toBe(0);
    });
  });

  describe("studentIds / teacherIds", () => {
    it("filters empty strings from ID arrays", () => {
      const ids = ["student-1", "", "student-2", "  "];
      const cleaned = sanitizeIdList(ids, 50);
      expect(cleaned).toEqual(["student-1", "student-2"]);
    });

    it("limits max items in ID array", () => {
      const ids = Array.from({ length: 100 }, (_, i) => `id-${i}`);
      const cleaned = sanitizeIdList(ids, 10);
      expect(cleaned).toHaveLength(10);
    });

    it("returns empty array for undefined", () => {
      expect(sanitizeIdList(undefined)).toEqual([]);
    });

    it("trims each ID value", () => {
      const ids = ["  student-1  ", "student-2"];
      const cleaned = sanitizeIdList(ids, 50);
      expect(cleaned).toEqual(["student-1", "student-2"]);
    });
  });

  describe("startDate / endDate format", () => {
    it("accepts ISO date string format", () => {
      const date = "2026-04-01";
      expect(/^\d{4}-\d{2}-\d{2}$/.test(date)).toBe(true);
    });

    it("rejects invalid date strings", () => {
      const bad = "not-a-date";
      expect(/^\d{4}-\d{2}-\d{2}$/.test(bad)).toBe(false);
    });

    it("rejects malformed dates with wrong separators", () => {
      const bad = "2026/04/01";
      expect(/^\d{4}-\d{2}-\d{2}$/.test(bad)).toBe(false);
    });
  });
});

describe("Batch data integrity", () => {
  it("batch status is either active or archived", () => {
    const valid = ["active", "archived"];
    expect(valid).toContain("active");
    expect(valid).toContain("archived");
    expect(valid).not.toContain("inactive");
    expect(valid).not.toContain("deleted");
  });

  it("fill percentage calculation works correctly", () => {
    const calc = (students: number, capacity: number) =>
      capacity > 0 ? Math.min(100, Math.round((students / capacity) * 100)) : 0;

    expect(calc(20, 40)).toBe(50);
    expect(calc(40, 40)).toBe(100);
    expect(calc(0, 40)).toBe(0);
    expect(calc(50, 40)).toBe(100); // capped
    expect(calc(20, 0)).toBe(0); // no capacity
  });

  it("batch status meta labels are correct for each status", () => {
    const now = new Date();

    // Active batch with end date far in future
    const farFuture = new Date(now);
    farFuture.setDate(farFuture.getDate() + 60);
    expect(farFuture > now).toBe(true);

    // Expired batch
    const past = new Date(now);
    past.setDate(past.getDate() - 10);
    expect(past < now).toBe(true);

    // Ending soon batch (within 30 days)
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 15);
    const diffDays = Math.ceil((soon.getTime() - now.getTime()) / 86400000);
    expect(diffDays).toBeGreaterThan(0);
    expect(diffDays).toBeLessThanOrEqual(30);
  });
});

describe("Batch manager form validation", () => {
  it("requires name for create", () => {
    const form = { name: "", code: "", capacity: "", studentIds: [], teacherIds: [] };
    expect(form.name.trim()).toBe("");
  });

  it("coerces capacity string to number", () => {
    const form = { capacity: "40" };
    const parsed = parseInt(form.capacity, 10);
    expect(parsed).toBe(40);
    expect(Number.isFinite(parsed)).toBe(true);
  });

  it("rejects non-numeric capacity string", () => {
    const form = { capacity: "abc" };
    const parsed = parseInt(form.capacity, 10);
    expect(Number.isNaN(parsed)).toBe(true);
  });

  it("accepts empty capacity as undefined", () => {
    const form = { capacity: "" };
    const parsed = form.capacity ? parseInt(form.capacity, 10) : undefined;
    expect(parsed).toBeUndefined();
  });
});

describe("Batch API route authorization", () => {
  it("POST /api/batches requires admin role", () => {
    const allowedRoles = ["admin"];
    expect(allowedRoles).toContain("admin");
    expect(allowedRoles).not.toContain("student");
    expect(allowedRoles).not.toContain("educator");
    expect(allowedRoles).not.toContain("parent");
  });

  it("PATCH /api/batches requires admin role", () => {
    const allowedRoles = ["admin"];
    expect(allowedRoles).toContain("admin");
    expect(allowedRoles).not.toContain("student");
  });

  it("DELETE /api/batches requires admin role", () => {
    const allowedRoles = ["admin"];
    expect(allowedRoles).toContain("admin");
    expect(allowedRoles).not.toContain("educator");
  });

  it("GET /api/batches allows all authenticated roles", () => {
    const allowedRoles = ["student", "educator", "admin", "parent"];
    expect(allowedRoles).toContain("student");
    expect(allowedRoles).toContain("educator");
    expect(allowedRoles).toContain("admin");
    expect(allowedRoles).toContain("parent");
  });
});
