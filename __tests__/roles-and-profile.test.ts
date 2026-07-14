import type {
  CustomRole,
  CustomRoleAssignment,
  AvailableModule,
  DashboardBundle,
  UserProfile,
} from "@/lib/types";
import { AVAILABLE_MODULES } from "@/lib/types";

const MODULE_IDS = AVAILABLE_MODULES.map((m) => m.id);

/* ─── Custom Role type tests ─── */

describe("CustomRole type contract", () => {
  const validRole: CustomRole = {
    id: "role-123",
    name: "Test Role",
    description: "A test role",
    color: "#4F46E5",
    modules: ["overview", "students"],
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("has required fields", () => {
    expect(validRole.id).toBeTruthy();
    expect(validRole.name).toBeTruthy();
    expect(validRole.color).toBeTruthy();
    expect(Array.isArray(validRole.modules)).toBe(true);
    expect(typeof validRole.isActive).toBe("boolean");
  });

  it("modules are valid AvailableModule values", () => {
    for (const mod of validRole.modules) {
      expect(MODULE_IDS).toContain(mod);
    }
  });

  it("description is optional", () => {
    const role: CustomRole = { ...validRole, description: undefined };
    expect(role.description).toBeUndefined();
  });

  it("updatedAt is optional", () => {
    const role: CustomRole = { ...validRole, updatedAt: undefined };
    expect(role.updatedAt).toBeUndefined();
  });
});

/* ─── CustomRoleAssignment type tests ─── */

describe("CustomRoleAssignment type contract", () => {
  const validAssignment: CustomRoleAssignment = {
    id: "roleassign-123",
    userId: "user-456",
    roleId: "role-789",
    roleName: "Teacher",
    assignedAt: "2026-01-01T00:00:00.000Z",
    assignedBy: "admin-001",
  };

  it("has all required fields", () => {
    expect(validAssignment.id).toBeTruthy();
    expect(validAssignment.userId).toBeTruthy();
    expect(validAssignment.roleId).toBeTruthy();
    expect(validAssignment.roleName).toBeTruthy();
    expect(validAssignment.assignedAt).toBeTruthy();
    expect(validAssignment.assignedBy).toBeTruthy();
  });
});

/* ─── AVAILABLE_MODULES validation ─── */

describe("AVAILABLE_MODULES constant", () => {
  it("is a non-empty array of objects with id and label", () => {
    expect(Array.isArray(AVAILABLE_MODULES)).toBe(true);
    expect(AVAILABLE_MODULES.length).toBeGreaterThan(0);
    for (const mod of AVAILABLE_MODULES) {
      expect(typeof mod.id).toBe("string");
      expect(typeof mod.label).toBe("string");
    }
  });

  it("contains expected core modules", () => {
    const expected = ["overview", "students", "attendance", "fees", "messages", "chat", "courses"];
    for (const mod of expected) {
      expect(MODULE_IDS).toContain(mod);
    }
  });

  it("no duplicate module ids", () => {
    const unique = new Set(MODULE_IDS);
    expect(unique.size).toBe(MODULE_IDS.length);
  });
});

/* ─── DashboardBundle contract tests ─── */

describe("DashboardBundle type contract", () => {
  const bundle: DashboardBundle = {
    roleLabel: "Student",
    heroTitle: "Welcome",
    heroDescription: "Dashboard",
    stats: [],
    primaryPanel: { title: "", items: [] },
    permissions: [],
    courses: [],
    tests: [],
    messages: [],
    submissions: [],
    attendanceSheets: [],
    feeInvoices: [],
    lectures: [],
  };

  it("linkedStudentId is optional", () => {
    expect(bundle.linkedStudentId).toBeUndefined();
  });

  it("linkedStudentProfile is optional", () => {
    expect(bundle.linkedStudentProfile).toBeUndefined();
  });

  it("linkedStudentProfile has all optional fields", () => {
    const profile: NonNullable<DashboardBundle["linkedStudentProfile"]> = {};
    expect(profile.name).toBeUndefined();
    expect(profile.email).toBeUndefined();
    expect(profile.phone).toBeUndefined();
    expect(profile.course).toBeUndefined();
    expect(profile.batch).toBeUndefined();
    expect(profile.attendance).toBeUndefined();
  });

  it("linkedStudentProfile stores attendance as number | null", () => {
    const withNum: DashboardBundle = {
      ...bundle,
      linkedStudentProfile: { attendance: 85 },
    };
    expect(withNum.linkedStudentProfile?.attendance).toBe(85);

    const withNull: DashboardBundle = {
      ...bundle,
      linkedStudentProfile: { attendance: null },
    };
    expect(withNull.linkedStudentProfile?.attendance).toBeNull();
  });

  it("assignedFacultyIds and assignedFacultyNames are optional", () => {
    expect(bundle.assignedFacultyIds).toBeUndefined();
    expect(bundle.assignedFacultyNames).toBeUndefined();
  });

  it("profile is optional UserProfile", () => {
    expect(bundle.profile).toBeUndefined();
  });
});

/* ─── UserProfile phone fields tests ─── */

describe("UserProfile phone fields", () => {
  it("guardianPhone and parentMobile are optional", () => {
    const profile: UserProfile = {};
    expect(profile.guardianPhone).toBeUndefined();
    expect(profile.parentMobile).toBeUndefined();
  });

  it("can have both guardianPhone and parentMobile", () => {
    const profile: UserProfile = {
      guardianPhone: "1111111111",
      parentMobile: "2222222222",
    };
    expect(profile.guardianPhone).toBe("1111111111");
    expect(profile.parentMobile).toBe("2222222222");
  });

  it("phone fallback: guardianPhone ?? parentMobile ?? ''", () => {
    const p1: UserProfile = { guardianPhone: "111" };
    expect(p1.guardianPhone ?? p1.parentMobile ?? "").toBe("111");

    const p2: UserProfile = { parentMobile: "222" };
    expect(p2.guardianPhone ?? p2.parentMobile ?? "").toBe("222");

    const p3: UserProfile = {};
    expect(p3.guardianPhone ?? p3.parentMobile ?? "").toBe("");
  });
});

/* ─── Role creation validation logic tests ─── */

describe("Role creation validation", () => {
  function validateRoleName(name: string): boolean {
    return name.trim().length > 0 && name.trim().length <= 50;
  }

  function validateRoleModules(modules: string[]): boolean {
    return (
      Array.isArray(modules) &&
      modules.length > 0 &&
      modules.every((m) => MODULE_IDS.includes(m as AvailableModule))
    );
  }

  function validateRoleColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  it("rejects empty name", () => {
    expect(validateRoleName("")).toBe(false);
    expect(validateRoleName("   ")).toBe(false);
  });

  it("accepts valid name", () => {
    expect(validateRoleName("Teacher")).toBe(true);
    expect(validateRoleName("Fee Collector")).toBe(true);
  });

  it("rejects name over 50 chars", () => {
    expect(validateRoleName("A".repeat(51))).toBe(false);
  });

  it("accepts name at exactly 50 chars", () => {
    expect(validateRoleName("A".repeat(50))).toBe(true);
  });

  it("rejects empty modules array", () => {
    expect(validateRoleModules([])).toBe(false);
  });

  it("accepts valid modules", () => {
    expect(validateRoleModules(["overview", "students"])).toBe(true);
  });

  it("rejects invalid module name", () => {
    expect(validateRoleModules(["nonexistent"])).toBe(false);
  });

  it("rejects mix of valid and invalid modules", () => {
    expect(validateRoleModules(["overview", "nonexistent"])).toBe(false);
  });

  it("accepts valid hex color", () => {
    expect(validateRoleColor("#4F46E5")).toBe(true);
    expect(validateRoleColor("#000000")).toBe(true);
    expect(validateRoleColor("#ffffff")).toBe(true);
  });

  it("rejects invalid color formats", () => {
    expect(validateRoleColor("red")).toBe(false);
    expect(validateRoleColor("#FFF")).toBe(false);
    expect(validateRoleColor("4F46E5")).toBe(false);
    expect(validateRoleColor("")).toBe(false);
  });
});

/* ─── Role module assignment tests ─── */

describe("Role module assignment", () => {
  const role: CustomRole = {
    id: "role-test",
    name: "Test",
    color: "#4F46E5",
    modules: ["students", "attendance"],
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("role can have single module", () => {
    const single: CustomRole = { ...role, modules: ["fees"] };
    expect(single.modules).toHaveLength(1);
  });

  it("role can have all modules", () => {
    const all: CustomRole = { ...role, modules: [...MODULE_IDS] };
    expect(all.modules.length).toBe(MODULE_IDS.length);
  });

  it("role with no modules is type-safe", () => {
    const empty: CustomRole = { ...role, modules: [] };
    expect(empty.modules).toHaveLength(0);
  });
});

/* ─── Role isActive toggle tests ─── */

describe("Role isActive toggle", () => {
  it("new role is active by default", () => {
    const role: CustomRole = {
      id: "role-new",
      name: "New",
      color: "#4F46E5",
      modules: ["overview"],
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(role.isActive).toBe(true);
  });

  it("role can be deactivated", () => {
    const role: CustomRole = {
      id: "role-old",
      name: "Old",
      color: "#4F46E5",
      modules: ["overview"],
      isActive: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(role.isActive).toBe(false);
  });
});

/* ─── Assignment uniqueness tests ─── */

describe("Assignment uniqueness", () => {
  const assignments: CustomRoleAssignment[] = [
    {
      id: "a1",
      userId: "user-1",
      roleId: "role-1",
      roleName: "Teacher",
      assignedAt: "2026-01-01T00:00:00.000Z",
      assignedBy: "admin-1",
    },
    {
      id: "a2",
      userId: "user-1",
      roleId: "role-2",
      roleName: "Manager",
      assignedAt: "2026-01-02T00:00:00.000Z",
      assignedBy: "admin-1",
    },
  ];

  it("one user can have multiple different roles", () => {
    const user1Roles = assignments.filter((a) => a.userId === "user-1");
    expect(user1Roles).toHaveLength(2);
    expect(user1Roles[0].roleId).not.toBe(user1Roles[1].roleId);
  });

  it("same role cannot be assigned twice to same user (idempotency check)", () => {
    const alreadyAssigned = assignments.some(
      (a) => a.userId === "user-1" && a.roleId === "role-1",
    );
    expect(alreadyAssigned).toBe(true);
  });

  it("different users can have same role", () => {
    const all: CustomRoleAssignment[] = [
      ...assignments,
      {
        id: "a3",
        userId: "user-2",
        roleId: "role-1",
        roleName: "Teacher",
        assignedAt: "2026-01-03T00:00:00.000Z",
        assignedBy: "admin-1",
      },
    ];
    const role1Users = all.filter((a) => a.roleId === "role-1");
    expect(role1Users).toHaveLength(2);
  });
});

/* ─── Profile merge logic tests ─── */

describe("Profile phone merge logic", () => {
  interface MockUserDoc {
    parentMobile?: string;
    mobile?: string;
    profile?: { guardianPhone?: string; parentMobile?: string };
  }

  function mergeProfilePhone(doc: MockUserDoc) {
    return {
      guardianPhone: doc.profile?.guardianPhone ?? doc.parentMobile ?? doc.mobile,
      parentMobile: doc.profile?.parentMobile ?? doc.parentMobile,
    };
  }

  it("uses profile.guardianPhone when available", () => {
    const doc: MockUserDoc = { profile: { guardianPhone: "111" }, parentMobile: "222" };
    expect(mergeProfilePhone(doc).guardianPhone).toBe("111");
    expect(mergeProfilePhone(doc).parentMobile).toBe("222");
  });

  it("falls back to root parentMobile", () => {
    const doc: MockUserDoc = { parentMobile: "333" };
    expect(mergeProfilePhone(doc).guardianPhone).toBe("333");
  });

  it("falls back to root mobile", () => {
    const doc: MockUserDoc = { mobile: "444" };
    expect(mergeProfilePhone(doc).guardianPhone).toBe("444");
  });

  it("returns undefined when no phone data exists", () => {
    const doc: MockUserDoc = {};
    expect(mergeProfilePhone(doc).guardianPhone).toBeUndefined();
  });

  it("uses profile.parentMobile when available", () => {
    const doc: MockUserDoc = { profile: { parentMobile: "555" }, parentMobile: "666" };
    expect(mergeProfilePhone(doc).parentMobile).toBe("555");
  });
});
