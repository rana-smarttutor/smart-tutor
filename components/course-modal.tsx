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

const COURSE_BUDGET_OPTIONS = [
  5000, 10000, 15000, 25000, 35000, 50000, 75000, 100000, 125000, 150000,
  175000, 200000, 225000, 250000,
];

const formatMoney = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

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

const STREAMS = ["Science", "Commerce", "Arts"] as const;
type StreamName = (typeof STREAMS)[number];

type SubjectGroups = {
  middle: string[];
  secondary: string[];
  senior: Record<StreamName, string[]>;
};

const COMMON_SENIOR: Record<StreamName, string[]> = {
  Science: [
    "English",
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Computer Science",
    "Information Technology",
    "Physical Education",
  ],
  Commerce: [
    "English",
    "Accountancy",
    "Business Studies",
    "Economics",
    "Mathematics",
    "Entrepreneurship",
    "Information Technology",
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
    "Fine Arts",
  ],
};

const SUBJECTS_BY_BOARD: Record<BoardName, SubjectGroups> = {
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
    senior: COMMON_SENIOR,
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
    senior: COMMON_SENIOR,
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
    senior: COMMON_SENIOR,
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
    senior: COMMON_SENIOR,
  },
};

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

const REGULAR_ACADEMIC_KEYS = new Set(
  Array.from({ length: 7 }, (_, i) => `class-${i + 6}-additional`),
);

const ADDITIONAL_BY_CLASS: Record<string, string[]> = {
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
    "SSC",
    "Railway",
    "Video Editing",
    "Spoken English",
    "Interview & Personality Development",
  ],
};

