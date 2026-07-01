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
    expect(sanitizeTextareaInput("line1\r\nline2", 100)).toBe("line1\nline2");
  });

  it("collapses multiple newlines", () => {
    expect(sanitizeTextareaInput("a\n\n\n\nb", 100)).toBe("a\n\nb");
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
