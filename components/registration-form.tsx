"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

type Role = "student" | "educator";
type EmployeeType = "educator" | "staff";

type CourseGroup =
  | "School / Board"
  | "Government Exams"
  | "Competitive Exams"
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
  campusLocation: string;
  referralCode: string;
  weakSubjects: string;
  strongSubjects: string;
  latestQualification: string;
  latestAcademicScore: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  qualification: string;
  experience: string;
  subjects: string;
  designation: string;
  department: string;
  branch: string;
  employmentType: string;
  joiningDate: string;
  profilePhotoUrl: string;
  cvUrl: string;
  photoIdFrontUrl: string;
  photoIdBackUrl: string;
};

type ExamQualification = {
  examName: string;
  score: string;
  year: string;
};

const JUNIOR_CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

const JUNIOR_BOARDS = ["CBSE", "ICSE", "State Board / SSC", "IGCSE", "IB MYP"];

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

const GOVERNMENT_EXAM_GROUPS = [
  [["UPSC-COMPLETE", "UPSC Civil Services — Complete Preparation"]],
  [
    ["ALL-STATE-PSC", "All State PSC Exams"],
    ["MPSC", "MPSC"],
    ["UPPSC", "UPPSC"],
    ["BPSC", "BPSC"],
    ["RPSC", "RPSC"],
    ["MPPSC", "MPPSC"],
    ["GPSC", "GPSC"],
    ["WBPSC", "WBPSC"],
    ["KPSC", "KPSC"],
    ["TNPSC", "TNPSC"],
    ["OTHER-STATE-PSC", "Other State PSC Exams"],
  ],
  [
    ["ALL-BANKING", "All Banking Exams"],
    ["IBPS-PO", "IBPS PO"],
    ["IBPS-CLERK", "IBPS Clerk"],
    ["IBPS-SO", "IBPS Specialist Officer"],
    ["SBI-PO", "SBI PO"],
    ["SBI-CLERK", "SBI Clerk"],
    ["RRB-PO", "RRB PO"],
    ["RRB-CLERK", "RRB Clerk"],
  ],
  [
    ["ALL-REGULATORY-INSURANCE", "All Regulatory & Insurance Exams"],
    ["RBI-GRADE-B", "RBI Grade B"],
    ["RBI-ASSISTANT", "RBI Assistant"],
    ["NABARD-GRADE-A", "NABARD Grade A"],
    ["SEBI-GRADE-A", "SEBI Grade A"],
    ["IRDAI-ASSISTANT-MANAGER", "IRDAI Assistant Manager"],
    ["LIC-AAO", "LIC AAO"],
    ["LIC-ADO", "LIC ADO"],
    ["NIACL-AO", "NIACL AO"],
    ["GIC-ASSISTANT-MANAGER", "GIC Assistant Manager"],
  ],
  [
    ["ALL-SSC", "All SSC Exams"],
    ["SSC-CGL", "SSC CGL"],
    ["SSC-CHSL", "SSC CHSL"],
    ["SSC-MTS", "SSC MTS"],
    ["SSC-CPO", "SSC CPO / Sub Inspector"],
    ["SSC-GD", "SSC GD Constable"],
    ["SSC-STENOGRAPHER", "SSC Stenographer"],
    ["SSC-JE", "SSC Junior Engineer"],
    ["SSC-SELECTION-POST", "SSC Selection Post"],
  ],
  [
    ["ALL-TEACHING-ACADEMIC", "All Teaching & Academic Eligibility Exams"],
    ["CTET", "CTET"],
    ["STATE-TET", "State TET"],
    ["DSSSB", "DSSSB"],
    ["KVS", "KVS"],
    ["NVS", "NVS"],
    ["UGC-NET", "UGC NET"],
    ["CSIR-NET", "CSIR NET"],
    ["SET", "SET"],
  ],
  [
    ["ALL-POLICE-ARMY-BHARTI", "All Police / Army Bharti Exams"],
    ["POLICE-BHARTI", "Police Bharti"],
    ["ARMY-BHARTI", "Army Bharti"],
    ["POLICE-SI", "Police Sub Inspector"],
    ["POLICE-CONSTABLE", "Police Constable"],
  ],
  [
    ["ALL-RAILWAY", "All Railway Exams"],
    ["RRB-NTPC", "RRB NTPC"],
    ["RRB-GROUP-D", "RRB Group D"],
    ["RRB-ALP", "RRB ALP"],
    ["RRB-TECHNICIAN", "RRB Technician"],
    ["RRB-JE", "RRB Junior Engineer"],
    ["RPF-CONSTABLE", "RPF Constable"],
    ["RPF-SUB-INSPECTOR", "RPF Sub Inspector"],
  ],
  [
    ["ALL-DEFENCE-PARAMILITARY", "All Defence & Paramilitary Exams"],
    ["NDA", "NDA"],
    ["CDS", "CDS"],
    ["AFCAT", "AFCAT"],
    ["CAPF-AC", "CAPF Assistant Commandant"],
    ["ARMY-AGNIVEER", "Army Agniveer"],
    ["NAVY-AGNIVEER", "Navy Agniveer"],
    ["AIRFORCE-AGNIVEER", "Air Force Agniveer"],
    ["INDIAN-COAST-GUARD", "Indian Coast Guard"],
    ["SSB-INTERVIEW", "SSB Interview Preparation"],
  ],
];

