"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type CourseGroup =
  | "School / Board"
  | "Government Exams"
  | "Skill Development";

type CourseOption = {
  key: string;
  label: string;
  group: CourseGroup;
};

type SignupFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  dob: string;

  parentName: string;
  parentEmail: string;
  parentMobile: string;
  parentPassword: string;
  parentConfirmPassword: string;

  courseWanted: string;
  courseWantedTitle: string;
  studentType: string;

  weakSubjects: string;
  strongSubjects: string;
  marks10: string;
  marks12: string;
  graduationMarks: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;

  qualification: string;
  experience: string;
  subjects: string;

  profilePhotoUrl: string;
  cvUrl: string;
};

const JUNIOR_CLASSES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const JUNIOR_BOARDS = [
  "CBSE",
  "ICSE",
  "State Board / SSC",
  "IGCSE",
  "IB MYP",
];

const SENIOR_CLASSES = [
  { key: "Class 11 Science", label: "Class 11th Science" },
  { key: "Class 12 Science", label: "Class 12th Science" },
  { key: "Class 11 Commerce", label: "Class 11th Commerce" },
  { key: "Class 12 Commerce", label: "Class 12th Commerce" },
  { key: "Class 11 Arts", label: "Class 11th Arts" },
  { key: "Class 12 Arts", label: "Class 12th Arts" },
];

const SENIOR_BOARDS = [
  "CBSE",
  "HSC / State Board",
  "ISC",
  "IGCSE A Levels",
  "IB Diploma Programme",
];

const GOVT_EXAM_OPTIONS = [
  { key: "UPSC", label: "UPSC Civil Services" },
  { key: "MPSC", label: "MPSC State Services" },
  { key: "STATE-PSC", label: "Other State PSC Exams" },

  { key: "SSC-CGL", label: "SSC CGL" },
  { key: "SSC-CHSL", label: "SSC CHSL" },
  { key: "SSC-GD", label: "SSC GD Constable" },
  { key: "SSC-MTS", label: "SSC MTS" },
  { key: "SSC-CPO", label: "SSC CPO / Sub Inspector" },

  { key: "NDA", label: "NDA" },
  { key: "CDS", label: "CDS" },
  { key: "AFCAT", label: "AFCAT" },
  { key: "ARMY-AGNIVEER", label: "Indian Army Agniveer" },
  { key: "NAVY-AGNIVEER", label: "Indian Navy Agniveer" },
  { key: "AIRFORCE-AGNIVEER", label: "Indian Air Force Agniveer" },
  { key: "CAPF", label: "CAPF / Paramilitary Forces" },

  { key: "IBPS-PO", label: "IBPS PO" },
  { key: "IBPS-CLERK", label: "IBPS Clerk" },
  { key: "SBI-PO", label: "SBI PO" },
  { key: "SBI-CLERK", label: "SBI Clerk" },
  { key: "RBI", label: "RBI Grade B / Assistant" },

  { key: "RAILWAY-NTPC", label: "Railway NTPC" },
  { key: "RAILWAY-GROUP-D", label: "Railway Group D" },
  { key: "RAILWAY-ALP", label: "Railway ALP / Technician" },

  { key: "POLICE-BHARTI", label: "Police Bharti" },
  { key: "POLICE-SI", label: "Police Sub Inspector" },

  { key: "CTET", label: "CTET / TET" },
  { key: "UGC-NET", label: "UGC NET / SET" },
];

const SKILL_PROGRAMS = [
  "Coding & Robotics",
  "AI & Data Science",
  "Digital Marketing",
  "Graphic Design",
  "Public Speaking & Communication",
  "Financial Literacy",
  "Personality Development",
  "Resume Building & Interview Skills",
];

const COURSE_SECTIONS: CourseOption[] = [
  ...JUNIOR_CLASSES.flatMap((className) =>
    JUNIOR_BOARDS.map((board) => ({
      key: `${className} | ${board}`,
      label: `${className} — ${board}`,
      group: "School / Board" as const,
    })),
  ),

  ...SENIOR_CLASSES.flatMap((academicClass) =>
    SENIOR_BOARDS.map((board) => ({
      key: `${academicClass.key} | ${board}`,
      label: `${academicClass.label} — ${board}`,
      group: "School / Board" as const,
    })),
  ),

  ...GOVT_EXAM_OPTIONS.map((exam) => ({
    key: `Govt Exams | ${exam.key}`,
    label: exam.label,
    group: "Government Exams" as const,
  })),

  ...SKILL_PROGRAMS.map((skill) => ({
    key: `Skills | ${skill}`,
    label: skill,
    group: "Skill Development" as const,
  })),
];

