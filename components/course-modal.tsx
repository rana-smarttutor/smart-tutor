"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  House,
  MapPin,
  Monitor,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import type { CourseItem } from "@/lib/types";
import { requestLoginIfNeeded } from "@/lib/request-login";

interface CourseModalProps {
  course: CourseItem | null;
  onClose: () => void;
  initialAdditionalCourse?: string;
  programTopics?: string[];
}

type Step = 1 | 2 | 3;

const MHT_CET_EXAMS = [
  "Engineering (B.E./B.Tech)",
  "Pharmacy (B.Pharm)",
  "BBA / BCA / BMS",
  "Law (LLB - 3 year / 5 year)",
  "Design (B.Des)",
  "Hotel Management (B.HMCT)",
  "Nursing",
  "B.Ed / B.P.Ed",
];

const SESSION_SLOTS = [
  "8:00 AM – 9:30 AM",
  "10:00 AM – 11:30 AM",
  "12:00 PM – 1:30 PM",
  "2:00 PM – 3:30 PM",
  "4:00 PM – 5:30 PM",
  "6:00 PM – 7:30 PM",
  "8:00 PM – 9:30 PM",
];

const TUITION_MODES = [
  {
    value: "Home Tutor",
    title: "Home Tutor",
    description: "In-person classes at your home",
    icon: House,
  },
  {
    value: "Online Tutor",
    title: "Online Tutor",
    description: "Live interactive online classes",
    icon: Monitor,
  },
  {
    value: "Offline Campus",
    title: "Offline Campus",
    description: "In-person classes at our campus",
    icon: GraduationCap,
  },
] as const;

const BOARD_OPTIONS = [
  "Maharashtra State Board",
  "CBSE",
  "CISCE (ICSE / ISC)",
  "Cambridge (IGCSE / A Level)",
  "IB",
] as const;

type BoardName = (typeof BOARD_OPTIONS)[number];

const SENIOR_SECONDARY_STREAMS = ["Science", "Commerce", "Arts"] as const;

type SeniorSecondaryStream = (typeof SENIOR_SECONDARY_STREAMS)[number];

type BoardSubjectGroups = {
  middle: string[];
  secondary: string[];
  senior: Record<SeniorSecondaryStream, string[]>;
};

const OTHER_SUBJECT_OPTION = "Other / School-specific subject";

