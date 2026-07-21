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

  profilePhotoUrl: string;
  cvUrl: string;
  photoIdFrontUrl: string;
  photoIdBackUrl: string;
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

const GOVT_EXAM_OPTIONS = [
  // UPSC
  {
    key: "UPSC-COMPLETE",
    label: "UPSC Civil Services — Complete Preparation",
  },

  // State PSC
  {
    key: "ALL-STATE-PSC",
    label: "All State PSC Exams",
  },
  {
    key: "MPSC",
    label: "MPSC",
  },
  {
    key: "UPPSC",
    label: "UPPSC",
  },
  {
    key: "BPSC",
    label: "BPSC",
  },
  {
    key: "RPSC",
    label: "RPSC",
  },
  {
    key: "MPPSC",
    label: "MPPSC",
  },
  {
    key: "GPSC",
    label: "GPSC",
  },
  {
    key: "WBPSC",
    label: "WBPSC",
  },
  {
    key: "KPSC",
    label: "KPSC",
  },
  {
    key: "TNPSC",
    label: "TNPSC",
  },
  {
    key: "OTHER-STATE-PSC",
    label: "Other State PSC Exams",
  },

  // Banking
  {
    key: "ALL-BANKING",
    label: "All Banking Exams",
  },
  {
    key: "IBPS-PO",
    label: "IBPS PO",
  },
  {
    key: "IBPS-CLERK",
    label: "IBPS Clerk",
  },
  {
    key: "IBPS-SO",
    label: "IBPS Specialist Officer",
  },
  {
    key: "SBI-PO",
    label: "SBI PO",
  },
  {
    key: "SBI-CLERK",
    label: "SBI Clerk",
  },
  {
    key: "RRB-PO",
    label: "RRB PO",
  },
  {
    key: "RRB-CLERK",
    label: "RRB Clerk",
  },

  // Regulatory and Insurance
  {
    key: "ALL-REGULATORY-INSURANCE",
    label: "All Regulatory & Insurance Exams",
  },
  {
    key: "RBI-GRADE-B",
    label: "RBI Grade B",
  },
  {
    key: "RBI-ASSISTANT",
    label: "RBI Assistant",
  },
  {
    key: "NABARD-GRADE-A",
    label: "NABARD Grade A",
  },
  {
    key: "SEBI-GRADE-A",
    label: "SEBI Grade A",
  },
  {
    key: "IRDAI-ASSISTANT-MANAGER",
    label: "IRDAI Assistant Manager",
  },
  {
    key: "LIC-AAO",
    label: "LIC AAO",
  },
  {
    key: "LIC-ADO",
    label: "LIC ADO",
  },
  {
    key: "NIACL-AO",
    label: "NIACL AO",
  },
  {
    key: "GIC-ASSISTANT-MANAGER",
    label: "GIC Assistant Manager",
  },

  // SSC
  {
    key: "ALL-SSC",
    label: "All SSC Exams",
  },
  {
    key: "SSC-CGL",
    label: "SSC CGL",
  },
  {
    key: "SSC-CHSL",
    label: "SSC CHSL",
  },
  {
    key: "SSC-MTS",
    label: "SSC MTS",
  },
  {
    key: "SSC-CPO",
    label: "SSC CPO / Sub Inspector",
  },
  {
    key: "SSC-GD",
    label: "SSC GD Constable",
  },
  {
    key: "SSC-STENOGRAPHER",
    label: "SSC Stenographer",
  },
  {
    key: "SSC-JE",
    label: "SSC Junior Engineer",
  },
  {
    key: "SSC-SELECTION-POST",
    label: "SSC Selection Post",
  },

  // Teaching and Academic Eligibility
  {
    key: "ALL-TEACHING-ACADEMIC",
    label: "All Teaching & Academic Eligibility Exams",
  },
  {
    key: "CTET",
    label: "CTET",
  },
  {
    key: "STATE-TET",
    label: "State TET",
  },
  {
    key: "DSSSB",
    label: "DSSSB",
  },
  {
    key: "KVS",
    label: "KVS",
  },
  {
    key: "NVS",
    label: "NVS",
  },
  {
    key: "UGC-NET",
    label: "UGC NET",
  },
  {
    key: "CSIR-NET",
    label: "CSIR NET",
  },
  {
    key: "SET",
    label: "SET",
  },

  // Police and Army Bharti
  {
    key: "ALL-POLICE-ARMY-BHARTI",
    label: "All Police / Army Bharti Exams",
  },
  {
    key: "POLICE-BHARTI",
    label: "Police Bharti",
  },
  {
    key: "ARMY-BHARTI",
    label: "Army Bharti",
  },
  {
    key: "POLICE-SI",
    label: "Police Sub Inspector",
  },
  {
    key: "POLICE-CONSTABLE",
    label: "Police Constable",
  },

  // Railways
  {
    key: "ALL-RAILWAY",
    label: "All Railway Exams",
  },
  {
    key: "RRB-NTPC",
    label: "RRB NTPC",
  },
  {
    key: "RRB-GROUP-D",
    label: "RRB Group D",
  },
  {
    key: "RRB-ALP",
    label: "RRB ALP",
  },
  {
    key: "RRB-TECHNICIAN",
    label: "RRB Technician",
  },
  {
    key: "RRB-JE",
    label: "RRB Junior Engineer",
  },
  {
    key: "RPF-CONSTABLE",
    label: "RPF Constable",
  },
  {
    key: "RPF-SUB-INSPECTOR",
    label: "RPF Sub Inspector",
  },

  // Defence and Paramilitary
  {
    key: "ALL-DEFENCE-PARAMILITARY",
    label: "All Defence & Paramilitary Exams",
  },
  {
    key: "NDA",
    label: "NDA",
  },
  {
    key: "CDS",
    label: "CDS",
  },
  {
    key: "AFCAT",
    label: "AFCAT",
  },
  {
    key: "CAPF-AC",
    label: "CAPF Assistant Commandant",
  },
  {
    key: "ARMY-AGNIVEER",
    label: "Army Agniveer",
  },
  {
    key: "NAVY-AGNIVEER",
    label: "Navy Agniveer",
  },
  {
    key: "AIRFORCE-AGNIVEER",
    label: "Air Force Agniveer",
  },
  {
    key: "INDIAN-COAST-GUARD",
    label: "Indian Coast Guard",
  },
  {
    key: "SSB-INTERVIEW",
    label: "SSB Interview Preparation",
  },
];
const COMPETITIVE_EXAM_OPTIONS = [
  // Engineering and Medical Entrance Exams
  {
    key: "JEE",
    label: "JEE Main & Advanced Preparation",
  },
  {
    key: "NEET",
    label: "NEET UG Preparation",
  },
  {
    key: "MHT-CET",
    label: "MHT CET Preparation",
  },

  // LLB and Law Entrance Exams
  {
    key: "ALL-LAW-ENTRANCE",
    label: "All LLB & Law Entrance Exams",
  },
  {
    key: "MH-CET-LAW-3-YEAR",
    label: "MH CET Law 3 Year",
  },
  {
    key: "MH-CET-LAW-5-YEAR",
    label: "MH CET Law 5 Year",
  },
  {
    key: "CLAT",
    label: "CLAT",
  },
  {
    key: "AILET",
    label: "AILET",
  },
  {
    key: "LSAT-INDIA",
    label: "LSAT India",
  },

  // MBA Entrance Exams
  {
    key: "ALL-MBA-ENTRANCE",
    label: "All MBA Entrance Exams",
  },
  {
    key: "MBA-CET",
    label: "MBA CET",
  },
  {
    key: "CAT",
    label: "CAT",
  },
  {
    key: "CMAT",
    label: "CMAT",
  },
  {
    key: "MAT",
    label: "MAT",
  },
  {
    key: "XAT",
    label: "XAT",
  },
  {
    key: "SNAP",
    label: "SNAP",
  },
  {
    key: "NMAT",
    label: "NMAT",
  },
  {
    key: "ATMA",
    label: "ATMA",
  },

  // GATE and Postgraduate Technical Exams
  {
    key: "ALL-GATE-PG-TECHNICAL",
    label: "All GATE & Postgraduate Technical Exams",
  },
  {
    key: "GATE",
    label: "GATE",
  },
  {
    key: "IIT-JAM",
    label: "IIT JAM",
  },
  {
    key: "CEED",
    label: "CEED",
  },
  {
    key: "PGCET",
    label: "PGCET",
  },
  {
    key: "PSU-THROUGH-GATE",
    label: "PSU Recruitment through GATE",
  },

  // MHT CET Categories
  {
    key: "ALL-MHT-CET",
    label: "All MHT CET Exam Categories",
  },
  {
    key: "MHT-CET-ENGINEERING",
    label: "MHT CET Engineering",
  },
  {
    key: "MHT-CET-PHARMACY",
    label: "MHT CET Pharmacy",
  },
  {
    key: "MHT-CET-BBA-BCA-BMS",
    label: "MHT CET BBA / BCA / BMS",
  },
  {
    key: "MHT-CET-DESIGN",
    label: "MHT CET Design",
  },
  {
    key: "MHT-CET-HOTEL-MANAGEMENT",
    label: "MHT CET Hotel Management",
  },
  {
    key: "MHT-CET-NURSING",
    label: "MHT CET Nursing",
  },
  {
    key: "MHT-CET-EDUCATION",
    label: "MHT CET B.Ed / B.P.Ed",
  },
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

  ...COMPETITIVE_EXAM_OPTIONS.map((exam) => ({
    key: `Competitive Exams | ${exam.key}`,
    label: exam.label,
    group: "Competitive Exams" as const,
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

    profilePhotoUrl: "",
    cvUrl: "",
    photoIdFrontUrl: "",
    photoIdBackUrl: "",
  };
}

export function RegistrationForm() {
  const [activeTab, setActiveTab] = useState<"student" | "educator">("student");
  const [form, setForm] = useState<SignupFormData>(getInitialFormData());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [referralStatus, setReferralStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");

  const [referralEducatorName, setReferralEducatorName] = useState("");

  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingPhotoIdFront, setUploadingPhotoIdFront] = useState(false);
  const [uploadingPhotoIdBack, setUploadingPhotoIdBack] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [examQualifications, setExamQualifications] = useState<
    { examName: string; score: string; year: string }[]
  >([]);

  function addExamQualification() {
    setExamQualifications((prev) => [
      ...prev,
      { examName: "", score: "", year: "" },
    ]);
  }

  function removeExamQualification(index: number) {
    setExamQualifications((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExamQualification(
    index: number,
    field: "examName" | "score" | "year",
    value: string,
  ) {
    setExamQualifications((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const photoIdFrontInputRef = useRef<HTMLInputElement>(null);
  const photoIdBackInputRef = useRef<HTMLInputElement>(null);

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
        "Competitive Exams": [],
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
        error?: string;
        referral?: {
          referralCode?: string;
          educatorName?: string;
        };
      };

      if (!response.ok || !payload.valid) {
        setReferralStatus("invalid");
        setReferralEducatorName("");
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
      setReferralEducatorName("");
      return false;
    }
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

  async function handlePhotoIdUpload(file: File, side: "front" | "back") {
    const setUploading =
      side === "front" ? setUploadingPhotoIdFront : setUploadingPhotoIdBack;
    setUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("field", "photoId");

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
        updateField(
          side === "front" ? "photoIdFrontUrl" : "photoIdBackUrl",
          data.url,
        );
      } else {
        setError(data.message || `Photo ID ${side} upload failed.`);
      }
    } catch {
      setError(`Photo ID ${side} upload failed.`);
    } finally {
      setUploading(false);
    }
  }

  function handlePhotoIdFrontChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoIdUpload(file, "front");
    }
  }

  function handlePhotoIdBackChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoIdUpload(file, "back");
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
            "Please select a class, board, government exam, competitive exam, or skill program.",
          );
          return;
        }
        if (form.referralCode.trim()) {
          const referralIsValid = await validateReferralCode(form.referralCode);

          if (!referralIsValid) {
            setError(
              "The referral code is invalid. Correct it or leave the field blank.",
            );
            return;
          }
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

        if (!form.cvUrl) {
          setError("Resume / CV is required for faculty accounts.");
          return;
        }

        if (!form.photoIdFrontUrl) {
          setError(
            "Photo ID front image is required for faculty verification.",
          );
          return;
        }

        if (!form.photoIdBackUrl) {
          setError("Photo ID back image is required for faculty verification.");
          return;
        }
      }

      if (!consentAccepted) {
        setError(
          "You must accept the Terms & Conditions, Privacy Policy, and consent to data collection to create an account.",
        );
        return;
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

        if (form.referralCode.trim()) {
          body.referralCode = form.referralCode.trim().toUpperCase();
        }

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

        body.latestQualification = form.latestQualification;
        body.latestAcademicScore = form.latestAcademicScore;
      }

      if (activeTab === "educator") {
        body.confirmPassword = form.confirmPassword;
        body.qualification = form.qualification;
        body.experience = form.experience;
        body.cvUrl = form.cvUrl;
        body.photoIdFrontUrl = form.photoIdFrontUrl;
        body.photoIdBackUrl = form.photoIdBackUrl;

        body.subjects = form.subjects
          ? form.subjects
              .split(",")
              .map((subject) => subject.trim())
              .filter(Boolean)
          : [];

        body.examQualifications = examQualifications
          .filter((eq) => eq.examName.trim())
          .map((eq) => ({
            examName: eq.examName.trim(),
            score: eq.score.trim(),
            year: eq.year.trim(),
          }));
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
              placeholder="e.g. Supriya"
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
                <span className="text-xs text-emerald-600">Photo uploaded</span>
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
                  placeholder="e.g. Ankit"
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
                <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                  <label
                    htmlFor="student-referral-code"
                    className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-violet-700"
                  >
                    Referral Code{" "}
                    <span className="normal-case font-semibold text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    id="student-referral-code"
                    type="text"
                    value={form.referralCode}
                    onChange={(event) => {
                      const normalizedValue = event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9-]/g, "")
                        .slice(0, 40);

                      updateField("referralCode", normalizedValue);

                      setReferralStatus("idle");
                      setReferralEducatorName("");
                    }}
                    onBlur={() => {
                      if (form.referralCode.trim()) {
                        void validateReferralCode(form.referralCode);
                      }
                    }}
                    placeholder="Enter educator referral code"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={40}
                    className={`w-full rounded-2xl border bg-white px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none transition-all placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-300 focus:ring-4 ${
                      referralStatus === "valid"
                        ? "border-emerald-300 ring-emerald-500/10"
                        : referralStatus === "invalid"
                          ? "border-rose-300 ring-rose-500/10"
                          : "border-violet-100 ring-violet-500/10"
                    }`}
                  />

                  {referralStatus === "checking" ? (
                    <p className="ml-1 mt-2 text-[11px] font-semibold text-violet-600">
                      Checking referral code...
                    </p>
                  ) : null}

                  {referralStatus === "valid" ? (
                    <p className="ml-1 mt-2 text-[11px] font-bold text-emerald-600">
                      Valid referral code
                      {referralEducatorName
                        ? ` — Referred by ${referralEducatorName}`
                        : ""}
                    </p>
                  ) : null}

                  {referralStatus === "invalid" ? (
                    <p className="ml-1 mt-2 text-[11px] font-bold text-rose-600">
                      This referral code is invalid or inactive.
                    </p>
                  ) : null}

                  {referralStatus === "idle" ? (
                    <p className="ml-1 mt-2 text-[10px] leading-4 text-slate-400">
                      Leave this blank when no educator referred you.
                    </p>
                  ) : null}
                </div>

                <div ref={courseDropdownRef} className="relative">
                  <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                    Class / Board / Government / Competitive Exam / Skill
                    Program
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
                    placeholder="Search class, board, government exam, competitive exam, or skill..."
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
                    <option value="online">Online Learning</option>
                    <option value="centre-based">Centre-Based Learning</option>
                    <option value="home">Home Tutor</option>
                  </select>
                </div>

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
            </div>
            {!form.courseWanted.startsWith("Skills |") && (
              <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
                <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-[var(--color-primary)]">
                  Academic Background
                </h3>

                <p className="mb-4 text-xs text-slate-400">
                  Share your latest completed class or qualification to help us
                  guide you better.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                      Latest Completed Class / Qualification{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.latestQualification}
                      onChange={(event) =>
                        updateField("latestQualification", event.target.value)
                      }
                      className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all focus:ring-4"
                    >
                      <option value="">Select qualification</option>

                      {form.courseWanted.startsWith("Class 6 |") && (
                        <option value="Class 5">Class 5</option>
                      )}

                      {form.courseWanted.startsWith("Class 7 |") && (
                        <option value="Class 6">Class 6</option>
                      )}

                      {form.courseWanted.startsWith("Class 8 |") && (
                        <option value="Class 7">Class 7</option>
                      )}

                      {form.courseWanted.startsWith("Class 9 |") && (
                        <option value="Class 8">Class 8</option>
                      )}

                      {form.courseWanted.startsWith("Class 10 |") && (
                        <option value="Class 9">Class 9</option>
                      )}

                      {form.courseWanted.startsWith("Class 11") && (
                        <>
                          <option value="Class 10">Class 10</option>
                          <option value="Appearing in Class 11">
                            Appearing in Class 11
                          </option>
                        </>
                      )}

                      {form.courseWanted.startsWith("Class 12") && (
                        <>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Appearing in Class 12">
                            Appearing in Class 12
                          </option>
                        </>
                      )}
                      {(form.courseWanted.startsWith("Govt Exams |") ||
                        form.courseWanted.startsWith(
                          "Competitive Exams |",
                        )) && (
                        <>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 12">Class 12</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Graduation">Graduation</option>
                          <option value="Post Graduation">
                            Post Graduation
                          </option>
                          <option value="Final Year Graduation">
                            Final Year Graduation
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  <InputField
                    label="Latest Academic Score"
                    value={form.latestAcademicScore}
                    onChange={(value) =>
                      updateField("latestAcademicScore", value)
                    }
                    required
                    placeholder="e.g. 85%, 8.5 CGPA, First Class"
                  />
                </div>
              </div>
            )}
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                    Exam Qualifications
                  </label>

                  <button
                    type="button"
                    onClick={addExamQualification}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 transition-all hover:bg-blue-100"
                  >
                    + Add Exam
                  </button>
                </div>

                {examQualifications.length > 0 && (
                  <div className="space-y-2">
                    {examQualifications.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                      >
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={item.examName}
                            onChange={(e) =>
                              updateExamQualification(
                                index,
                                "examName",
                                e.target.value,
                              )
                            }
                            placeholder="Exam name (e.g. NEET, JEE Mains)"
                            className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.score}
                              onChange={(e) =>
                                updateExamQualification(
                                  index,
                                  "score",
                                  e.target.value,
                                )
                              }
                              placeholder="Score / Rank"
                              className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                            />

                            <input
                              type="text"
                              value={item.year}
                              onChange={(e) =>
                                updateExamQualification(
                                  index,
                                  "year",
                                  e.target.value,
                                )
                              }
                              placeholder="Attempt year"
                              className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeExamQualification(index)}
                          className="mt-1 shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-500 transition-all hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  Add any competitive exam qualifications (NEET, JEE, MHTCET,
                  GATE, etc.) to strengthen your profile.
                </p>
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  Upload CV / Resume <span className="text-red-500">*</span>
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

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <label className="mb-1.5 ml-1 block text-xs font-black uppercase tracking-widest text-amber-700">
                  <i className="bi bi-shield-lock me-1" />
                  Photo ID for Verification{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="mb-3 text-[11px] text-amber-600/80">
                  Upload front and back images of a valid photo ID such as
                  Aadhar Card, PAN Card, Passport, or Driver's License. This is
                  required for account verification.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-heading)]">
                      Photo ID — Front <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoIdFrontInputRef.current?.click()}
                        disabled={uploadingPhotoIdFront}
                        className="rounded-xl border border-dashed border-amber-300 bg-white px-3 py-2 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
                      >
                        {uploadingPhotoIdFront
                          ? "Uploading..."
                          : "Choose Front Image"}
                      </button>
                      <input
                        ref={photoIdFrontInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handlePhotoIdFrontChange}
                      />
                      {form.photoIdFrontUrl && (
                        <span className="text-[11px] text-emerald-600">
                          <i className="bi bi-check-circle me-1" />
                          Uploaded
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-heading)]">
                      Photo ID — Back <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoIdBackInputRef.current?.click()}
                        disabled={uploadingPhotoIdBack}
                        className="rounded-xl border border-dashed border-amber-300 bg-white px-3 py-2 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
                      >
                        {uploadingPhotoIdBack
                          ? "Uploading..."
                          : "Choose Back Image"}
                      </button>
                      <input
                        ref={photoIdBackInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handlePhotoIdBackChange}
                      />
                      {form.photoIdBackUrl && (
                        <span className="text-[11px] text-emerald-600">
                          <i className="bi bi-check-circle me-1" />
                          Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[10px] text-slate-400">
                  Accepted IDs: Aadhar Card, PAN Card, Passport, Voter ID,
                  Driver's License. Images must be clear and readable. (PNG,
                  JPG, WEBP — max 5MB each)
                </p>
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

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs leading-5 text-[var(--color-muted)]">
              I acknowledge and consent to the collection, storage, and
              processing of my personal data and uploaded documents (including
              resume/CV and photo ID images) by Smart Tutors as described in the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Terms &amp; Conditions
              </a>
              ,{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Privacy Policy
              </a>
              , and{" "}
              <a
                href="/eula"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:text-blue-700 underline"
              >
                EULA
              </a>
              . I understand that Smart Tutors is not liable for any loss or
              misuse of the documents I submit.{" "}
              <span className="text-red-500 font-bold">*</span>
            </span>
          </label>
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

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-medium text-amber-800">
            Password reset is only available after administrator verification.
            Please remember your password or contact our team for assistance.
          </p>
        </div>

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
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
        />
      )}

      {hint && <p className="ml-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}