const COMPETITIVE_EXAM_GROUPS = [
  [
    ["JEE", "JEE Main & Advanced Preparation"],
    ["NEET", "NEET UG Preparation"],
    ["MHT-CET", "MHT CET Preparation"],
  ],
  [
    ["ALL-LAW-ENTRANCE", "All LLB & Law Entrance Exams"],
    ["MH-CET-LAW-3-YEAR", "MH CET Law 3 Year"],
    ["MH-CET-LAW-5-YEAR", "MH CET Law 5 Year"],
    ["CLAT", "CLAT"],
    ["AILET", "AILET"],
    ["LSAT-INDIA", "LSAT India"],
  ],
  [
    ["ALL-MBA-ENTRANCE", "All MBA Entrance Exams"],
    ["MBA-CET", "MBA CET"],
    ["CAT", "CAT"],
    ["CMAT", "CMAT"],
    ["MAT", "MAT"],
    ["XAT", "XAT"],
    ["SNAP", "SNAP"],
    ["NMAT", "NMAT"],
    ["ATMA", "ATMA"],
  ],
  [
    ["ALL-GATE-PG-TECHNICAL", "All GATE & Postgraduate Technical Exams"],
    ["GATE", "GATE"],
    ["IIT-JAM", "IIT JAM"],
    ["CEED", "CEED"],
    ["PGCET", "PGCET"],
    ["PSU-THROUGH-GATE", "PSU Recruitment through GATE"],
  ],
  [
    ["ALL-MHT-CET", "All MHT CET Exam Categories"],
    ["MHT-CET-ENGINEERING", "MHT CET Engineering"],
    ["MHT-CET-PHARMACY", "MHT CET Pharmacy"],
    ["MHT-CET-BBA-BCA-BMS", "MHT CET BBA / BCA / BMS"],
    ["MHT-CET-DESIGN", "MHT CET Design"],
    ["MHT-CET-HOTEL-MANAGEMENT", "MHT CET Hotel Management"],
    ["MHT-CET-NURSING", "MHT CET Nursing"],
    ["MHT-CET-EDUCATION", "MHT CET B.Ed / B.P.Ed"],
  ],
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
  ...GOVERNMENT_EXAM_GROUPS.flat(1).map(([key, label]) => ({
    key: `Govt Exams | ${key}`,
    label,
    group: "Government Exams" as const,
  })),
  ...COMPETITIVE_EXAM_GROUPS.flat(1).map(([key, label]) => ({
    key: `Competitive Exams | ${key}`,
    label,
    group: "Competitive Exams" as const,
  })),
  ...SKILL_PROGRAMS.map((skill) => ({
    key: `Skills | ${skill}`,
    label: skill,
    group: "Skill Development" as const,
  })),
];

const FIELD_CLASS =
  "w-full min-w-0 rounded-lg border border-[#D6DFED] bg-white px-3.5 py-2.5 text-sm text-[#14264A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10";

const LABEL_CLASS = "mb-1.5 block text-xs font-semibold text-[#253757]";

const BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-lg border border-[#D6DFED] bg-white px-4 py-2.5 text-sm font-semibold text-[#1956D8] transition-colors hover:border-[#2563EB] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50";

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
    campusLocation: "",
    referralCode: "",
    weakSubjects: "",
    strongSubjects: "",
    latestQualification: "",
    latestAcademicScore: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    qualification: "",
    experience: "",
    subjects: "",
    designation: "",
    department: "",
    branch: "",
    employmentType: "full_time",
    joiningDate: "",
    profilePhotoUrl: "",
    cvUrl: "",
    photoIdFrontUrl: "",
    photoIdBackUrl: "",
  };
}