const SUBJECTS_BY_BOARD: Record<BoardName, BoardSubjectGroups> = {
  "Maharashtra State Board": {
    middle: [
      "English",
      "Marathi",
      "Hindi / Sanskrit",
      "Mathematics",
      "General Science",
      "History & Civics",
      "Geography",
      "Computer / IT",
    ],
    secondary: [
      "English",
      "Marathi",
      "Hindi / Sanskrit",
      "Mathematics",
      "Science & Technology",
      "History & Political Science",
      "Geography",
      "Information Technology",
    ],
    senior: {
      Science: [
        "English",
        "Physics",
        "Chemistry",
        "Mathematics & Statistics",
        "Biology",
        "Computer Science",
        "Information Technology",
        "Electronics",
      ],
      Commerce: [
        "English",
        "Book-Keeping & Accountancy",
        "Organisation of Commerce & Management (OCM)",
        "Economics",
        "Mathematics & Statistics",
        "Secretarial Practice",
        "Information Technology",
        "Marathi / Hindi",
      ],
      Arts: [
        "English",
        "Marathi / Hindi",
        "History",
        "Geography",
        "Political Science",
        "Sociology",
        "Psychology",
        "Economics",
        "Mathematics & Statistics",
        "Information Technology",
      ],
    },
  },

  CBSE: {
    middle: [
      "English",
      "Hindi",
      "Mathematics",
      "Science",
      "Social Science",
      "Sanskrit",
      "Computer / Artificial Intelligence",
    ],
    secondary: [
      "English",
      "Hindi",
      "Mathematics",
      "Science",
      "Social Science",
      "Sanskrit",
      "Information Technology / Artificial Intelligence",
      "Skill Subject",
    ],
    senior: {
      Science: [
        "English Core",
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Computer Science",
        "Informatics Practices",
        "Physical Education",
        "Economics",
      ],
      Commerce: [
        "English Core",
        "Accountancy",
        "Business Studies",
        "Economics",
        "Mathematics / Applied Mathematics",
        "Entrepreneurship",
        "Informatics Practices",
        "Computer Science",
        "Physical Education",
      ],
      Arts: [
        "English Core",
        "History",
        "Political Science",
        "Geography",
        "Psychology",
        "Sociology",
        "Economics",
        "Mathematics / Applied Mathematics",
        "Fine Arts",
        "Physical Education",
      ],
    },
  },

  "CISCE (ICSE / ISC)": {
    middle: [
      "English",
      "Second Language",
      "Mathematics",
      "Science",
      "History & Civics",
      "Geography",
      "Computer Applications",
    ],
    secondary: [
      "English Language",
      "English Literature",
      "Second Language",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "History & Civics",
      "Geography",
      "Computer Applications",
      "Commercial Studies",
    ],
    senior: {
      Science: [
        "English",
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Computer Science",
        "Environmental Science",
        "Physical Education",
      ],
      Commerce: [
        "English",
        "Accounts",
        "Business Studies",
        "Economics",
        "Mathematics",
        "Commerce",
        "Entrepreneurship",
        "Computer Science",
      ],
      Arts: [
        "English",
        "History",
        "Political Science",
        "Geography",
        "Psychology",
        "Sociology",
        "Economics",
        "Mathematics",
        "Computer Science",
        "Fine Arts",
      ],
    },
  },

  "Cambridge (IGCSE / A Level)": {
    middle: [
      "English",
      "Mathematics",
      "Science",
      "Global Perspectives",
      "History",
      "Geography",
      "ICT / Computing",
      "Second Language",
    ],
    secondary: [
      "English Language",
      "English Literature",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Combined Science",
      "Global Perspectives",
      "Economics",
      "Business",
      "Computer Science / ICT",
      "Foreign Language",
    ],
    senior: {
      Science: [
        "English Language / Literature",
        "Mathematics",
        "Further Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Computer Science",
        "Information Technology",
      ],
      Commerce: [
        "Accounting",
        "Business",
        "Economics",
        "Mathematics",
        "Computer Science",
        "Information Technology",
        "English Language",
      ],
      Arts: [
        "English Language / Literature",
        "History",
        "Geography",
        "Psychology",
        "Sociology",
        "Economics",
        "Global Perspectives & Research",
        "Art & Design",
      ],
    },
  },

  IB: {
    middle: [
      "Language & Literature",
      "Language Acquisition",
      "Mathematics",
      "Sciences",
      "Individuals & Societies",
      "Design",
      "Arts",
      "Physical & Health Education",
    ],
    secondary: [
      "Language & Literature",
      "Language Acquisition",
      "Mathematics",
      "Sciences",
      "Individuals & Societies",
      "Design",
      "Arts",
      "Physical & Health Education",
    ],
    senior: {
      Science: [
        "English A",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Computer Science",
        "Environmental Systems & Societies",
        "Sports, Exercise & Health Science",
      ],
      Commerce: [
        "English A",
        "Economics",
        "Business Management",
        "Mathematics",
        "Computer Science",
        "Digital Society",
        "Environmental Systems & Societies",
      ],
      Arts: [
        "English A",
        "History",
        "Geography",
        "Psychology",
        "Global Politics",
        "Economics",
        "Visual Arts",
        "Mathematics",
      ],
    },
  },
};

const REGULAR_ACADEMIC_COURSE_KEYS = new Set([
  "class-6-additional",
  "class-7-additional",
  "class-8-additional",
  "class-9-additional",
  "class-10-additional",
  "class-11-additional",
  "class-12-additional",
]);