const OTHER_SUBJECT = "Other / School-specific subject";

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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-12 min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
        selected
          ? tone === "green"
            ? "border-emerald-500 bg-emerald-50"
            : "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-blue-600">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold text-slate-900">
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
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

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

  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");

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

  const isAcademic = Boolean(
    course && REGULAR_ACADEMIC_KEYS.has(course.standardKey),
  );

  useEffect(() => {
    const academic = course
      ? REGULAR_ACADEMIC_KEYS.has(course.standardKey)
      : false;
    const preselected =
      !academic &&
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
    setBudgetFrom("");
    setBudgetTo("");
    setSelectedCourseName(preselected);
    setMhtCetSubExam("");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedSubjects([]);
    setOtherSubject("");
    setSelectedAdditionalCourses(
      academic && initialAdditionalCourse ? [initialAdditionalCourse] : [],
    );
    setSelectedLearningMode("");
    setSelectedSlot("");
    submissionIdRef.current = "";
  }, [course?.id, course?.standardKey, initialAdditionalCourse]);

  useEffect(() => {
    if (!course) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [course, onClose, isSubmitting]);

  if (!course) return null;

  const activeCourse: CourseItem = course;
  const standardKey = activeCourse.standardKey;
  const classNumber = Number(
    standardKey.match(/class-(\d+)-additional/)?.[1] || 0,
  );

  const isSenior = classNumber >= 11;
  const hasOptions = activeCourse.courseNamesIncluded.length > 0;
  const canShowSubjects =
    Boolean(selectedBoard) && (!isSenior || Boolean(selectedStream));

  const boardSubjects = SUBJECTS_BY_BOARD[selectedBoard as BoardName];

  const subjectOptions = !boardSubjects
    ? []
    : [
        ...(isSenior
          ? boardSubjects.senior[selectedStream as StreamName] || []
          : classNumber >= 9
            ? boardSubjects.secondary
            : boardSubjects.middle),
        OTHER_SUBJECT,
      ];

  const additionalOptions = ADDITIONAL_BY_CLASS[standardKey] || [];

  const visibleAdditionalOptions = initialAdditionalCourse
    ? additionalOptions.filter((item) => item === initialAdditionalCourse)
    : additionalOptions;

  const requiresMhtCet =
    selectedCourseName === "All MHT CET Exam" ||
    selectedAdditionalCourses.includes("All MHT CET Exam");

  const selectedSubjectText = selectedSubjects
    .map((subject) =>
      subject === OTHER_SUBJECT && otherSubject.trim()
        ? otherSubject.trim()
        : subject,
    )
    .join(", ");

  const selectedAdditionalText = selectedAdditionalCourses
    .map((item) =>
      item === "All MHT CET Exam" && mhtCetSubExam
        ? `${item} – ${mhtCetSubExam}`
        : item,
    )
    .join(", ");

  const readableCourseDetail = isAcademic
    ? `${activeCourse.title} — ${selectedBoard}${
        isSenior ? ` — ${selectedStream}` : ""
      } — ${selectedSubjectText}`
    : selectedCourseName === "All MHT CET Exam"
      ? `${selectedCourseName}${mhtCetSubExam ? ` – ${mhtCetSubExam}` : ""}`
      : selectedCourseName || activeCourse.title;

  const courseBudgetText =
    budgetFrom && budgetTo
      ? `${formatMoney(Number(budgetFrom))} – ${formatMoney(Number(budgetTo))}`
      : "Not selected";

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

  function toggleItem(
    value: string,
    current: string[],
    setter: (values: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function validateStepOne(): boolean {
    if (isAcademic) {
      if (!selectedBoard) {
        setError("Please select your education board.");
        return false;
      }
      if (isSenior && !selectedStream) {
        setError("Please select your academic stream.");
        return false;
      }
      if (!selectedSubjects.length) {
        setError("Please select at least one subject.");
        return false;
      }
      if (selectedSubjects.includes(OTHER_SUBJECT) && !otherSubject.trim()) {
        setError("Please enter your school-specific subject.");
        return false;
      }
    } else if (hasOptions && !selectedCourseName) {
      setError("Please select a programme.");
      return false;
    }

    if (requiresMhtCet && !mhtCetSubExam) {
      setError("Please select your MHT CET examination.");
      return false;
    }

    return true;
  }

  function validateStepTwo(): boolean {
    if (!selectedLearningMode) {
      setError("Please select your preferred tuition mode.");
      return false;
    }
    if (selectedLearningMode === "Home Tutor" && !selectedSlot) {
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
      setError("Please enter your phone number or email.");
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
      setError("Please enter your full address.");
      return false;
    }

    const from = Number(budgetFrom);
    const to = Number(budgetTo);

    if (
      !budgetFrom ||
      !budgetTo ||
      !COURSE_BUDGET_OPTIONS.includes(from) ||
      !COURSE_BUDGET_OPTIONS.includes(to) ||
      from > to
    ) {
      setError("Please select a valid total course budget range.");
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
    } else if (step === 2) {
      if (!validateStepTwo()) {
        scrollToTop();
        return;
      }
      changeStep(3);
    }
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
    setBudgetFrom("");
    setBudgetTo("");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedSubjects([]);
    setOtherSubject("");
    setMhtCetSubExam("");
    setSelectedCourseName(
      !isAcademic &&
        initialAdditionalCourse &&
        activeCourse.courseNamesIncluded.includes(initialAdditionalCourse)
        ? initialAdditionalCourse
        : "",
    );
    setSelectedAdditionalCourses(
      isAcademic && initialAdditionalCourse ? [initialAdditionalCourse] : [],
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

    const sessionSlotText =
      selectedLearningMode === "Home Tutor"
        ? ` Preferred session slot: ${selectedSlot}.`
        : "";

    const message = isAcademic
      ? `Hi SmartIQ Institute, I am interested in enrolling for ${activeCourse.title}. Board: ${selectedBoard}.${isSenior ? ` Stream: ${selectedStream}.` : ""} Regular subjects: ${selectedSubjectText}. Optional additional courses: ${selectedAdditionalText || "None selected"}. Preferred tuition mode: ${selectedLearningMode}.${sessionSlotText} Total course budget: ${courseBudgetText}. Enrolling as a ${role}. Full Address: ${address.trim()}. Let's set up a counselling demo.`
      : `Hi SmartIQ Institute, I am interested in enrolling for ${readableCourseDetail} as a ${role}. Preferred tuition mode: ${selectedLearningMode}.${sessionSlotText} Total course budget: ${courseBudgetText}. Full Address: ${address.trim()}. Let's set up a counselling demo.`;

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
          className="absolute inset-0 bg-slate-900/50"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Course enquiry for ${activeCourse.title}`}
          className="relative z-10 flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-[94dvh]"
        >
          <header className="shrink-0 border-b border-slate-200 px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-blue-600">
                    SmartIQ Institute Admissions
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {initialAdditionalCourse || activeCourse.title}
                  </h2>
                  <p className="text-xs text-slate-500">Course Enquiry Form</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close course enquiry"
                className="rounded-lg border border-slate-200 p-3"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isSuccess && (
              <div className="mt-5 flex justify-between border-t border-slate-100 pt-4">
                {["Programme", "Schedule", "Your Details"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 text-xs font-semibold sm:text-sm ${
                        step === index + 1 ? "text-blue-700" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          step > index + 1
                            ? "bg-emerald-600 text-white"
                            : step === index + 1
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100"
                        }`}
                      >
                        {step > index + 1 ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      {label}
                    </div>
                  ),
                )}
              </div>
            )}
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8"
          >
            <div className="mx-auto max-w-4xl">
              {isSuccess ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
                  <h3 className="mt-5 text-xl font-bold">
                    Enquiry Submitted Successfully
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">
                    Thank you, {name}. Our admissions team will contact you.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border px-5 py-3 font-semibold"
                    >
                      Submit Another Enquiry
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-7">
                  {step === 1 && (
                    <>
                      <div className="border-b pb-4">
                        <h3 className="text-xl font-bold">Course Selection</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Select your programme and subjects.
                        </p>
                      </div>

                      {isAcademic ? (
                        <>
                          <section>
                            <SectionHeading
                              number="01"
                              title="Select Your Education Board"
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

                          {isSenior && selectedBoard && (
                            <section>
                              <SectionHeading
                                number="02"
                                title="Select Academic Stream"
                              />
                              <div className="grid gap-3 sm:grid-cols-3">
                                {STREAMS.map((stream) => (
                                  <SelectionCard
                                    key={stream}
                                    selected={selectedStream === stream}
                                    onClick={() => {
                                      setSelectedStream(stream);
                                      setSelectedSubjects([]);
                                      setOtherSubject("");
                                      setSelectedSlot("");
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
                                number={isSenior ? "03" : "02"}
                                title="Select Subjects"
                                description="You can select multiple subjects."
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                {subjectOptions.map((subject) => (
                                  <SelectionCard
                                    key={subject}
                                    selected={selectedSubjects.includes(
                                      subject,
                                    )}
                                    onClick={() => {
                                      toggleItem(
                                        subject,
                                        selectedSubjects,
                                        setSelectedSubjects,
                                      );
                                      if (
                                        subject === OTHER_SUBJECT &&
                                        selectedSubjects.includes(subject)
                                      ) {
                                        setOtherSubject("");
                                      }
                                      setSelectedSlot("");
                                    }}
                                  >
                                    {subject}
                                  </SelectionCard>
                                ))}
                              </div>

                              {selectedSubjects.includes(OTHER_SUBJECT) && (
                                <div className="mt-4">
                                  <label
                                    htmlFor="other-subject"
                                    className={labelClass}
                                  >
                                    Other Subject *
                                  </label>
                                  <input
                                    id="other-subject"
                                    value={otherSubject}
                                    onChange={(e) =>
                                      setOtherSubject(e.target.value)
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              )}
                            </section>
                          )}

                          {canShowSubjects && (
                            <section className="border-t pt-6">
                              <SectionHeading
                                number={isSenior ? "04" : "03"}
                                title="Optional Additional Courses"
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                {visibleAdditionalOptions.map((item) => (
                                  <SelectionCard
                                    key={item}
                                    tone="green"
                                    selected={selectedAdditionalCourses.includes(
                                      item,
                                    )}
                                    onClick={() => {
                                      toggleItem(
                                        item,
                                        selectedAdditionalCourses,
                                        setSelectedAdditionalCourses,
                                      );
                                      if (
                                        item === "All MHT CET Exam" &&
                                        selectedAdditionalCourses.includes(item)
                                      ) {
                                        setMhtCetSubExam("");
                                      }
                                      setSelectedSlot("");
                                    }}
                                  >
                                    {item}
                                  </SelectionCard>
                                ))}
                              </div>
                            </section>
                          )}
                        </>
                      ) : (
                        <section>
                          <SectionHeading number="01" title="Select Course" />
                          {hasOptions ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {activeCourse.courseNamesIncluded.map((item) => (
                                <SelectionCard
                                  key={item}
                                  selected={selectedCourseName === item}
                                  icon={<GraduationCap className="h-4 w-4" />}
                                  onClick={() => {
                                    setSelectedCourseName(item);
                                    setMhtCetSubExam("");
                                    setSelectedSlot("");
                                  }}
                                >
                                  {item}
                                </SelectionCard>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-lg border bg-slate-50 p-4">
                              <p className="font-semibold">
                                {activeCourse.title}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {activeCourse.description}
                              </p>
                            </div>
                          )}
                        </section>
                      )}

                      {requiresMhtCet && (
                        <section>
                          <SectionHeading
                            number="05"
                            title="MHT CET Exam Category"
                          />
                          <select
                            value={mhtCetSubExam}
                            onChange={(e) => setMhtCetSubExam(e.target.value)}
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
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="border-b pb-4">
                        <h3 className="text-xl font-bold">Class Preferences</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Select your preferred tuition mode.
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

                      {selectedLearningMode === "Home Tutor" && (
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
                                <span className="block text-xs text-slate-500">
                                  Slot {index + 1}
                                </span>
                                <span>{slot}</span>
                              </SelectionCard>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-3 rounded-lg border bg-slate-50 p-4">
                            <CalendarClock className="h-4 w-4 shrink-0" />
                            <p className="text-xs text-slate-600">
                              Each session is 90 minutes. Timings are subject to
                              confirmation.
                            </p>
                          </div>
                        </section>
                      )}
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="border-b pb-4">
                        <h3 className="text-xl font-bold">Personal Details</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Enter your details and total course budget.
                        </p>
                      </div>

                      <section>
                        <SectionHeading
                          number="01"
                          title="Applicant Information"
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
                                required
                                maxLength={100}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                                required
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
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
                                required
                                minLength={10}
                                maxLength={500}
                                rows={3}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="House / Flat No., Street, Area, City, State and PIN Code"
                                className={`${inputClass} resize-y pl-11`}
                              />
                            </div>
                          </div>

                          {/* FROM–TO TOTAL COURSE BUDGET */}
                          <div className="sm:col-span-2">
                            <label className={labelClass}>
                              Total Course Budget *
                            </label>

                            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
                              <div className="min-w-0">
                                <label
                                  htmlFor="enquiry-budget-from"
                                  className="mb-2 block text-xs text-slate-500"
                                >
                                  From
                                </label>
                                <select
                                  id="enquiry-budget-from"
                                  required
                                  value={budgetFrom}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setBudgetFrom(value);
                                    if (
                                      budgetTo &&
                                      Number(value) > Number(budgetTo)
                                    ) {
                                      setBudgetTo("");
                                    }
                                    setError("");
                                  }}
                                  className={inputClass}
                                >
                                  <option value="">Min budget</option>
                                  {COURSE_BUDGET_OPTIONS.map((amount) => (
                                    <option
                                      key={amount}
                                      value={amount}
                                      disabled={
                                        Boolean(budgetTo) &&
                                        amount > Number(budgetTo)
                                      }
                                    >
                                      {formatMoney(amount)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <span className="pb-3 text-sm font-semibold text-slate-500">
                                to
                              </span>

                              <div className="min-w-0">
                                <label
                                  htmlFor="enquiry-budget-to"
                                  className="mb-2 block text-xs text-slate-500"
                                >
                                  To
                                </label>
                                <select
                                  id="enquiry-budget-to"
                                  required
                                  value={budgetTo}
                                  onChange={(event) => {
                                    setBudgetTo(event.target.value);
                                    setError("");
                                  }}
                                  className={inputClass}
                                >
                                  <option value="">Max budget</option>
                                  {COURSE_BUDGET_OPTIONS.map((amount) => (
                                    <option
                                      key={amount}
                                      value={amount}
                                      disabled={
                                        Boolean(budgetFrom) &&
                                        amount < Number(budgetFrom)
                                      }
                                    >
                                      {formatMoney(amount)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 px-4 py-3">
                              <span className="text-xs text-slate-600">
                                Estimated budget for the entire course
                              </span>
                              <span className="text-sm font-bold text-blue-700">
                                {courseBudgetText}
                              </span>
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
                              onChange={(e) => setRole(e.target.value)}
                              className={inputClass}
                            >
                              <option value="student">Student</option>
                              <option value="parent">Parent / Guardian</option>
                              <option value="corporate">
                                Working Professional
                              </option>
                            </select>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <h4 className="font-bold text-slate-900">
                          Review Your Enquiry
                        </h4>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-500">Programme</p>
                            <p className="mt-1 text-sm font-semibold">
                              {readableCourseDetail}
                            </p>
                          </div>

                          {isAcademic && (
                            <div>
                              <p className="text-xs text-slate-500">
                                Additional Courses
                              </p>
                              <p className="mt-1 text-sm font-semibold">
                                {selectedAdditionalText || "None selected"}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-slate-500">
                              Total Course Budget
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {courseBudgetText}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Tuition Mode
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {selectedLearningMode}
                            </p>
                          </div>

                          {selectedLearningMode === "Home Tutor" && (
                            <div>
                              <p className="text-xs text-slate-500">
                                Preferred Session
                              </p>
                              <p className="mt-1 text-sm font-semibold">
                                {selectedSlot}
                              </p>
                            </div>
                          )}
                        </div>
                      </section>

                      <p className="text-xs leading-5 text-slate-500">
                        By submitting this enquiry, you agree to be contacted by
                        SmartIQ Institute. Submission does not confirm
                        admission.
                      </p>
                    </>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                    >
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isSuccess && (
            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <span className="hidden text-xs text-slate-500 sm:block">
                  Step {step} of 3 • Course Enquiry
                </span>
                <div className="flex w-full justify-between gap-3 sm:w-auto">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => changeStep((step - 1) as Step)}
                      className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
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
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
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