type SectionProps = {
  id: string;
  number: number;
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function RegistrationSection({
  id,
  number,
  title,
  description,
  open,
  onToggle,
  children,
}: SectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#DDE5F1] bg-white">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`signup-panel-${id}`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF1FF] text-sm font-bold text-[#1955CE]">
              {number}
            </span>

            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-[#102348]">
                {title}
              </span>

              {description && (
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  {description}
                </span>
              )}
            </span>
          </span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              d="m6 9 6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h3>

      <div
        id={`signup-panel-${id}`}
        hidden={!open}
        className="border-t border-[#E8EDF5] px-4 py-5 sm:px-5"
      >
        {children}
      </div>
    </section>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  isTextarea?: boolean;
};

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  hint,
  isTextarea = false,
}: InputFieldProps) {
  return (
    <div className="min-w-0">
      <label className={LABEL_CLASS}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {isTextarea ? (
        <textarea
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${FIELD_CLASS} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={FIELD_CLASS}
        />
      )}

      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function FileUpload({
  label,
  buttonText,
  uploading,
  uploaded,
  onClick,
  inputRef,
  accept,
  onChange,
  hint,
}: {
  label: string;
  buttonText: string;
  uploading: boolean;
  uploaded: boolean;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hint: string;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label} <span className="text-red-500">*</span>
      </label>

      <div className="flex min-h-[44px] flex-wrap items-center gap-3 rounded-lg border border-[#D6DFED] bg-white px-3 py-2">
        <button
          type="button"
          onClick={onClick}
          disabled={uploading}
          className="rounded-md bg-[#EDF3FF] px-3 py-2 text-xs font-semibold text-[#1956D8] transition hover:bg-[#E1EBFF] disabled:opacity-50"
        >
          {uploading ? "Uploading..." : buttonText}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />

        <span
          className={`text-xs ${
            uploaded ? "font-medium text-emerald-700" : "text-slate-500"
          }`}
        >
          {uploaded ? "Uploaded successfully" : hint}
        </span>
      </div>
    </div>
  );
}

export function RegistrationForm() {
  const [activeTab, setActiveTab] = useState<Role>("student");
  const [employeeType, setEmployeeType] = useState<EmployeeType>("educator");

  const [form, setForm] = useState<SignupFormData>(getInitialFormData());

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [referralStatus, setReferralStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");

  const [referralEducatorName, setReferralEducatorName] = useState("");

  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [uploadingCv, setUploadingCv] = useState(false);

  const [uploadingPhotoIdFront, setUploadingPhotoIdFront] = useState(false);

  const [uploadingPhotoIdBack, setUploadingPhotoIdBack] = useState(false);

  const [examQualifications, setExamQualifications] = useState<
    ExamQualification[]
  >([]);

  const [openSections, setOpenSections] = useState<string[]>(["personal"]);

  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const photoIdFrontInputRef = useRef<HTMLInputElement>(null);
  const photoIdBackInputRef = useRef<HTMLInputElement>(null);

  const isStudent = activeTab === "student";

  function updateField(key: keyof SignupFormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function toggleSection(id: string) {
    setOpenSections((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function openSection(id: string) {
    setOpenSections((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
  }

  function isSectionOpen(id: string) {
    return openSections.includes(id);
  }

  function switchRole(role: Role) {
    setActiveTab(role);
    setError("");
    setSuccess("");
    setOpenSections(["personal"]);
  }

  function fail(message: string, section: string) {
    setError(message);
    openSection(section);
  }

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

  const groupedCourses = useMemo(() => {
    return COURSE_SECTIONS.reduce<Record<CourseGroup, CourseOption[]>>(
      (groups, course) => {
        groups[course.group].push(course);
        return groups;
      },
      {
        "School / Board": [],
        "Government Exams": [],
        "Competitive Exams": [],
        "Skill Development": [],
      },
    );
  }, []);

  function selectCourse(course: CourseOption) {
    setForm((previous) => ({
      ...previous,
      courseWanted: course.key,
      courseWantedTitle: course.label,
      latestQualification: "",
    }));

    setShowCourseDropdown(false);
  }

  function addExamQualification() {
    setExamQualifications((previous) => [
      ...previous,
      { examName: "", score: "", year: "" },
    ]);
  }

  function removeExamQualification(index: number) {
    setExamQualifications((previous) =>
      previous.filter((_, position) => position !== index),
    );
  }

  function updateExamQualification(
    index: number,
    field: keyof ExamQualification,
    value: string,
  ) {
    setExamQualifications((previous) =>
      previous.map((item, position) =>
        position === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function validateReferralCode(value: string) {
    const normalizedCode = value.trim().toUpperCase();

    if (!normalizedCode) {
      setReferralStatus("idle");
      setReferralEducatorName("");
      return true;
    }

    setReferralStatus("checking");
    setReferralEducatorName("");

    try {
      const response = await fetch(
        `/api/referrals/validate?code=${encodeURIComponent(normalizedCode)}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as {
        valid?: boolean;
        referral?: {
          referralCode?: string;
          educatorName?: string;
        };
      };

      if (!response.ok || !payload.valid) {
        setReferralStatus("invalid");
        return false;
      }

      setReferralStatus("valid");

      setReferralEducatorName(payload.referral?.educatorName ?? "");

      setForm((previous) => ({
        ...previous,
        referralCode: payload.referral?.referralCode ?? normalizedCode,
      }));

      return true;
    } catch {
      setReferralStatus("invalid");
      return false;
    }
  }

  async function uploadSignupFile(
    file: File,
    field: "photo" | "cv" | "photoId",
    destination:
      | "profilePhotoUrl"
      | "cvUrl"
      | "photoIdFrontUrl"
      | "photoIdBackUrl",
    setUploading: (value: boolean) => void,
  ) {
    setUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("field", field);

      const response = await fetch("/api/upload/signup", {
        method: "POST",
        body: uploadData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        url?: string;
        message?: string;
      };

      if (!response.ok || !data.success || !data.url) {
        setError(data.message || "File upload failed.");
        return;
      }

      updateField(destination, data.url);
    } catch {
      setError("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadSignupFile(
        file,
        "photo",
        "profilePhotoUrl",
        setUploadingPhoto,
      );
    }
  }

  function handleCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadSignupFile(file, "cv", "cvUrl", setUploadingCv);
    }
  }

  function handlePhotoIdFrontChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadSignupFile(
        file,
        "photoId",
        "photoIdFrontUrl",
        setUploadingPhotoIdFront,
      );
    }
  }

  function handlePhotoIdBackChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadSignupFile(
        file,
        "photoId",
        "photoIdBackUrl",
        setUploadingPhotoIdBack,
      );
    }
  }

  const latestQualifications = useMemo(() => {
    const course = form.courseWanted;

    if (course.startsWith("Class 6 |")) return ["Class 5"];
    if (course.startsWith("Class 7 |")) return ["Class 6"];
    if (course.startsWith("Class 8 |")) return ["Class 7"];
    if (course.startsWith("Class 9 |")) return ["Class 8"];
    if (course.startsWith("Class 10 |")) return ["Class 9"];

    if (course.startsWith("Class 11")) {
      return ["Class 10", "Appearing in Class 11"];
    }

    if (course.startsWith("Class 12")) {
      return ["Class 10", "Class 11", "Appearing in Class 12"];
    }

    if (
      course.startsWith("Govt Exams |") ||
      course.startsWith("Competitive Exams |")
    ) {
      return [
        "Class 10",
        "Class 12",
        "Diploma",
        "Graduation",
        "Post Graduation",
        "Final Year Graduation",
      ];
    }

    return [];
  }, [form.courseWanted]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    setError("");
    setSuccess("");
    setIsPending(true);

    try {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!form.name.trim()) {
        fail("Full name is required.", "personal");
        return;
      }

      if (!emailPattern.test(form.email.trim())) {
        fail("A valid email address is required.", "personal");
        return;
      }

      if (form.password.length < 6) {
        fail("Password must be at least 6 characters.", "personal");
        return;
      }

      if (activeTab === "educator" && form.password !== form.confirmPassword) {
        fail("Passwords do not match.", "personal");
        return;
      }

      if (form.mobile.replace(/\D/g, "").length !== 10) {
        fail("A valid 10-digit mobile number is required.", "personal");
        return;
      }

      if (!form.profilePhotoUrl) {
        fail("Please upload a profile photo.", "personal");
        return;
      }

      if (
        uploadingPhoto ||
        uploadingCv ||
        uploadingPhotoIdFront ||
        uploadingPhotoIdBack
      ) {
        fail(
          "Please finish uploading your files before submitting.",
          "personal",
        );
        return;
      }

      if (isStudent) {
        if (!emailPattern.test(form.parentEmail.trim())) {
          fail("A valid parent email address is required.", "parent");
          return;
        }

        if (form.parentMobile.replace(/\D/g, "").length !== 10) {
          fail("Parent mobile number must contain 10 digits.", "parent");
          return;
        }

        if (form.parentPassword.length < 6) {
          fail("Parent password must be at least 6 characters.", "parent");
          return;
        }

        if (form.parentPassword !== form.parentConfirmPassword) {
          fail("Parent passwords do not match.", "parent");
          return;
        }

        if (!form.courseWanted) {
          fail(
            "Please select a class, board, exam or skill programme.",
            "academic",
          );
          return;
        }

        if (!form.studentType) {
          fail("Please select a student type.", "academic");
          return;
        }

        if (form.studentType === "campus" && !form.campusLocation) {
          fail("Please select your campus.", "academic");
          return;
        }

        if (!form.weakSubjects.trim()) {
          fail("Please enter your weak subjects.", "academic");
          return;
        }

        if (!form.strongSubjects.trim()) {
          fail("Please enter your strong subjects.", "academic");
          return;
        }

        if (form.referralCode.trim()) {
          const valid = await validateReferralCode(form.referralCode);

          if (!valid) {
            fail(
              "The referral code is invalid. Correct it or leave it blank.",
              "academic",
            );
            return;
          }
        }
      }

      if (activeTab === "educator") {
        if (!form.cvUrl) {
          fail("Resume / CV is required.", "professional");
          return;
        }

        if (!form.photoIdFrontUrl) {
          fail("Please upload the front of your photo ID.", "professional");
          return;
        }

        if (!form.photoIdBackUrl) {
          fail("Please upload the back of your photo ID.", "professional");
          return;
        }

        if (employeeType === "educator" && !form.qualification.trim()) {
          fail(
            "Qualification is required for faculty accounts.",
            "professional",
          );
          return;
        }

        if (employeeType === "staff") {
          if (!form.designation.trim()) {
            fail("Please select your designation.", "professional");
            return;
          }

          if (!form.department.trim()) {
            fail("Department is required.", "professional");
            return;
          }

          if (!form.branch.trim()) {
            fail("Branch is required.", "professional");
            return;
          }
        }
      }

      if (!consentAccepted) {
        fail(
          "You must accept the Terms & Conditions, Privacy Policy and data-collection consent.",
          "personal",
        );
        return;
      }

      const body: Record<string, unknown> = {
        role: activeTab === "student" ? "student" : employeeType,
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

      if (isStudent) {
        body.parentName = form.parentName;
        body.parentEmail = form.parentEmail;
        body.parentMobile = form.parentMobile;
        body.parentPassword = form.parentPassword;

        body.courseWanted = form.courseWanted;
        body.courseWantedTitle = form.courseWantedTitle;
        body.studentType = form.studentType;

        body.campusLocation =
          form.studentType === "campus" ? form.campusLocation : "";

        if (form.referralCode.trim()) {
          body.referralCode = form.referralCode.trim().toUpperCase();
        }

        body.weakSubjects = form.weakSubjects
          .split(",")
          .map((subject) => subject.trim())
          .filter(Boolean);

        body.strongSubjects = form.strongSubjects
          .split(",")
          .map((subject) => subject.trim())
          .filter(Boolean);

        body.latestQualification = form.latestQualification;

        body.latestAcademicScore = form.latestAcademicScore;
      }

      if (activeTab === "educator") {
        body.confirmPassword = form.confirmPassword;
        body.cvUrl = form.cvUrl;
        body.photoIdFrontUrl = form.photoIdFrontUrl;
        body.photoIdBackUrl = form.photoIdBackUrl;
      }

      if (activeTab === "educator" && employeeType === "educator") {
        body.qualification = form.qualification;
        body.experience = form.experience;

        body.subjects = form.subjects
          .split(",")
          .map((subject) => subject.trim())
          .filter(Boolean);

        body.examQualifications = examQualifications
          .filter((item) => item.examName.trim())
          .map((item) => ({
            examName: item.examName.trim(),
            score: item.score.trim(),
            year: item.year.trim(),
          }));
      }

      if (activeTab === "educator" && employeeType === "staff") {
        body.designation = form.designation;
        body.department = form.department;
        body.branch = form.branch;
        body.employmentType = form.employmentType;
        body.joiningDate = form.joiningDate;
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
      <header>
        <p className="text-lg font-semibold text-[#174BC3]">
          Account Registration
        </p>

        <h2 className="mt-1 text-sm text-[#526481]">
          Choose your role to get started.
        </h2>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={isStudent}
          onClick={() => switchRole("student")}
          className={`flex min-h-[78px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
            isStudent
              ? "border-blue-600 bg-[#F2F6FF]"
              : "border-[#DDE5F1] hover:bg-slate-50"
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FF] text-[#1956D8]">
            <svg
              viewBox="0 0 24 24"
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m2 10 10-5 10 5-10 5-10-5Z" />
              <path d="M6 12v5c3.6 2.7 8.4 2.7 12 0v-5" />
              <path d="M22 10v6" />
            </svg>
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#102348]">
              Student
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Access courses, learning resources and progress tracking.
            </span>
          </span>

          <span
            className={`h-5 w-5 shrink-0 rounded-full border-2 ${
              isStudent
                ? "border-blue-600 bg-blue-600 shadow-[inset_0_0_0_4px_white]"
                : "border-slate-300"
            }`}
          />
        </button>

        <button
          type="button"
          aria-pressed={!isStudent}
          onClick={() => switchRole("educator")}
          className={`flex min-h-[78px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
            !isStudent
              ? "border-blue-600 bg-[#F2F6FF]"
              : "border-[#DDE5F1] hover:bg-slate-50"
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FF] text-[#1956D8]">
            <svg
              viewBox="0 0 24 24"
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
              <path d="M17 6a3 3 0 0 1 0 6" />
              <path d="M18 15a5 5 0 0 1 3 5" />
            </svg>
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#102348]">
              Faculty / Staff
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Manage teaching, academics and institutional activities.
            </span>
          </span>

          <span
            className={`h-5 w-5 shrink-0 rounded-full border-2 ${
              !isStudent
                ? "border-blue-600 bg-blue-600 shadow-[inset_0_0_0_4px_white]"
                : "border-slate-300"
            }`}
          />
        </button>
      </div>

      {!isStudent && (
        <div className="rounded-xl border border-[#DDE5F1] bg-[#F8FAFD] p-4">
          <p className="mb-3 text-sm font-semibold text-[#102348]">
            Select employee type
          </p>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["educator", "Teaching Faculty"],
                ["staff", "Non-teaching Staff"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={employeeType === value}
                onClick={() => {
                  setEmployeeType(value);
                  setError("");
                }}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                  employeeType === value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-[#DDE5F1] bg-white text-slate-700 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {success}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <RegistrationSection
          id="personal"
          number={1}
          title="Personal Information"
          description="Your account and contact details."
          open={isSectionOpen("personal")}
          onToggle={() => toggleSection("personal")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Full Name"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              required
              placeholder="e.g. Supriya Sharma"
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
              placeholder="Minimum 6 characters"
              hint="At least 6 characters"
            />

            {!isStudent ? (
              <InputField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(value) => updateField("confirmPassword", value)}
                required
                placeholder="Re-enter password"
              />
            ) : (
              <InputField
                label="Mobile Number"
                type="tel"
                value={form.mobile}
                onChange={(value) => updateField("mobile", value)}
                required
                placeholder="10-digit mobile number"
              />
            )}

            {!isStudent && (
              <InputField
                label="Mobile Number"
                type="tel"
                value={form.mobile}
                onChange={(value) => updateField("mobile", value)}
                required
                placeholder="10-digit mobile number"
              />
            )}

            <InputField
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(value) => updateField("dob", value)}
            />

            <FileUpload
              label="Profile Photo"
              buttonText="Choose Photo"
              uploading={uploadingPhoto}
              uploaded={Boolean(form.profilePhotoUrl)}
              onClick={() => photoInputRef.current?.click()}
              inputRef={photoInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoChange}
              hint="PNG, JPG, WEBP — max 5MB"
            />
          </div>
        </RegistrationSection>

        {isStudent && (
          <>
            <RegistrationSection
              id="parent"
              number={2}
              title="Parent / Guardian Information"
              description="A separate parent account keeps guardians informed."
              open={isSectionOpen("parent")}
              onToggle={() => toggleSection("parent")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Parent Name"
                  value={form.parentName}
                  onChange={(value) => updateField("parentName", value)}
                  placeholder="e.g. Ankit Sharma"
                />

                <InputField
                  label="Parent Email"
                  type="email"
                  value={form.parentEmail}
                  onChange={(value) => updateField("parentEmail", value)}
                  required
                  placeholder="parent@example.com"
                />

                <InputField
                  label="Parent Mobile"
                  type="tel"
                  value={form.parentMobile}
                  onChange={(value) => updateField("parentMobile", value)}
                  required
                  placeholder="10-digit mobile number"
                />

                <InputField
                  label="Parent Login Password"
                  type="password"
                  value={form.parentPassword}
                  onChange={(value) => updateField("parentPassword", value)}
                  required
                  placeholder="Minimum 6 characters"
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

              <p className="mt-5 rounded-lg bg-[#F0F5FF] px-4 py-3 text-xs leading-5 text-[#2352A5]">
                A separate parent login account will be created using the
                credentials above.
              </p>
            </RegistrationSection>

            <RegistrationSection
              id="academic"
              number={3}
              title="Academic Information"
              description="Your programme and learning preferences."
              open={isSectionOpen("academic")}
              onToggle={() => toggleSection("academic")}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="student-referral-code"
                    className={LABEL_CLASS}
                  >
                    Educator Referral Code
                    <span className="ml-1 font-normal text-slate-500">
                      (Optional)
                    </span>
                  </label>

                  <input
                    id="student-referral-code"
                    type="text"
                    value={form.referralCode}
                    onChange={(event) => {
                      const value = event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9-]/g, "")
                        .slice(0, 40);

                      updateField("referralCode", value);
                      setReferralStatus("idle");
                      setReferralEducatorName("");
                    }}
                    onBlur={() => {
                      if (form.referralCode.trim()) {
                        void validateReferralCode(form.referralCode);
                      }
                    }}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={40}
                    placeholder="Enter educator referral code"
                    className={`${FIELD_CLASS} uppercase`}
                  />

                  {referralStatus === "checking" && (
                    <p className="mt-2 text-xs text-blue-600">
                      Checking referral code...
                    </p>
                  )}

                  {referralStatus === "valid" && (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Valid referral code
                      {referralEducatorName
                        ? ` — Referred by ${referralEducatorName}`
                        : ""}
                    </p>
                  )}

                  {referralStatus === "invalid" && (
                    <p className="mt-2 text-xs text-rose-600">
                      This referral code is invalid or inactive.
                    </p>
                  )}

                  {referralStatus === "idle" && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Leave blank if no educator referred you.
                    </p>
                  )}
                </div>

                <div ref={courseDropdownRef} className="relative">
                  <label className={LABEL_CLASS}>
                    Class / Board / Government / Competitive Exam / Skill
                    Program
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    aria-expanded={showCourseDropdown}
                    onClick={() =>
                      setShowCourseDropdown((previous) => !previous)
                    }
                    className={`${FIELD_CLASS} flex items-center justify-between gap-3 text-left`}
                  >
                    <span
                      className={
                        form.courseWantedTitle
                          ? "text-[#14264A]"
                          : "text-slate-400"
                      }
                    >
                      {form.courseWantedTitle ||
                        "Select class, board, exam or skill"}
                    </span>

                    <span
                      aria-hidden="true"
                      className="shrink-0 text-slate-500"
                    >
                      ▾
                    </span>
                  </button>

                  {showCourseDropdown && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[#DDE5F1] bg-white p-2 shadow-xl">
                      {(
                        Object.entries(groupedCourses) as [
                          CourseGroup,
                          CourseOption[],
                        ][]
                      ).map(([group, courses]) => (
                        <div key={group} className="mb-2 last:mb-0">
                          <p className="px-3 py-2 text-xs font-bold text-slate-500">
                            {group}
                          </p>

                          {courses.map((course) => (
                            <button
                              type="button"
                              key={course.key}
                              onClick={() => selectCourse(course)}
                              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                form.courseWanted === course.key
                                  ? "bg-blue-50 font-semibold text-blue-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="block">{course.label}</span>

                              <span className="mt-0.5 block text-[11px] text-slate-400">
                                {course.key}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Student Type
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      {
                        value: "online",
                        title: "Online",
                        description: "Learn from anywhere",
                      },
                      {
                        value: "campus",
                        title: "Campus",
                        description: "Attend in person",
                      },
                      {
                        value: "home",
                        title: "Home Tutor",
                        description: "At your residence",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={form.studentType === option.value}
                        onClick={() => {
                          setForm((previous) => ({
                            ...previous,
                            studentType: option.value,
                            campusLocation:
                              option.value === "campus"
                                ? previous.campusLocation
                                : "",
                          }));
                        }}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                          form.studentType === option.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-[#DDE5F1] hover:border-blue-300"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            form.studentType === option.value
                              ? "border-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {form.studentType === option.value && (
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          )}
                        </span>

                        <span>
                          <span className="block text-xs font-semibold text-slate-900">
                            {option.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {form.studentType === "campus" && (
                  <div>
                    <label className={LABEL_CLASS}>
                      Campus Location
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <select
                      value={form.campusLocation}
                      onChange={(event) =>
                        updateField("campusLocation", event.target.value)
                      }
                      className={FIELD_CLASS}
                    >
                      <option value="">Select campus</option>
                      <option value="vashi">Vashi Campus</option>
                      <option value="panvel">Panvel Campus</option>
                    </select>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Weak Subjects (comma separated)"
                    value={form.weakSubjects}
                    onChange={(value) => updateField("weakSubjects", value)}
                    required
                    placeholder="e.g. Mathematics, Physics"
                  />

                  <InputField
                    label="Strong Subjects (comma separated)"
                    value={form.strongSubjects}
                    onChange={(value) => updateField("strongSubjects", value)}
                    required
                    placeholder="e.g. English, Biology"
                  />
                </div>
              </div>
            </RegistrationSection>

            {!form.courseWanted.startsWith("Skills |") && (
              <RegistrationSection
                id="background"
                number={4}
                title="Academic Background"
                description="Your latest completed class or qualification."
                open={isSectionOpen("background")}
                onToggle={() => toggleSection("background")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>
                      Latest Completed Class / Qualification
                    </label>

                    <select
                      value={form.latestQualification}
                      onChange={(event) =>
                        updateField("latestQualification", event.target.value)
                      }
                      className={FIELD_CLASS}
                    >
                      <option value="">Select qualification</option>

                      {latestQualifications.map((qualification) => (
                        <option key={qualification} value={qualification}>
                          {qualification}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1.5 text-xs text-slate-500">
                      Options depend on your selected programme.
                    </p>
                  </div>

                  <InputField
                    label="Latest Academic Score"
                    value={form.latestAcademicScore}
                    onChange={(value) =>
                      updateField("latestAcademicScore", value)
                    }
                    placeholder="e.g. 85%, 8.5 CGPA"
                  />
                </div>
              </RegistrationSection>
            )}
          </>
        )}

        {!isStudent && (
          <RegistrationSection
            id="professional"
            number={2}
            title={
              employeeType === "staff"
                ? "Employment Information"
                : "Professional Information"
            }
            description="Your professional experience and verification documents."
            open={isSectionOpen("professional")}
            onToggle={() => toggleSection("professional")}
          >
            {employeeType === "educator" ? (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>

                <InputField
                  label="Subjects You Can Teach (comma separated)"
                  value={form.subjects}
                  onChange={(value) => updateField("subjects", value)}
                  placeholder="e.g. Mathematics, Physics"
                />

                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className={LABEL_CLASS}>Exam Qualifications</label>

                    <button
                      type="button"
                      onClick={addExamQualification}
                      className={BUTTON_CLASS}
                    >
                      + Add Exam
                    </button>
                  </div>

                  {examQualifications.map((qualification, index) => (
                    <div
                      key={index}
                      className="mb-3 rounded-lg border border-[#DDE5F1] bg-slate-50 p-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          value={qualification.examName}
                          onChange={(event) =>
                            updateExamQualification(
                              index,
                              "examName",
                              event.target.value,
                            )
                          }
                          placeholder="Exam name"
                          className={FIELD_CLASS}
                        />

                        <input
                          value={qualification.score}
                          onChange={(event) =>
                            updateExamQualification(
                              index,
                              "score",
                              event.target.value,
                            )
                          }
                          placeholder="Score / Rank"
                          className={FIELD_CLASS}
                        />

                        <input
                          value={qualification.year}
                          onChange={(event) =>
                            updateExamQualification(
                              index,
                              "year",
                              event.target.value,
                            )
                          }
                          placeholder="Attempt year"
                          className={FIELD_CLASS}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExamQualification(index)}
                        className="mt-3 text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <p className="text-xs text-slate-500">
                    Include NEET, JEE, MHT CET, GATE or other relevant
                    examinations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>
                    Designation
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    value={form.designation}
                    onChange={(event) =>
                      updateField("designation", event.target.value)
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="">Select designation</option>

                    {[
                      "Receptionist",
                      "Office Admin",
                      "Branch Manager",
                      "Accountant",
                      "HR",
                      "Counsellor",
                      "Operations",
                      "Support",
                      "Marketing",
                      "Sales",
                      "IT Support",
                      "Other",
                    ].map((designation) => (
                      <option key={designation} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Department"
                  value={form.department}
                  onChange={(value) => updateField("department", value)}
                  required
                  placeholder="e.g. Operations"
                />

                <InputField
                  label="Branch"
                  value={form.branch}
                  onChange={(value) => updateField("branch", value)}
                  required
                  placeholder="e.g. Panvel"
                />

                <div>
                  <label className={LABEL_CLASS}>Employment Type</label>

                  <select
                    value={form.employmentType}
                    onChange={(event) =>
                      updateField("employmentType", event.target.value)
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <InputField
                  label="Joining Date"
                  type="date"
                  value={form.joiningDate}
                  onChange={(value) => updateField("joiningDate", value)}
                />
              </div>
            )}

            <div className="mt-6 space-y-5 border-t border-[#E8EDF5] pt-5">
              <h4 className="text-sm font-semibold text-[#102348]">
                Verification Documents
              </h4>

              <FileUpload
                label="Upload CV / Resume"
                buttonText="Choose CV"
                uploading={uploadingCv}
                uploaded={Boolean(form.cvUrl)}
                onClick={() => cvInputRef.current?.click()}
                inputRef={cvInputRef}
                accept=".pdf,.doc,.docx"
                onChange={handleCvChange}
                hint="PDF, DOC, DOCX — max 5MB"
              />

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <h5 className="text-sm font-semibold text-amber-900">
                  Photo ID for Verification
                </h5>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Upload clear images of the front and back of a valid
                  government photo ID for administrator verification.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FileUpload
                    label="Photo ID — Front"
                    buttonText="Choose Front Image"
                    uploading={uploadingPhotoIdFront}
                    uploaded={Boolean(form.photoIdFrontUrl)}
                    onClick={() => photoIdFrontInputRef.current?.click()}
                    inputRef={photoIdFrontInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoIdFrontChange}
                    hint="PNG, JPG, WEBP"
                  />

                  <FileUpload
                    label="Photo ID — Back"
                    buttonText="Choose Back Image"
                    uploading={uploadingPhotoIdBack}
                    uploaded={Boolean(form.photoIdBackUrl)}
                    onClick={() => photoIdBackInputRef.current?.click()}
                    inputRef={photoIdBackInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoIdBackChange}
                    hint="PNG, JPG, WEBP"
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Accepted IDs: Aadhaar Card, PAN Card, Passport, Voter ID or
                  Driving Licence. Maximum 5MB per image.
                </p>
              </div>
            </div>
          </RegistrationSection>
        )}

        <RegistrationSection
          id="address"
          number={isStudent ? 5 : 3}
          title="Address"
          description="Your residential and contact details."
          open={isSectionOpen("address")}
          onToggle={() => toggleSection("address")}
        >
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
        </RegistrationSection>

        <div className="border-t border-[#E8EDF5] pt-6">
          <div className="flex items-start gap-3">
            <input
              id="signup-consent"
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
            />

            <label
              htmlFor="signup-consent"
              className="text-xs leading-6 text-slate-600"
            >
              I acknowledge and consent to the collection, storage and
              processing of my personal data and uploaded documents (including
              resume/CV and photo ID images) by SmartIQ Institute as described
              in the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline"
              >
                Terms &amp; Conditions
              </a>
              ,{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline"
              >
                Privacy Policy
              </a>
              , and{" "}
              <a
                href="/eula"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline"
              >
                EULA
              </a>
              . I understand that SmartIQ Institute is not liable for any loss
              or misuse of the documents I submit.{" "}
              <span className="font-semibold text-red-500">*</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#1956E8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1046CB] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Submitting..."
            : isStudent
              ? "Create Account"
              : "Submit for Approval"}

          {!isPending && <span aria-hidden="true">→</span>}
        </button>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-[#1956E8] hover:underline"
          >
            Sign In
          </a>
        </p>

        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Password reset is only available after administrator verification.
          Please remember your password or contact our team for assistance.
        </p>
      </form>
    </div>
  );
}