const ADDITIONAL_COURSES_BY_CLASS: Record<string, string[]> = {
  "class-6-additional": [
    "Spoken English",
    "Abacus",
    "Robotics",
    "Olympiad Preparation",
    "UPSC Foundation",
    "Personality Development",
  ],
  "class-7-additional": [
    "Spoken English",
    "Abacus",
    "Robotics",
    "Olympiad Preparation",
    "UPSC Foundation",
    "Public Speaking",
    "Personality Development",
  ],
  "class-8-additional": [
    "Robotics",
    "Abacus",
    "Artificial Intelligence (Basics)",
    "Olympiad Preparation",
    "UPSC Foundation",
    "Public Speaking",
    "Personality Development",
  ],
  "class-9-additional": [
    "JEE Foundation",
    "NEET Foundation",
    "UPSC Foundation",
    "Police / Army Bharti",
    "Robotics",
    "Artificial Intelligence (Basics)",
    "Video/Graphic Editing",
    "Spoken English",
    "Personality Development",
  ],
  "class-10-additional": [
    "JEE Foundation",
    "NEET Foundation",
    "UPSC Foundation",
    "Police / Army Bharti",
    "Robotics",
    "Artificial Intelligence (Basics)",
    "Video Editing",
    "Spoken English",
    "Career Counselling",
  ],
  "class-11-additional": [
    "JEE",
    "NEET",
    "All MHT CET Exam",
    "CUET",
    "NDA",
    "Police/Army Bharti",
    "IMU CET",
    "NCHMCT JEE",
    "CLAT",
    "CA Foundation",
    "CS Foundation",
    "CMA Foundation",
    "IPMAT",
    "NPAT",
    "UPSC Foundation",
    "SSC",
    "Railway",
    "Video Editing",
    "Spoken English",
    "Interview & Personality Development",
  ],
  "class-12-additional": [
    "JEE",
    "NEET",
    "All MHT CET Exam",
    "CUET",
    "NDA",
    "Police/Army Bharti",
    "IMU CET",
    "NCHMCT JEE",
    "CLAT",
    "CA Foundation",
    "CS Foundation",
    "CMA Foundation",
    "IPMAT",
    "NPAT",
    "UPSC Foundation",
    "Railway",
    "SSC",
    "Video Editing",
    "Spoken English",
    "Interview & Personality Development",
  ],
};

function isSeniorSecondaryCourse(standardKey: string) {
  return (
    standardKey === "class-11-additional" ||
    standardKey === "class-12-additional"
  );
}

function getClassNumber(standardKey: string) {
  return Number(standardKey.match(/class-(\d+)-additional/)?.[1] ?? "0");
}

