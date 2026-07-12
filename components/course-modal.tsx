"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  X,
  Clock,
  Laptop,
  CheckCircle,
  BookOpen,
  Calendar,
  Send,
  Sparkles,
  Phone,
  User,
} from "@/components/ui-icons";
import { motion, AnimatePresence } from "motion/react";
import type { CourseItem } from "@/lib/types";

interface CourseModalProps {
  course: CourseItem | null;
  onClose: () => void;
  initialAdditionalCourse?: string;
}

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
  },
  {
    value: "Online Tutor",
    title: "Online Tutor",
    description: "Live interactive online classes",
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

  if (!boardSubjects) {
    return [];
  }

  const classNumber = getClassNumber(standardKey);
  const isSeniorSecondary = classNumber >= 11;

  const subjectOptions = isSeniorSecondary
    ? (boardSubjects.senior[selectedStream as SeniorSecondaryStream] ?? [])
    : classNumber >= 9
      ? boardSubjects.secondary
      : boardSubjects.middle;

  return [...subjectOptions, OTHER_SUBJECT_OPTION];
}

export default function CourseModal({
  course,
  onClose,
  initialAdditionalCourse,
}: CourseModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
  useEffect(() => {
    setIsSuccess(false);
    setSelectedCourseName("");
    setMhtCetSubExam("");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedSubjects([]);
    setOtherSubject("");
    setSelectedLearningMode("");
    setSelectedSlot("");

    if (initialAdditionalCourse) {
      setSelectedAdditionalCourses([initialAdditionalCourse]);
    } else {
      setSelectedAdditionalCourses([]);
      setSelectedLearningMode("");
      setSelectedSlot("");
    }
  }, [course?.standardKey, initialAdditionalCourse]);

  if (!course) {
    return null;
  }

  const isRegularAcademic = REGULAR_ACADEMIC_COURSE_KEYS.has(
    course.standardKey,
  );
  const hasCourseOptions = course.courseNamesIncluded.length > 0;
  const isSeniorSecondary = isSeniorSecondaryCourse(course.standardKey);
  const hasSelectedBoard = Boolean(selectedBoard);
  const hasSelectedStream = !isSeniorSecondary || Boolean(selectedStream);
  const canShowSubjects = hasSelectedBoard && hasSelectedStream;

  const regularSubjectOptions = getRegularSubjectOptions(
    course.standardKey,
    selectedBoard,
    selectedStream,
  );

  const additionalCourseOptions =
    ADDITIONAL_COURSES_BY_CLASS[course.standardKey] ?? [];
  const visibleAdditionalCourseOptions = initialAdditionalCourse
    ? additionalCourseOptions.filter(
        (additionalCourse) => additionalCourse === initialAdditionalCourse,
      )
    : additionalCourseOptions;

  const isMhtCet =
    !isRegularAcademic && selectedCourseName === "All MHT CET Exam";
  const hasMhtCetAddOn = selectedAdditionalCourses.includes("All MHT CET Exam");
  const shouldShowMhtCetCategory = isMhtCet || hasMhtCetAddOn;

  const requiresOtherSubjectName =
    selectedSubjects.includes(OTHER_SUBJECT_OPTION) && !otherSubject.trim();

  const hasRequiredAcademicSelection = Boolean(
    selectedBoard &&
    selectedSubjects.length > 0 &&
    hasSelectedStream &&
    !requiresOtherSubjectName,
  );

  const canSelectSlot = isRegularAcademic
    ? hasRequiredAcademicSelection
    : hasCourseOptions
      ? Boolean(selectedCourseName)
      : true;

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
    ? `${course.title} — ${selectedBoard}${
        isSeniorSecondary ? ` — ${selectedStream}` : ""
      } — ${selectedSubjectText}`
    : isMhtCet
      ? `${selectedCourseName}${mhtCetSubExam ? ` – ${mhtCetSubExam}` : ""}`
      : selectedCourseName || course.title;

  function toggleSubject(subject: string) {
    const isRemoving = selectedSubjects.includes(subject);

    if (isRemoving && subject === OTHER_SUBJECT_OPTION) {
      setOtherSubject("");
    }

    setSelectedSubjects((currentSubjects) =>
      currentSubjects.includes(subject)
        ? currentSubjects.filter((item) => item !== subject)
        : [...currentSubjects, subject],
    );
    setSelectedSlot("");
  }

  function toggleAdditionalCourse(additionalCourse: string) {
    const isRemoving = selectedAdditionalCourses.includes(additionalCourse);

    if (isRemoving && additionalCourse === "All MHT CET Exam") {
      setMhtCetSubExam("");
    }

    setSelectedAdditionalCourses((currentCourses) =>
      currentCourses.includes(additionalCourse)
        ? currentCourses.filter((item) => item !== additionalCourse)
        : [...currentCourses, additionalCourse],
    );
    setSelectedSlot("");
  }

  function resetForm() {
    setIsSuccess(false);
    setName("");
    setContact("");
    setRole("student");
    setSelectedCourseName("");
    setMhtCetSubExam("");
    setSelectedBoard("");
    setSelectedStream("");
    setSelectedSubjects([]);
    setOtherSubject("");
    setSelectedAdditionalCourses([]);
    setSelectedSlot("");
  }

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !contact.trim()) {
      alert("Please fill out your name and phone/email to continue.");
      return;
    }

    if (isRegularAcademic && !selectedBoard) {
      alert("Please select your education board.");
      return;
    }

    if (isRegularAcademic && isSeniorSecondary && !selectedStream) {
      alert("Please select your stream.");
      return;
    }

    if (isRegularAcademic && !selectedSubjects.length) {
      alert("Please select at least one regular academic subject.");
      return;
    }

    if (isRegularAcademic && requiresOtherSubjectName) {
      alert("Please type the name of the other school subject.");
      return;
    }

    if (!isRegularAcademic && hasCourseOptions && !selectedCourseName) {
      alert("Please select a course to enroll in.");
      return;
    }

    if (shouldShowMhtCetCategory && !mhtCetSubExam) {
      alert("Please select the MHT CET exam category.");
      return;
    }

    if (!selectedLearningMode) {
      alert("Please select Home Tutor or Online Tutor.");
      return;
    }

    if (!selectedSlot) {
      alert("Please select your preferred session slot.");
      return;
    }

    const message = isRegularAcademic
      ? `Hi Smart Tutors, I am interested in enrolling for **${course.title}**. Board: **${selectedBoard}**.${
          isSeniorSecondary ? ` Stream: **${selectedStream}**.` : ""
        } Regular subjects: **${selectedSubjectText}**. Optional additional courses: **${
          selectedAdditionalCourseText || "None selected"
        }**. Preferred tuition mode: **${selectedLearningMode}**. Preferred session slot: **${selectedSlot}**. Enrolling as a ${role}. Let's set up a counselling demo.`
      : `Hi Smart Tutors, I am interested in enrolling for: **${readableCourseDetail}** as a ${role}. Preferred tuition mode: **${selectedLearningMode}**. Preferred session slot: **${selectedSlot}**. Let's set up a counselling demo.`;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          role,
          courseTitle: course.title,
          courseKey: course.standardKey,
          message,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert(
          "Failed to submit enquiry. Please try again or contact us through WhatsApp.",
        );
      }
    } catch (error) {
      console.error("Enquiry submission error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.97, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.97, y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 text-slate-950">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  {course.category}
                </span>
                <h4 className="mt-0.5 font-display text-xs font-bold tracking-tight">
                  Syllabus & Registration Module
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-slate-200/60 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900"
              aria-label="Close enrollment form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 sm:p-8 md:grid-cols-12">
            <div className="space-y-6 md:col-span-7">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {course.tagline}
                </span>
                <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-slate-900">
                  {course.title}
                </h3>
                <p className="text-xs font-medium leading-relaxed text-slate-500">
                  {course.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <Clock className="mx-auto h-4 w-4 text-blue-600" />
                  <span className="mt-2 block text-[10px] font-bold uppercase text-slate-400">
                    Duration
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-slate-700">
                    {course.duration}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <Laptop className="mx-auto h-4 w-4 text-emerald-600" />
                  <span className="mt-2 block text-[10px] font-bold uppercase text-slate-400">
                    Mode
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-bold text-slate-700">
                    {course.mode}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <Calendar className="mx-auto h-4 w-4 text-amber-600" />
                  <span className="mt-2 block text-[10px] font-bold uppercase text-slate-400">
                    Schedule
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-bold text-slate-700">
                    {course.schedule}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider leading-none text-slate-400">
                  Syllabus Domains & Chapters Covered:
                </h5>
                <div className="flex flex-wrap gap-2.5">
                  {course.subjectsCovered.map((subject) => (
                    <span
                      key={subject}
                      className="flex items-center rounded border border-blue-100/40 bg-blue-50/50 px-2.5 py-1 text-[10px] font-bold text-blue-800 shadow-3xs"
                    >
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h5 className="text-[10px] font-bold uppercase tracking-wider leading-none text-slate-400">
                  Core Modules & Outcomes:
                </h5>
                <ul className="space-y-2">
                  {course.points.map((point, index) => (
                    <li
                      key={`${point}-${index}`}
                      className="flex items-start space-x-2 text-xs font-semibold text-slate-500"
                    >
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="self-start rounded-lg border border-slate-200 bg-slate-50 p-5 md:col-span-5">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form
                    key="enquiry-form"
                    onSubmit={handleFormSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1 border-b border-slate-200/60 pb-3">
                      <h4 className="font-display text-sm font-bold text-slate-900">
                        Submit your details
                      </h4>
                      <p className="text-xs font-medium leading-relaxed text-slate-500">
                        {isRegularAcademic
                          ? "Select your board, subjects, optional add-ons, and preferred class slot."
                          : "Choose your course and preferred learning session. Our counsellor will contact you for confirmation."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {isRegularAcademic ? (
                        <>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                              Select Your Board
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                              {BOARD_OPTIONS.map((board) => (
                                <button
                                  key={board}
                                  type="button"
                                  onClick={() => {
                                    setSelectedBoard(board);
                                    setSelectedStream("");
                                    setSelectedSubjects([]);
                                    setOtherSubject("");
                                    setSelectedSlot("");
                                  }}
                                  className={`cursor-pointer rounded-full border px-4 py-2.5 text-[12px] font-bold leading-tight transition-all ${
                                    selectedBoard === board
                                      ? "border-blue-300 bg-blue-100 text-blue-800 shadow-xs"
                                      : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
                                  }`}
                                >
                                  {selectedBoard === board ? (
                                    <span className="mr-1">✓</span>
                                  ) : null}
                                  {board}
                                </button>
                              ))}
                            </div>
                          </div>

                          {isSeniorSecondary && hasSelectedBoard ? (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                                Select Stream
                              </label>
                              <div className="flex flex-wrap gap-2.5">
                                {SENIOR_SECONDARY_STREAMS.map((stream) => (
                                  <button
                                    key={stream}
                                    type="button"
                                    onClick={() => {
                                      setSelectedStream(stream);
                                      setSelectedSubjects([]);
                                      setOtherSubject("");
                                      setSelectedSlot("");
                                    }}
                                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-[12px] font-bold leading-tight transition-all ${
                                      selectedStream === stream
                                        ? "border-blue-300 bg-blue-100 text-blue-800 shadow-xs"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
                                    }`}
                                  >
                                    {selectedStream === stream ? (
                                      <span className="mr-1">✓</span>
                                    ) : null}
                                    {stream}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {canShowSubjects ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                                  Select Regular Subjects
                                </label>
                                <span className="text-[10px] font-bold text-blue-600">
                                  Multiple selection allowed
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2.5">
                                {regularSubjectOptions.map((subject) => {
                                  const isSelected =
                                    selectedSubjects.includes(subject);

                                  return (
                                    <button
                                      key={subject}
                                      type="button"
                                      onClick={() => toggleSubject(subject)}
                                      className={`cursor-pointer rounded-full border px-4 py-2.5 text-[12px] font-bold leading-tight transition-all ${
                                        isSelected
                                          ? "border-blue-300 bg-blue-100 text-blue-800 shadow-xs"
                                          : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
                                      }`}
                                    >
                                      {isSelected ? (
                                        <span className="mr-1">✓</span>
                                      ) : null}
                                      {subject}
                                    </button>
                                  );
                                })}
                              </div>

                              {selectedSubjects.includes(
                                OTHER_SUBJECT_OPTION,
                              ) ? (
                                <input
                                  type="text"
                                  value={otherSubject}
                                  onChange={(event) => {
                                    setOtherSubject(event.target.value);
                                    setSelectedSlot("");
                                  }}
                                  placeholder="Type the school subject name"
                                  className="w-full rounded border border-blue-200 bg-white p-3 font-sans text-sm font-semibold text-slate-800 transition-all focus:border-blue-500 focus:outline-hidden"
                                />
                              ) : null}
                            </div>
                          ) : (
                            <div className="rounded border border-dashed border-slate-200 bg-white p-3 text-[10px] font-medium text-slate-400">
                              {isSeniorSecondary && hasSelectedBoard
                                ? "Select your stream to view board-specific subjects."
                                : "Select your board to view board-specific subjects."}
                            </div>
                          )}

                          {canShowSubjects ? (
                            <div className="space-y-2 border-t border-slate-200/70 pt-3">
                              <div className="flex items-center justify-between gap-3">
                                <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                                  Optional Additional Courses
                                </label>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Optional
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2.5">
                                {visibleAdditionalCourseOptions.map(
                                  (additionalCourse: string) => {
                                    const isSelected =
                                      selectedAdditionalCourses.includes(
                                        additionalCourse,
                                      );

                                    return (
                                      <button
                                        key={additionalCourse}
                                        type="button"
                                        onClick={() =>
                                          toggleAdditionalCourse(
                                            additionalCourse,
                                          )
                                        }
                                        className={`cursor-pointer rounded-full border px-4 py-2.5 text-[12px] font-bold leading-tight transition-all ${
                                          isSelected
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
                                        }`}
                                      >
                                        {isSelected ? (
                                          <span className="mr-1">✓</span>
                                        ) : null}
                                        {additionalCourse}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : hasCourseOptions ? (
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                            Select Course
                          </label>
                          <div className="flex flex-wrap gap-2.5">
                            {course.courseNamesIncluded.map((courseName) => (
                              <button
                                key={courseName}
                                type="button"
                                onClick={() => {
                                  setSelectedCourseName(courseName);
                                  setMhtCetSubExam("");
                                  setSelectedSlot("");
                                }}
                                className={`cursor-pointer rounded-full border px-4 py-2.5 text-[12px] font-bold leading-tight transition-all ${
                                  selectedCourseName === courseName
                                    ? "border-blue-300 bg-blue-100 text-blue-800 shadow-xs"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
                                }`}
                              >
                                {selectedCourseName === courseName ? (
                                  <span className="mr-1">✓</span>
                                ) : null}
                                {courseName}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {shouldShowMhtCetCategory ? (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase leading-none text-purple-600">
                            MHT CET Exam Category
                          </label>
                          <select
                            value={mhtCetSubExam}
                            onChange={(event) =>
                              setMhtCetSubExam(event.target.value)
                            }
                            className="w-full rounded border border-purple-200 bg-white p-3 font-sans text-sm font-semibold text-slate-800 transition-all focus:border-purple-500 focus:outline-hidden"
                          >
                            <option value="">-- Select your exam --</option>
                            {MHT_CET_EXAMS.map((exam) => (
                              <option key={exam} value={exam}>
                                {exam}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {canSelectSlot ? (
                        <div className="space-y-2 border-t border-slate-200/70 pt-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                              Preferred Tuition Mode
                            </label>

                            <span className="text-[10px] font-bold text-blue-600">
                              Select one
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {TUITION_MODES.map((mode) => {
                              const isSelected =
                                selectedLearningMode === mode.value;

                              return (
                                <button
                                  key={mode.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedLearningMode(mode.value);
                                    setSelectedSlot("");
                                  }}
                                  className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition-all ${
                                    isSelected
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-xs"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                                  }`}
                                >
                                  <span className="flex items-center gap-2 text-[12px] font-bold">
                                    {isSelected ? <span>✓</span> : null}
                                    {mode.title}
                                  </span>

                                  <span className="mt-1 block text-[9px] font-medium leading-relaxed opacity-75">
                                    {mode.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      {canSelectSlot && selectedLearningMode ? (
                        <div className="space-y-2 border-t border-slate-200/70 pt-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                              Preferred Session Slot
                            </label>
                            <span className="text-[10px] font-bold text-blue-600">
                              1 hr 30 min
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {SESSION_SLOTS.map((slot, index) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition-all ${
                                  selectedSlot === slot
                                    ? "border-blue-400 bg-blue-100 text-blue-800 shadow-xs"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                                }`}
                              >
                                <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">
                                  Slot {index + 1}
                                </span>
                                <span className="mt-1 flex items-center gap-2 text-[12px] font-bold leading-snug">
                                  {selectedSlot === slot ? (
                                    <span>✓</span>
                                  ) : null}
                                  {slot}
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] font-medium leading-relaxed text-slate-400">
                            Every session is 1 hour 30 minutes. There is a
                            30-minute break between sessions.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded border border-dashed border-slate-200 bg-white p-3 text-[10px] font-medium text-slate-400">
                          {isRegularAcademic
                            ? isSeniorSecondary
                              ? "Select your board, stream, and at least one subject to view session slots."
                              : "Select your board and at least one subject to view session slots."
                            : "Select a course first to view available session slots."}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                          Your Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full rounded border border-slate-200 bg-white p-2.5 pl-10 font-sans text-sm font-semibold text-slate-800 transition-all focus:border-blue-500 focus:outline-hidden"
                          />
                          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                          Phone / Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="e.g. +91 9876543210"
                            value={contact}
                            onChange={(event) => setContact(event.target.value)}
                            className="w-full rounded border border-slate-200 bg-white p-2.5 pl-10 font-sans text-sm font-semibold text-slate-800 transition-all focus:border-blue-500 focus:outline-hidden"
                          />
                          <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                          Enrolling As:
                        </label>
                        <select
                          value={role}
                          onChange={(event) => setRole(event.target.value)}
                          className="w-full rounded border border-slate-200 bg-white p-3 font-sans text-sm font-semibold text-slate-800 transition-all focus:border-blue-500 focus:outline-hidden"
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent / Guardian</option>
                          <option value="corporate">
                            Working Professional
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 rounded border border-slate-200/50 bg-slate-100 p-2.5">
                      <span className="block text-[9px] font-bold leading-none text-slate-400">
                        Auto-generated message:
                      </span>
                      <p className="text-xs font-medium leading-relaxed italic text-slate-500">
                        {isRegularAcademic
                          ? `"Hi Smart Tutors, I am interested in ${course.title}. Board: ${
                              selectedBoard || "..."
                            }.${
                              isSeniorSecondary
                                ? ` Stream: ${selectedStream || "..."}.`
                                : ""
                            } Regular subjects: ${
                              selectedSubjectText || "..."
                            }. Optional additional courses: ${
                              selectedAdditionalCourseText || "None selected"
                            }. Preferred tuition mode: ${
                              selectedLearningMode || "..."
                            }. Preferred session slot: ${selectedSlot || "..."}."`
                          : `"Hi Smart Tutors, I am interested in ${readableCourseDetail}. Preferred tuition mode: ${
                              selectedLearningMode || "..."
                            }. Preferred session slot: ${selectedSlot || "..."}."`}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded bg-blue-600 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {isSubmitting ? "Submitting..." : "Enroll Now"}
                      </span>
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-box"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 px-4 py-6 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-sm font-bold text-slate-950">
                        Enquiry Submitted Successfully!
                      </h4>
                      <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                        Thank you, <span className="text-blue-600">{name}</span>
                        ! Our counsellor will call you within 24 hours on{" "}
                        <span className="text-blue-600">{contact}</span> to
                        confirm your preferred{" "}
                        <span className="text-blue-600">{selectedSlot}</span>{" "}
                        session for{" "}
                        <span className="text-blue-600">
                          {readableCourseDetail}
                        </span>
                        .
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded border border-emerald-100/50 bg-emerald-50 p-2 text-[10px] font-bold uppercase text-emerald-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Reference: {Math.floor(100000 + Math.random() * 900000)}
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 transition-colors hover:text-indigo-600"
                    >
                      Reset / Register another
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