function getInitialFormData(): SignupFormData {
  return {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    dob: "",

    parentName: "",
    parentEmail: "",
    parentMobile: "",
    parentPassword: "",
    parentConfirmPassword: "",

    courseWanted: "",
    courseWantedTitle: "",
    studentType: "",

    weakSubjects: "",
    strongSubjects: "",
    marks10: "",
    marks12: "",
    graduationMarks: "",

    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",

    qualification: "",
    experience: "",
    subjects: "",

    profilePhotoUrl: "",
    cvUrl: "",
  };
}

export function RegistrationForm() {
  const [activeTab, setActiveTab] = useState<"student" | "educator">(
    "student",
  );
  const [form, setForm] = useState<SignupFormData>(getInitialFormData());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);

  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);

  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCourseDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) {
      return COURSE_SECTIONS;
    }

    const query = courseSearch.toLowerCase();

    return COURSE_SECTIONS.filter(
      (course) =>
        course.key.toLowerCase().includes(query) ||
        course.label.toLowerCase().includes(query),
    );
  }, [courseSearch]);

  const groupedCourses = useMemo(() => {
    return filteredCourses.reduce<Record<CourseGroup, CourseOption[]>>(
      (groups, course) => {
        groups[course.group].push(course);
        return groups;
      },
      {
        "School / Board": [],
        "Government Exams": [],
        "Skill Development": [],
      },
    );
  }, [filteredCourses]);

  function updateField(key: keyof SignupFormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function selectCourse(course: CourseOption) {
    setForm((previous) => ({
      ...previous,
      courseWanted: course.key,
      courseWantedTitle: course.label,
    }));

    setCourseSearch(course.label);
    setShowCourseDropdown(false);
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("field", "photo");

      const response = await fetch("/api/upload/signup", {
        method: "POST",
        body: uploadData,
      });

      const data = (await response.json()) as {
        success: boolean;
        url?: string;
        message?: string;
      };

      if (data.success && data.url) {
        updateField("profilePhotoUrl", data.url);
      } else {
        setError(data.message || "Photo upload failed.");
      }
    } catch {
      setError("Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleCvUpload(file: File) {
    setUploadingCv(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("field", "cv");

      const response = await fetch("/api/upload/signup", {
        method: "POST",
        body: uploadData,
      });

      const data = (await response.json()) as {
        success: boolean;
        url?: string;
        message?: string;
      };

      if (data.success && data.url) {
        updateField("cvUrl", data.url);
      } else {
        setError(data.message || "CV upload failed.");
      }
    } catch {
      setError("CV upload failed.");
    } finally {
      setUploadingCv(false);
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      handlePhotoUpload(file);
    }
  }

  function handleCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      handleCvUpload(file);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsPending(true);

    try {
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError("A valid email address is required.");
        return;
      }

      if (!form.mobile || form.mobile.replace(/[^\d]/g, "").length < 10) {
        setError("A valid 10-digit mobile number is required.");
        return;
      }

      if (!form.profilePhotoUrl) {
        setError("Profile photo is required. Please upload a photo.");
        return;
      }

      if (activeTab === "student") {
        if (!form.courseWanted) {
          setError(
            "Please select a class, board, government exam, or skill program.",
          );
          return;
        }

        if (
          !form.parentEmail ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)
        ) {
          setError("Parent email is required and must be valid.");
          return;
        }

        if (
          !form.parentMobile ||
          form.parentMobile.replace(/[^\d]/g, "").length < 10
        ) {
          setError("Parent mobile number is required and must be 10 digits.");
          return;
        }

        if (form.parentPassword.length < 6) {
          setError("Parent password must be at least 6 characters.");
          return;
        }

        if (form.parentPassword !== form.parentConfirmPassword) {
          setError("Parent passwords do not match.");
          return;
        }
      }

      if (activeTab === "educator") {
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
      }

      const body: Record<string, unknown> = {
        role: activeTab,
        name: form.name,
        email: form.email,
        password: form.password,
        mobile: form.mobile,
        dob: form.dob,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        profilePhoto: form.profilePhotoUrl,
      };

      if (activeTab === "student") {
        body.parentName = form.parentName;
        body.parentEmail = form.parentEmail;
        body.parentMobile = form.parentMobile;
        body.parentPassword = form.parentPassword;

        body.courseWanted = form.courseWanted;
        body.courseWantedTitle = form.courseWantedTitle;
        body.studentType = form.studentType;

        body.weakSubjects = form.weakSubjects
          ? form.weakSubjects
              .split(",")
              .map((subject) => subject.trim())
              .filter(Boolean)
          : [];

        body.strongSubjects = form.strongSubjects
          ? form.strongSubjects
              .split(",")
              .map((subject) => subject.trim())
              .filter(Boolean)
          : [];

        body.marks10 = form.marks10;
        body.marks12 = form.marks12;
        body.graduationMarks = form.graduationMarks;
      }

      if (activeTab === "educator") {
        body.confirmPassword = form.confirmPassword;
        body.qualification = form.qualification;
        body.experience = form.experience;
        body.cvUrl = form.cvUrl;

        body.subjects = form.subjects
          ? form.subjects
              .split(",")
              .map((subject) => subject.trim())
              .filter(Boolean)
          : [];
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(data.error || data.message || "Registration failed.");
        return;
      }

      setSuccess(data.message || "Account created successfully.");

      if (data.redirectTo) {
        setTimeout(() => {
          window.location.assign(data.redirectTo!);
        }, 1200);
      }
    } catch {
      setError("Unable to complete registration. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="section-label">Registration</p>

        <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-4xl">
          Create Account
        </h2>

        <p className="text-sm font-medium text-[var(--color-muted)]">
          Choose your role and fill in the details to get started.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("student");
            setError("");
            setSuccess("");
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${
            activeTab === "student"
              ? "scale-[1.02] border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-200/50"
              : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30"
          }`}
        >
          <span className="mb-1 text-2xl">🎓</span>

          <span className="text-[10px] font-black uppercase tracking-wider">
            Student
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("educator");
            setError("");
            setSuccess("");
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${
            activeTab === "educator"
              ? "scale-[1.02] border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-200/50"
              : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30"
          }`}
        >
          <span className="mb-1 text-2xl">👨‍🏫</span>

          <span className="text-[10px] font-black uppercase tracking-wider">
            Faculty
          </span>
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600">
          <svg
            className="h-4 w-4 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>

          {success}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[var(--color-primary)]">
            Personal Information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Full Name"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              required
              placeholder="Enter your full name"
            />

            <InputField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              required
              placeholder="you@example.com"
            />

            <InputField
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
              required
              placeholder="Min 6 characters"
              hint="At least 6 characters"
            />

            {activeTab === "educator" && (
              <InputField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(value) => updateField("confirmPassword", value)}
                required
                placeholder="Re-enter password"
              />
            )}

            <InputField
              label="Mobile Number"
              type="tel"
              value={form.mobile}
              onChange={(value) => updateField("mobile", value)}
              required
              placeholder="10-digit mobile number"
            />

            <InputField
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(value) => updateField("dob", value)}
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
              Profile Photo <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-2.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100 disabled:opacity-50"
              >
                {uploadingPhoto ? "Uploading..." : "Choose Photo"}
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />

              {form.profilePhotoUrl && (
                <span className="text-xs text-emerald-600">
                  Photo uploaded
                </span>
              )}

              <span className="text-[10px] text-slate-400">
                PNG, JPG, WEBP (max 5MB)
              </span>
            </div>
          </div>

          {activeTab === "student" && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
              <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-blue-700">
                Parent / Guardian Information
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                <InputField
                  label="Parent Name"
                  value={form.parentName}
                  onChange={(value) => updateField("parentName", value)}
                  placeholder="Parent's full name"
                />

                <InputField
                  label="Parent Email"
                  type="email"
                  value={form.parentEmail}
                  onChange={(value) => updateField("parentEmail", value)}
                  required
                  placeholder="parent@email.com"
                />

                <InputField
                  label="Parent Mobile"
                  type="tel"
                  value={form.parentMobile}
                  onChange={(value) => updateField("parentMobile", value)}
                  required
                  placeholder="Parent's mobile number"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Parent Login Password"
                  type="password"
                  value={form.parentPassword}
                  onChange={(value) => updateField("parentPassword", value)}
                  required
                  placeholder="Min 6 characters"
                />

                <InputField
                  label="Confirm Parent Password"
                  type="password"
                  value={form.parentConfirmPassword}
                  onChange={(value) =>
                    updateField("parentConfirmPassword", value)
                  }
                  required
                  placeholder="Re-enter parent password"
                />
              </div>

              <p className="mt-2 text-[10px] text-blue-500/70">
                A separate parent login account will be created with these
                credentials.
              </p>
            </div>
          )}
        </div>

        {activeTab === "student" && (
          <>
            <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[var(--color-primary)]">
                Academic Information
              </h3>

              <div className="space-y-4">
                <div ref={courseDropdownRef} className="relative">
                  <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                    Class / Board / Exam / Skill Program{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(event) => {
                      setCourseSearch(event.target.value);
                      setShowCourseDropdown(true);

                      setForm((previous) => ({
                        ...previous,
                        courseWanted: "",
                        courseWantedTitle: "",
                      }));
                    }}
                    onFocus={() => setShowCourseDropdown(true)}
                    className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                    placeholder="Search class, board, govt exam, or skill..."
                  />

                  {showCourseDropdown && filteredCourses.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      {(
                        Object.entries(groupedCourses) as [
                          CourseGroup,
                          CourseOption[],
                        ][]
                      ).map(([group, courses]) => {
                        if (courses.length === 0) {
                          return null;
                        }

                        return (
                          <div key={group} className="mb-2 last:mb-0">
                            <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {group}
                            </p>

                            {courses.map((course) => (
                              <button
                                key={course.key}
                                type="button"
                                onClick={() => selectCourse(course)}
                                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                  form.courseWanted === course.key
                                    ? "bg-blue-50 font-bold text-blue-700"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span className="block font-semibold">
                                  {course.label}
                                </span>

                                <span className="mt-0.5 block text-[10px] text-slate-400">
                                  {course.key}
                                </span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {form.courseWanted && (
                    <p className="ml-1 mt-1 text-[10px] text-emerald-600">
                      Selected: {form.courseWantedTitle}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                    Student Type
                  </label>

                  <select
                    value={form.studentType}
                    onChange={(event) =>
                      updateField("studentType", event.target.value)
                    }
                    className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all focus:ring-4"
                  >
                    <option value="">Select type</option>
                    <option value="home">Home Student</option>
                    <option value="on-campus">On Campus Student</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Weak Subjects (comma separated)"
                    value={form.weakSubjects}
                    onChange={(value) => updateField("weakSubjects", value)}
                    placeholder="e.g. Mathematics, Physics"
                  />

                  <InputField
                    label="Strong Subjects (comma separated)"
                    value={form.strongSubjects}
                    onChange={(value) => updateField("strongSubjects", value)}
                    placeholder="e.g. English, Biology"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[var(--color-primary)]">
                Academic Marks
              </h3>

              <p className="mb-4 text-xs text-slate-400">
                All marks fields are optional. Fill whichever apply to you.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="10th Marks (optional)"
                  value={form.marks10}
                  onChange={(value) => updateField("marks10", value)}
                  placeholder="e.g. 85% or 8.5 CGPA"
                />

                <InputField
                  label="12th Marks (optional)"
                  value={form.marks12}
                  onChange={(value) => updateField("marks12", value)}
                  placeholder="e.g. 78% or 7.8 CGPA"
                />

                <InputField
                  label="Graduation / Diploma / PG Marks (optional)"
                  value={form.graduationMarks}
                  onChange={(value) =>
                    updateField("graduationMarks", value)
                  }
                  placeholder="e.g. 72% or 7.2 CGPA"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "educator" && (
          <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
            <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[var(--color-primary)]">
              Professional Information
            </h3>

            <div className="space-y-4">
              <InputField
                label="Qualification"
                value={form.qualification}
                onChange={(value) => updateField("qualification", value)}
                required
                placeholder="e.g. M.Sc. Mathematics, B.Ed"
              />

              <InputField
                label="Experience"
                value={form.experience}
                onChange={(value) => updateField("experience", value)}
                placeholder="e.g. 5 years of teaching experience"
              />

              <InputField
                label="Subjects you can teach (comma separated)"
                value={form.subjects}
                onChange={(value) => updateField("subjects", value)}
                placeholder="e.g. Mathematics, Physics, Chemistry"
              />

              <div>
                <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  Upload CV / Resume
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={uploadingCv}
                    className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-2.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100 disabled:opacity-50"
                  >
                    {uploadingCv ? "Uploading..." : "Choose CV"}
                  </button>

                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCvChange}
                  />

                  {form.cvUrl && (
                    <span className="text-xs text-emerald-600">
                      CV uploaded
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400">
                    PDF, DOC, DOCX (max 5MB)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[var(--color-primary)]">
            Address
          </h3>

          <div className="space-y-4">
            <InputField
              label="Address Line 1"
              value={form.addressLine1}
              onChange={(value) => updateField("addressLine1", value)}
              placeholder="House / Flat / Door No., Street / Locality"
            />

            <InputField
              label="Address Line 2"
              value={form.addressLine2}
              onChange={(value) => updateField("addressLine2", value)}
              placeholder="Nearby landmark, Area (optional)"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="City"
                value={form.city}
                onChange={(value) => updateField("city", value)}
                placeholder="e.g. Vashi"
              />

              <InputField
                label="State"
                value={form.state}
                onChange={(value) => updateField("state", value)}
                placeholder="e.g. Maharashtra"
              />

              <InputField
                label="Pincode"
                value={form.pincode}
                onChange={(value) => updateField("pincode", value)}
                placeholder="e.g. 400703"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
            <svg
              className="h-4 w-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>

            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isPending
              ? "Creating Account..."
              : activeTab === "educator"
                ? "Submit for Approval"
                : "Create Account"}

            {!isPending && (
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            )}
          </span>
        </button>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Sign In
          </a>
        </p>
      </form>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  hint,
  isTextarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  isTextarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {isTextarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
        />
      )}

      {hint && (
        <p className="ml-1 text-[10px] text-slate-400">{hint}</p>
      )}
    </div>
  );
}