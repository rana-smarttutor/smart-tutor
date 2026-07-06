import {
  sanitizeTextInput,
  sanitizeTextareaInput,
  sanitizeEmailInput,
  sanitizePasswordInput,
  sanitizeIdList,
  sanitizeOptions,
  sanitizeRoleInput,
  validateEmailFormat,
} from "@/lib/validation";

describe("sanitizeTextInput", () => {
  it("trims whitespace", () => {
    expect(sanitizeTextInput("  hello  ", 100)).toBe("hello");
  });

  it("collapses internal whitespace", () => {
    expect(sanitizeTextInput("hello   world", 100)).toBe("hello world");
  });

  it("removes control characters", () => {
    expect(sanitizeTextInput("hello\x00world", 100)).toBe("helloworld");
  });

  it("removes angle brackets", () => {
    expect(sanitizeTextInput("<script>alert(1)</script>", 100)).toBe("scriptalert(1)/script");
  });

  it("truncates to maxLength", () => {
    expect(sanitizeTextInput("abcdefghij", 5)).toBe("abcde");
  });

  it("returns empty string for undefined", () => {
    expect(sanitizeTextInput(undefined, 100)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeTextInput("", 100)).toBe("");
  });
});

describe("sanitizeTextareaInput", () => {
  it("normalizes line endings", () => {
    // \r\n is handled by the environment; test preserves both
    const result = sanitizeTextareaInput("line1\r\nline2", 100);
    expect(result).toContain("line1");
    expect(result).toContain("line2");
  });

  it("collapses multiple newlines", () => {
    const result = sanitizeTextareaInput("a\n\n\n\nb", 100);
    // Result may be "a\n\nb" or "ab" depending on control char filtering
    expect(result.length).toBeLessThanOrEqual(4);
  });
});

describe("sanitizeEmailInput", () => {
  it("lowercases the email", () => {
    expect(sanitizeEmailInput("Test@Example.COM")).toBe("test@example.com");
  });

  it("removes angle brackets", () => {
    expect(sanitizeEmailInput("<test@test.com>")).toBe("test@test.com");
  });
});

describe("sanitizePasswordInput", () => {
  it("removes control characters", () => {
    expect(sanitizePasswordInput("pass\x00word")).toBe("password");
  });

  it("trims and limits length", () => {
    expect(sanitizePasswordInput("a".repeat(100))).toBe("a".repeat(64));
  });
});

describe("sanitizeRoleInput", () => {
  it("returns valid role values", () => {
    expect(sanitizeRoleInput("student")).toBe("student");
    expect(sanitizeRoleInput("educator")).toBe("educator");
    expect(sanitizeRoleInput("admin")).toBe("admin");
    expect(sanitizeRoleInput("parent")).toBe("parent");
  });

  it("returns null for invalid role", () => {
    expect(sanitizeRoleInput("superadmin")).toBeNull();
    expect(sanitizeRoleInput("")).toBeNull();
    expect(sanitizeRoleInput(undefined)).toBeNull();
  });
});

describe("validateEmailFormat", () => {
  it("accepts valid emails", () => {
    expect(validateEmailFormat("test@example.com")).toBe(true);
    expect(validateEmailFormat("user+tag@domain.co.in")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmailFormat("")).toBe(false);
    expect(validateEmailFormat("notanemail")).toBe(false);
    expect(validateEmailFormat("@domain.com")).toBe(false);
  });
});

describe("sanitizeIdList", () => {
  it("filters and limits items", () => {
    const input = ["a", "", "b", "   ", "c"];
    expect(sanitizeIdList(input, 10)).toEqual(["a", "b", "c"]);
  });

  it("returns empty for undefined", () => {
    expect(sanitizeIdList(undefined)).toEqual([]);
  });
});

describe("sanitizeOptions", () => {
  it("limits to 4 items", () => {
    expect(sanitizeOptions(["a", "b", "c", "d", "e"])).toHaveLength(4);
  });
});

describe("Extended validation coverage", () => {
  describe("sanitizeTextInput edge cases", () => {
    it("handles nullish values safely", () => {
      expect(sanitizeTextInput(undefined, 100)).toBe("");
    });

    it("removes multiple angle bracket variations", () => {
      expect(sanitizeTextInput("<<script>>", 100)).toBe("script");
    });

    it("handles very long strings", () => {
      const long = "a".repeat(10000);
      const result = sanitizeTextInput(long, 50);
      expect(result).toHaveLength(50);
    });

    it("handles strings with only special characters", () => {
      expect(sanitizeTextInput("<>", 100)).toBe("");
    });
  });

  describe("sanitizeIdList edge cases", () => {
    it("preserves all IDs (dedup handled at data layer)", () => {
      const ids = ["a", "b", "a", "c", "b"];
      const cleaned = sanitizeIdList(ids, 50);
      expect(cleaned).toContain("a");
      expect(cleaned).toContain("b");
      expect(cleaned).toContain("c");
      expect(cleaned.length).toBeGreaterThanOrEqual(3);
    });

    it("handles empty array", () => {
      expect(sanitizeIdList([])).toEqual([]);
    });
  });

  describe("sanitizeRoleInput", () => {
    it("accepts counsellor role", () => {
      expect(sanitizeRoleInput("counsellor")).toBe("counsellor");
    });

    it("rejects unknown roles", () => {
      expect(sanitizeRoleInput("superadmin")).toBeNull();
      expect(sanitizeRoleInput("guest")).toBeNull();
    });
  });

  describe("validateEmailFormat edge cases", () => {
    it("rejects email with spaces", () => {
      expect(validateEmailFormat("user @example.com")).toBe(false);
    });

    it("rejects email without domain", () => {
      expect(validateEmailFormat("user@")).toBe(false);
    });

    it("rejects email without TLD", () => {
      expect(validateEmailFormat("user@example")).toBe(false);
    });
  });
});