function getRegularSubjectOptions(
  standardKey: string,
  selectedBoard: string,
  selectedStream: string,
) {
  const boardSubjects = SUBJECTS_BY_BOARD[selectedBoard as BoardName];

  if (!boardSubjects) return [];

  const classNumber = getClassNumber(standardKey);

  const subjectOptions =
    classNumber >= 11
      ? (boardSubjects.senior[selectedStream as SeniorSecondaryStream] ?? [])
      : classNumber >= 9
        ? boardSubjects.secondary
        : boardSubjects.middle;

  return [...subjectOptions, OTHER_SUBJECT_OPTION];
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600";

function SelectionCard({
  selected,
  children,
  onClick,
  icon,
  description,
  tone = "blue",
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  description?: string;
  tone?: "blue" | "green";
}) {
  const selectedStyle =
    tone === "green"
      ? "border-emerald-500 bg-emerald-50"
      : "border-blue-600 bg-blue-50";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-12 min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? selectedStyle
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      {icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
            selected
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <span
          className={`block break-words text-sm font-semibold leading-5 ${
            selected ? "text-blue-900" : "text-slate-800"
          }`}
        >
          {children}
        </span>

        {description && (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {description}
          </span>
        )}
      </div>

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-blue-700">
        {number}
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>

        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

const STEP_DETAILS = [
  { number: 1, label: "Programme" },
  { number: 2, label: "Schedule" },
  { number: 3, label: "Your Details" },
] as const;

export default function CourseModal({
  course,
  onClose,
  initialAdditionalCourse,
}: CourseModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("student");

  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [mhtCetSubExam, setMhtCetSubExam] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [otherSubject, setOtherSubject] = useState("");
  const [selectedAdditionalCourses, setSelectedAdditionalCourses] = useState<
    string[]
  >([]);
  const [selectedLearningMode, setSelectedLearningMode] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const submissionIdRef = useRef("");

  useEffect(() => {
    const isAcademic = course
      ? REGULAR_ACADEMIC_COURSE_KEYS.has(course.standardKey)
      : false;

    const preselected =
      !isAcademic &&
      initialAdditionalCourse &&
      course?.courseNamesIncluded.includes(initialAdditionalCourse)
        ? initialAdditionalCourse
        : "";

    setStep(1);
    setIsSuccess(false);
    setIsSubmitting(false);
    setError("");
    setName("");
    setContact("");
    setAddress("");
    setRole("student");
    setSelectedCourseName(preselected);
    setMhtCetSubExam("");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedSubjects([]);
    setOtherSubject("");
    setSelectedAdditionalCourses(
      isAcademic && initialAdditionalCourse ? [initialAdditionalCourse] : [],
    );
    setSelectedLearningMode("");
    setSelectedSlot("");
    submissionIdRef.current = "";
  }, [course?.id, course?.standardKey, initialAdditionalCourse]);

  useEffect(() => {
    if (!course) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [course, onClose, isSubmitting]);

  if (!course) return null;

  const activeCourse: CourseItem = course;

  const isRegularAcademic = REGULAR_ACADEMIC_COURSE_KEYS.has(
    activeCourse.standardKey,
  );

  const isSeniorSecondary = isSeniorSecondaryCourse(activeCourse.standardKey);

  const hasCourseOptions = activeCourse.courseNamesIncluded.length > 0;

  const hasSelectedBoard = Boolean(selectedBoard);
  const hasSelectedStream = !isSeniorSecondary || Boolean(selectedStream);
  const canShowSubjects = hasSelectedBoard && hasSelectedStream;

  const regularSubjectOptions = getRegularSubjectOptions(
    activeCourse.standardKey,
    selectedBoard,
    selectedStream,
  );

  const additionalCourseOptions =
    ADDITIONAL_COURSES_BY_CLASS[activeCourse.standardKey] ?? [];

  const visibleAdditionalCourseOptions = initialAdditionalCourse
    ? additionalCourseOptions.filter((item) => item === initialAdditionalCourse)
    : additionalCourseOptions;

  const isMhtCet =
    !isRegularAcademic && selectedCourseName === "All MHT CET Exam";

  const hasMhtCetAddOn = selectedAdditionalCourses.includes("All MHT CET Exam");

  const shouldShowMhtCetCategory = isMhtCet || hasMhtCetAddOn;

  const requiresOtherSubjectName =
    selectedSubjects.includes(OTHER_SUBJECT_OPTION) && !otherSubject.trim();

  const selectedSubjectText = selectedSubjects
    .map((subject) =>
      subject === OTHER_SUBJECT_OPTION && otherSubject.trim()
        ? otherSubject.trim()
        : subject,
    )
    .join(", ");

  const selectedAdditionalCourseText = selectedAdditionalCourses
    .map((additionalCourse) =>
      additionalCourse === "All MHT CET Exam" && mhtCetSubExam
        ? `${additionalCourse} – ${mhtCetSubExam}`
        : additionalCourse,
    )
    .join(", ");

  const readableCourseDetail = isRegularAcademic
    ? `${activeCourse.title} — ${selectedBoard}${
        isSeniorSecondary ? ` — ${selectedStream}` : ""
      } — ${selectedSubjectText}`
    : isMhtCet
      ? `${selectedCourseName}${mhtCetSubExam ? ` – ${mhtCetSubExam}` : ""}`
      : selectedCourseName || activeCourse.title;

  function scrollToTop() {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function changeStep(nextStep: Step) {
    setError("");
    setStep(nextStep);
    scrollToTop();
  }

  function toggleSubject(subject: string) {
    if (
      subject === OTHER_SUBJECT_OPTION &&
      selectedSubjects.includes(subject)
    ) {
      setOtherSubject("");
    }

    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );

    setSelectedSlot("");
  }

  function toggleAdditionalCourse(additionalCourse: string) {
    if (
      additionalCourse === "All MHT CET Exam" &&
      selectedAdditionalCourses.includes(additionalCourse)
    ) {
      setMhtCetSubExam("");
    }

    setSelectedAdditionalCourses((current) =>
      current.includes(additionalCourse)
        ? current.filter((item) => item !== additionalCourse)
        : [...current, additionalCourse],
    );

    setSelectedSlot("");
  }

  function validateStepOne(): boolean {
    if (isRegularAcademic) {
      if (!selectedBoard) {
        setError("Please select your education board.");
        return false;
      }

      if (isSeniorSecondary && !selectedStream) {
        setError("Please select your academic stream.");
        return false;
      }

      if (selectedSubjects.length === 0) {
        setError("Please select at least one academic subject.");
        return false;
      }

      if (requiresOtherSubjectName) {
        setError("Please enter your school-specific subject.");
        return false;
      }
    } else if (hasCourseOptions && !selectedCourseName) {
      setError("Please select a programme.");
      return false;
    }

    if (shouldShowMhtCetCategory && !mhtCetSubExam) {
      setError("Please select your MHT CET exam category.");
      return false;
    }

    return true;
  }

  function validateStepTwo(): boolean {
    if (!selectedLearningMode) {
      setError("Please select your preferred learning mode.");
      return false;
    }

    if (!selectedSlot) {
      setError("Please select your preferred session slot.");
      return false;
    }

    return true;
  }

  function validateStepThree(): boolean {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    const trimmedContact = contact.trim();

    if (!trimmedContact) {
      setError("Please enter your phone number or email address.");
      return false;
    }

    if (trimmedContact.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) {
        setError("Please enter a valid email address.");
        return false;
      }
    } else {
      const digits = trimmedContact.replace(/\D/g, "");

      if (digits.length < 10 || digits.length > 15) {
        setError("Please enter a valid phone number.");
        return false;
      }
    }

    if (address.trim().length < 10) {
      setError("Please enter your complete address including area and city.");
      return false;
    }

    return true;
  }

  function handleContinue() {
    setError("");

    if (step === 1) {
      if (!validateStepOne()) {
        scrollToTop();
        return;
      }
      changeStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStepTwo()) {
        scrollToTop();
        return;
      }
      changeStep(3);
    }
  }

  function handleBack() {
    if (step === 1) return;
    changeStep((step - 1) as Step);
  }

  function resetForm() {
    setStep(1);
    setIsSuccess(false);
    setIsSubmitting(false);
    setError("");
    setName("");
    setContact("");
    setAddress("");
    setRole("student");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedSubjects([]);
    setOtherSubject("");
    setMhtCetSubExam("");

    setSelectedCourseName(
      !isRegularAcademic &&
        initialAdditionalCourse &&
        activeCourse.courseNamesIncluded.includes(initialAdditionalCourse)
        ? initialAdditionalCourse
        : "",
    );

    setSelectedAdditionalCourses(
      isRegularAcademic && initialAdditionalCourse
        ? [initialAdditionalCourse]
        : [],
    );

    setSelectedLearningMode("");
    setSelectedSlot("");
    submissionIdRef.current = "";
    scrollToTop();
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isSuccess) return;

    setError("");

    if (!validateStepOne()) {
      changeStep(1);
      return;
    }

    if (!validateStepTwo()) {
      changeStep(2);
      return;
    }

    if (!validateStepThree()) {
      scrollToTop();
      return;
    }

    const canEnroll = await requestLoginIfNeeded("/courses");

    if (!canEnroll) return;

    const message = isRegularAcademic
      ? `Hi SmartIQ Institute, I am interested in enrolling for ${activeCourse.title}. Board: ${selectedBoard}.${
          isSeniorSecondary ? ` Stream: ${selectedStream}.` : ""
        } Regular subjects: ${selectedSubjectText}. Optional additional courses: ${
          selectedAdditionalCourseText || "None selected"
        }. Preferred tuition mode: ${selectedLearningMode}. Preferred session slot: ${selectedSlot}. Enrolling as a ${role}. Full Address: ${address.trim()}. Let's set up a counselling demo.`
      : `Hi SmartIQ Institute, I am interested in enrolling for ${readableCourseDetail} as a ${role}. Preferred tuition mode: ${selectedLearningMode}. Preferred session slot: ${selectedSlot}. Full Address: ${address.trim()}. Let's set up a counselling demo.`;

    if (!submissionIdRef.current) {
      submissionIdRef.current = crypto.randomUUID();
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          address: address.trim(),
          role,
          courseTitle: activeCourse.title,
          courseKey: activeCourse.standardKey,
          message,
          requestType: "general",
          source: "course-modal",
          submissionId: submissionIdRef.current,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error || "Unable to submit your enquiry.");
      }

      setIsSuccess(true);
      scrollToTop();
    } catch (cause) {
      console.error("Course enquiry submission failed:", cause);

      setError(
        cause instanceof Error
          ? cause.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
          className="absolute inset-0 bg-slate-900/50"
        />

        {/* Modal */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.98,
            y: 10,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.98,
            y: 10,
          }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Course enquiry for ${activeCourse.title}`}
          className="relative z-10 flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-[94dvh]"
        >
          {/* Header */}
          <header className="relative shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 sm:text-xs">
                    SmartIQ Institute Admissions
                  </p>

                  <h2 className="mt-1 break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                    {initialAdditionalCourse || activeCourse.title}
                  </h2>

                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    Course Enquiry Form
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close course enquiry"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isSuccess && (
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 sm:gap-4">
                {STEP_DETAILS.map((item, index) => {
                  const completed = step > item.number;
                  const active = step === item.number;

                  return (
                    <div
                      key={item.number}
                      aria-current={active ? "step" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          completed
                            ? "bg-emerald-600 text-white"
                            : active
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          item.number
                        )}
                      </div>

                      <span
                        className={`min-w-0 text-[11px] font-semibold leading-tight sm:text-sm ${
                          active
                            ? "text-blue-700"
                            : completed
                              ? "text-slate-700"
                              : "text-slate-400"
                        }`}
                      >
                        {item.label}
                      </span>

                      {index < STEP_DETAILS.length - 1 && (
                        <div className="ml-auto hidden h-px flex-1 bg-slate-200 sm:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </header>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-5 sm:px-8 sm:py-6"
          >
            <div className="mx-auto w-full max-w-4xl">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="status"
                    className="px-4 py-10 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-slate-900">
                      Enquiry Submitted Successfully
                    </h3>

                    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
                      Thank you, <strong>{name}</strong>. Your enquiry for{" "}
                      <strong>{readableCourseDetail}</strong> has been
                      submitted. Our admissions team will contact you regarding
                      the next steps.
                    </p>

                    <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Enquiry Received
                    </div>

                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-slate-50"
                      >
                        Submit Another Enquiry
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl bg-white p-2 sm:p-4"
                  >
                    {/* STEP 1 */}
                    {step === 1 && (
                      <div className="space-y-7">
                        <div className="border-b border-slate-100 pb-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Step 1 of 3
                          </p>

                          <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                            Course Selection
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            {isRegularAcademic
                              ? "Select your board and required subjects."
                              : "Select the course you wish to enquire about."}
                          </p>
                        </div>

                        {isRegularAcademic ? (
                          <>
                            <section>
                              <SectionHeading
                                number="01"
                                title="Select Your Education Board"
                                description="Choose your current school board."
                              />

                              <div className="grid gap-3 sm:grid-cols-2">
                                {BOARD_OPTIONS.map((board) => (
                                  <SelectionCard
                                    key={board}
                                    selected={selectedBoard === board}
                                    icon={<BookOpen className="h-4 w-4" />}
                                    onClick={() => {
                                      setSelectedBoard(board);
                                      setSelectedStream("");
                                      setSelectedSubjects([]);
                                      setOtherSubject("");
                                      setSelectedSlot("");
                                      setError("");
                                    }}
                                  >
                                    {board}
                                  </SelectionCard>
                                ))}
                              </div>
                            </section>

                            {isSeniorSecondary && hasSelectedBoard && (
                              <section>
                                <SectionHeading
                                  number="02"
                                  title="Select Academic Stream"
                                  description="Select your Class 11 or 12 stream."
                                />

                                <div className="grid gap-3 sm:grid-cols-3">
                                  {SENIOR_SECONDARY_STREAMS.map((stream) => (
                                    <SelectionCard
                                      key={stream}
                                      selected={selectedStream === stream}
                                      onClick={() => {
                                        setSelectedStream(stream);
                                        setSelectedSubjects([]);
                                        setOtherSubject("");
                                        setSelectedSlot("");
                                        setError("");
                                      }}
                                    >
                                      {stream}
                                    </SelectionCard>
                                  ))}
                                </div>
                              </section>
                            )}

                            {canShowSubjects && (
                              <section>
                                <SectionHeading
                                  number={isSeniorSecondary ? "03" : "02"}
                                  title="Select Subjects"
                                  description="You may select multiple subjects."
                                />

                                <div className="grid gap-2.5 sm:grid-cols-2">
                                  {regularSubjectOptions.map((subject) => (
                                    <SelectionCard
                                      key={subject}
                                      selected={selectedSubjects.includes(
                                        subject,
                                      )}
                                      onClick={() => {
                                        toggleSubject(subject);
                                        setError("");
                                      }}
                                    >
                                      {subject}
                                    </SelectionCard>
                                  ))}
                                </div>

                                {selectedSubjects.includes(
                                  OTHER_SUBJECT_OPTION,
                                ) && (
                                  <div className="mt-4">
                                    <label
                                      htmlFor="other-subject"
                                      className={labelClass}
                                    >
                                      Other Subject *
                                    </label>

                                    <input
                                      id="other-subject"
                                      type="text"
                                      value={otherSubject}
                                      maxLength={150}
                                      onChange={(event) => {
                                        setOtherSubject(event.target.value);
                                        setSelectedSlot("");
                                      }}
                                      placeholder="Enter subject name"
                                      className={inputClass}
                                    />
                                  </div>
                                )}
                              </section>
                            )}

                            {canShowSubjects && (
                              <section className="border-t border-slate-100 pt-6">
                                <SectionHeading
                                  number={isSeniorSecondary ? "04" : "03"}
                                  title="Optional Additional Courses"
                                  description="Select any additional programmes you are interested in."
                                />

                                {visibleAdditionalCourseOptions.length > 0 ? (
                                  <div className="grid gap-2.5 sm:grid-cols-2">
                                    {visibleAdditionalCourseOptions.map(
                                      (additionalCourse) => (
                                        <SelectionCard
                                          key={additionalCourse}
                                          tone="green"
                                          selected={selectedAdditionalCourses.includes(
                                            additionalCourse,
                                          )}
                                          onClick={() => {
                                            toggleAdditionalCourse(
                                              additionalCourse,
                                            );
                                            setError("");
                                          }}
                                        >
                                          {additionalCourse}
                                        </SelectionCard>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    No additional courses listed.
                                  </p>
                                )}
                              </section>
                            )}
                          </>
                        ) : (
                          <section>
                            <SectionHeading
                              number="01"
                              title="Select Course"
                              description="Choose the programme you wish to join."
                            />

                            {hasCourseOptions ? (
                              <div className="grid gap-3 sm:grid-cols-2">
                                {activeCourse.courseNamesIncluded.map(
                                  (courseName) => (
                                    <SelectionCard
                                      key={courseName}
                                      selected={
                                        selectedCourseName === courseName
                                      }
                                      icon={
                                        <GraduationCap className="h-4 w-4" />
                                      }
                                      onClick={() => {
                                        setSelectedCourseName(courseName);
                                        setMhtCetSubExam("");
                                        setSelectedSlot("");
                                        setError("");
                                      }}
                                    >
                                      {courseName}
                                    </SelectionCard>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  {activeCourse.title}
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                  {activeCourse.description}
                                </p>
                              </div>
                            )}
                          </section>
                        )}

                        {shouldShowMhtCetCategory && (
                          <section>
                            <SectionHeading
                              number="05"
                              title="MHT CET Exam Category"
                              description="Select your entrance examination."
                            />

                            <select
                              value={mhtCetSubExam}
                              onChange={(event) =>
                                setMhtCetSubExam(event.target.value)
                              }
                              className={inputClass}
                            >
                              <option value="">Select Examination</option>

                              {MHT_CET_EXAMS.map((exam) => (
                                <option key={exam} value={exam}>
                                  {exam}
                                </option>
                              ))}
                            </select>
                          </section>
                        )}
                      </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                      <div className="space-y-7">
                        <div className="border-b border-slate-100 pb-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Step 2 of 3
                          </p>

                          <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                            Class Preferences
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Select your preferred class mode and session time.
                          </p>
                        </div>

                        <section>
                          <SectionHeading
                            number="01"
                            title="Preferred Tuition Mode"
                            description="Select how you would like to attend classes."
                          />

                          <div className="grid gap-3 sm:grid-cols-3">
                            {TUITION_MODES.map((mode) => (
                              <SelectionCard
                                key={mode.value}
                                selected={selectedLearningMode === mode.value}
                                icon={<mode.icon className="h-4 w-4" />}
                                description={mode.description}
                                onClick={() => {
                                  setSelectedLearningMode(mode.value);
                                  setSelectedSlot("");
                                  setError("");
                                }}
                              >
                                {mode.title}
                              </SelectionCard>
                            ))}
                          </div>
                        </section>

                        {selectedLearningMode && (
                          <section>
                            <SectionHeading
                              number="02"
                              title="Preferred Session Time"
                              description="Select a 90-minute session slot."
                            />

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {SESSION_SLOTS.map((slot, index) => (
                                <SelectionCard
                                  key={slot}
                                  selected={selectedSlot === slot}
                                  icon={<Clock3 className="h-4 w-4" />}
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setError("");
                                  }}
                                >
                                  <span className="block text-[10px] font-medium text-slate-500">
                                    Slot {index + 1}
                                  </span>
                                  <span className="mt-1 block">{slot}</span>
                                </SelectionCard>
                              ))}
                            </div>

                            <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                              <p className="text-xs leading-5 text-slate-600">
                                Each session is 1 hour 30 minutes, with a
                                30-minute break between sessions. Timings are
                                subject to confirmation.
                              </p>
                            </div>
                          </section>
                        )}
                      </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                      <div className="space-y-7">
                        <div className="border-b border-slate-100 pb-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Step 3 of 3
                          </p>

                          <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                            Personal Details
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Enter your contact information and review your
                            enquiry.
                          </p>
                        </div>

                        <section>
                          <SectionHeading
                            number="01"
                            title="Applicant Information"
                            description="Please provide accurate contact details."
                          />

                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="enquiry-name"
                                className={labelClass}
                              >
                                Full Name *
                              </label>

                              <div className="relative">
                                <UserRound className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />

                                <input
                                  id="enquiry-name"
                                  type="text"
                                  required
                                  maxLength={100}
                                  autoComplete="name"
                                  value={name}
                                  onChange={(event) =>
                                    setName(event.target.value)
                                  }
                                  placeholder="Enter your full name"
                                  className={`${inputClass} pl-11`}
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="enquiry-contact"
                                className={labelClass}
                              >
                                Phone / Email *
                              </label>

                              <div className="relative">
                                <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />

                                <input
                                  id="enquiry-contact"
                                  type="text"
                                  required
                                  maxLength={150}
                                  value={contact}
                                  onChange={(event) =>
                                    setContact(event.target.value)
                                  }
                                  placeholder="+91 9876543210"
                                  className={`${inputClass} pl-11`}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label
                                htmlFor="enquiry-address"
                                className={labelClass}
                              >
                                Full Address *
                              </label>

                              <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />

                                <textarea
                                  id="enquiry-address"
                                  name="address"
                                  required
                                  rows={3}
                                  minLength={10}
                                  maxLength={500}
                                  autoComplete="street-address"
                                  value={address}
                                  onChange={(event) =>
                                    setAddress(event.target.value)
                                  }
                                  placeholder="House / Flat No., Building, Street, Area, City, State and PIN Code"
                                  className={`${inputClass} resize-y pl-11`}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label
                                htmlFor="enquiry-role"
                                className={labelClass}
                              >
                                Enrolling As *
                              </label>

                              <select
                                id="enquiry-role"
                                value={role}
                                onChange={(event) =>
                                  setRole(event.target.value)
                                }
                                className={inputClass}
                              >
                                <option value="student">Student</option>
                                <option value="parent">
                                  Parent / Guardian
                                </option>
                                <option value="corporate">
                                  Working Professional
                                </option>
                              </select>
                            </div>
                          </div>
                        </section>

                        {/* Review */}
                        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                          <h4 className="text-base font-bold text-slate-900">
                            Review Your Enquiry
                          </h4>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-500">
                                Programme
                              </p>
                              <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                                {readableCourseDetail}
                              </p>
                            </div>

                            {isRegularAcademic && (
                              <div>
                                <p className="text-xs text-slate-500">
                                  Additional Courses
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                                  {selectedAdditionalCourseText ||
                                    "None selected"}
                                </p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-slate-500">
                                Tuition Mode
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {selectedLearningMode}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Preferred Session
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {selectedSlot}
                              </p>
                            </div>
                          </div>
                        </section>

                        <p className="text-xs leading-5 text-slate-500">
                          By submitting this enquiry, you agree to be contacted
                          by SmartIQ Institute regarding your selected
                          programme. Submission does not confirm admission.
                        </p>
                      </div>
                    )}

                    {error && (
                      <div
                        role="alert"
                        className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                      >
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          {!isSuccess && (
            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-8 sm:py-4">
              <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
                <div className="hidden text-xs font-medium text-slate-500 sm:block">
                  Step {step} of 3
                  <span className="ml-2 text-slate-400">• Course Enquiry</span>
                </div>

                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 sm:hidden">
                      Step 1 of 3
                    </span>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const form = document.getElementById(
                          "smartiq-course-final-form",
                        ) as HTMLFormElement | null;

                        form?.requestSubmit();
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                    </button>
                  )}
                </div>
              </div>
            </footer>
          )}

          {!isSuccess && (
            <form
              id="smartiq-course-final-form"
              onSubmit={handleFormSubmit}
              className="hidden"
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
