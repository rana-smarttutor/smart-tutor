"use client";

import { upload } from "@vercel/blob/client";

import { useEffect, useMemo, useState } from "react";

import { requestLoginIfNeeded } from "@/lib/request-login";

import {
  BookOpen,
  ChevronRight,
  Download,
  GraduationCap,
  Landmark,
  Layers3,
  LibraryBig,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

// =====================================================
// TYPES
// =====================================================

type Book = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  price?: string;
  fileName?: string;
  pathname?: string;
  categoryId?: string;
  categoryLabel?: string;
  url?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
};

type UploadedBlobInfo = {
  pathname: string;
  url: string;
  downloadUrl?: string;
};

type DigitalLibraryClientProps = {
  initialBooks?: Book[];
  canManage?: boolean;
  canDelete?: boolean;
  isLoggedIn?: boolean;
};

type LibraryCategory = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
};

type LibraryFilter =
  | "all"
  | "school-books"
  | "junior-college"
  | "ssc-maharashtra"
  | "cbse-school"
  | "science"
  | "commerce"
  | "arts"
  | "grade-6"
  | "grade-7"
  | "grade-8"
  | "grade-9"
  | "grade-10"
  | "grade-11"
  | "grade-12";

type TransferState = {
  label: string;
  progress: number;
  visible: boolean;
};

// =====================================================
// DEFAULT LIBRARY CATEGORIES
// =====================================================

const DEFAULT_LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    id: "all",
    label: "All Libraries",
    description: "Browse every available PDF study material.",
    keywords: [],
  },
  {
    id: "school-learning",
    label: "School Learning Library",
    description: "School subjects, board exams, concepts and textbook support.",
    keywords: [
      "school",
      "ssc",
      "cbse",
      "hsc",
      "math",
      "maths",
      "algebra",
      "trigonometry",
      "chemistry",
      "physics",
      "biology",
      "science",
      "computer",
      "calculus",
      "economics",
      "english",
      "evs",
    ],
  },
  {
    id: "competitive-exam",
    label: "All Competitive Exam Library",
    description: "JEE, NEET, CET, entrance exams and competitive preparation.",
    keywords: [
      "jee",
      "neet",
      "cet",
      "entrance",
      "competitive",
      "exam",
      "mcq",
      "aptitude",
      "reasoning",
    ],
  },
  {
    id: "government-exam",
    label: "All Government Exam Library",
    description:
      "Government exam preparation, banking, railway, SSC and public sector exams.",
    keywords: [
      "government",
      "ssc cgl",
      "ssc",
      "banking",
      "railway",
      "upsc",
      "mpsc",
      "police",
      "clerk",
      "po",
      "ibps",
    ],
  },
  {
    id: "fiction",
    label: "Fiction Books Library",
    description: "Novels, stories and creative reading books.",
    keywords: [
      "fiction",
      "novel",
      "story",
      "stories",
      "literature",
      "drama",
      "poem",
      "poetry",
    ],
  },
  {
    id: "non-fiction",
    label: "Non-Fiction Books Library",
    description: "Knowledge books, practical learning and real-world subjects.",
    keywords: [
      "non fiction",
      "non-fiction",
      "history",
      "geography",
      "business",
      "finance",
      "economics",
      "psychology",
      "science",
    ],
  },
  {
    id: "biography",
    label: "Biography & Autobiography Library",
    description: "Life stories, leaders, achievers and inspirational journeys.",
    keywords: [
      "biography",
      "autobiography",
      "memoir",
      "life story",
      "gandhi",
      "abdul kalam",
      "steve jobs",
      "elon",
      "leader",
    ],
  },
  {
    id: "personality-development",
    label: "Personality Development Library",
    description: "Confidence, communication, habits, mindset and self-growth.",
    keywords: [
      "personality",
      "confidence",
      "communication",
      "self help",
      "self-help",
      "habits",
      "mindset",
      "leadership",
      "motivation",
      "growth",
    ],
  },
  {
    id: "spoken-english",
    label: "Spoken English Library",
    description:
      "English speaking, vocabulary, grammar and fluency improvement.",
    keywords: [
      "spoken english",
      "english speaking",
      "grammar",
      "vocabulary",
      "communication",
      "fluency",
      "ielts",
    ],
  },
  {
    id: "technology-ai",
    label: "Technology & AI Library",
    description:
      "Computer science, Python, AI, data analytics and digital skills.",
    keywords: [
      "computer",
      "python",
      "coding",
      "programming",
      "ai",
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "data",
      "analytics",
      "google analytics",
    ],
  },
  {
    id: "career-placement",
    label: "Career & Placement Library",
    description:
      "Interview preparation, resumes, career skills and job readiness.",
    keywords: [
      "career",
      "placement",
      "interview",
      "resume",
      "cv",
      "job",
      "corporate",
      "aptitude",
    ],
  },
];

// =====================================================
// FILTER MENU OPTIONS
// =====================================================

const SCHOOL_STANDARDS = [6, 7, 8, 9, 10] as const;
const JUNIOR_STANDARDS = [11, 12] as const;
const JUNIOR_STREAMS = ["Science", "Commerce", "Arts"] as const;

const OTHER_SIDEBAR_CATEGORIES = [
  {
    id: "competitive-exam",
    label: "Competitive Exams",
    icon: Trophy,
    topics: [
      { label: "JEE", keywords: ["jee"] },
      { label: "NEET", keywords: ["neet"] },
      { label: "MHT-CET", keywords: ["mht cet", "mht-cet"] },
      { label: "CUET", keywords: ["cuet"] },
      { label: "Other Entrance Exams", keywords: ["entrance", "aptitude"] },
    ],
  },
  {
    id: "government-exam",
    label: "Government Exams",
    icon: Landmark,
    topics: [
      { label: "UPSC", keywords: ["upsc"] },
      { label: "MPSC", keywords: ["mpsc"] },
      {
        label: "SSC Recruitment",
        keywords: ["ssc", "staff selection commission"],
      },
      { label: "Banking", keywords: ["banking", "ibps", "bank po"] },
      { label: "Railway", keywords: ["railway", "rrb"] },
    ],
  },
  {
    id: "fiction",
    label: "Fiction Books",
    icon: BookOpen,
    topics: [
      { label: "Novels", keywords: ["novel"] },
      { label: "Stories", keywords: ["story", "stories"] },
      { label: "Poetry & Drama", keywords: ["poetry", "poem", "drama"] },
    ],
  },
  {
    id: "non-fiction",
    label: "Non-Fiction Books",
    icon: Layers3,
    topics: [
      { label: "History", keywords: ["history"] },
      { label: "Science", keywords: ["science"] },
      { label: "Business & Finance", keywords: ["business", "finance"] },
      { label: "Psychology", keywords: ["psychology"] },
    ],
  },
  {
    id: "biography",
    label: "Biography & Autobiography",
    icon: BookOpen,
    topics: [
      { label: "Biography", keywords: ["biography", "life story"] },
      { label: "Autobiography", keywords: ["autobiography"] },
      { label: "Memoirs", keywords: ["memoir"] },
    ],
  },
  {
    id: "personality-development",
    label: "Personality Development",
    icon: Sparkles,
    topics: [
      { label: "Confidence", keywords: ["confidence"] },
      { label: "Communication", keywords: ["communication"] },
      { label: "Habits & Mindset", keywords: ["habits", "mindset"] },
      { label: "Leadership", keywords: ["leadership"] },
    ],
  },
  {
    id: "spoken-english",
    label: "Spoken English",
    icon: BookOpen,
    topics: [
      { label: "Grammar", keywords: ["grammar"] },
      { label: "Vocabulary", keywords: ["vocabulary"] },
      { label: "Speaking & Fluency", keywords: ["speaking", "fluency"] },
    ],
  },
  {
    id: "technology-ai",
    label: "Technology & AI",
    icon: Sparkles,
    topics: [
      { label: "Programming", keywords: ["python", "coding", "programming"] },
      {
        label: "Artificial Intelligence",
        keywords: ["artificial intelligence", "machine learning", " ai "],
      },
      { label: "Data Analytics", keywords: ["data analytics", "data science"] },
    ],
  },
  {
    id: "career-placement",
    label: "Career & Placement",
    icon: GraduationCap,
    topics: [
      { label: "Resume & CV", keywords: ["resume", " cv "] },
      { label: "Interviews", keywords: ["interview"] },
      { label: "Job Skills", keywords: ["placement", "job", "corporate"] },
    ],
  },
];

// =====================================================
// GENERAL HELPERS
// =====================================================

function safeBookName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
}

function getExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  return name.slice(dotIndex).toLowerCase();
}

function normalizeStoredPrice(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits || Number(digits) <= 0) {
    return "free";
  }

  return String(Number(digits));
}

function displayPrice(value?: string) {
  if (!value || value.toLowerCase() === "free") {
    return "Free";
  }

  const digits = value.replace(/[^\d]/g, "");

  if (!digits || Number(digits) <= 0) {
    return "Free";
  }

  return `₹${Number(digits).toLocaleString("en-IN")}`;
}

function editPriceValue(value?: string) {
  if (displayPrice(value) === "Free") {
    return "0";
  }

  return String(value).replace(/[^\d]/g, "") || "0";
}

function getBookSearchText(book: Book) {
  return [book.title, book.description, book.fileName, book.categoryLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]/g, " ");
}

// =====================================================
// CATEGORY DETECTION
// =====================================================

function getBookCategoryIds(book: Book) {
  if (book.categoryId) {
    return ["all", book.categoryId];
  }

  const searchText = getBookSearchText(book);

  const matchedCategories = DEFAULT_LIBRARY_CATEGORIES.filter((category) => {
    if (category.id === "all") {
      return true;
    }

    return category.keywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase()),
    );
  });

  return matchedCategories.map((category) => category.id);
}

// =====================================================
// ACADEMIC BOOK CLASSIFICATION
// =====================================================

function getAcademicBookInfo(book: Book) {
  const text = [book.title, book.description, book.fileName, book.categoryLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Detect Class 6 through Class 12.

  const gradeMatch = text.match(
    /\b(?:class|std|standard|grade)\s*(6|7|8|9|10|11|12)\b|\b(6|7|8|9|10|11|12)(?:st|nd|rd|th)\b/i,
  );

  const grade = Number(gradeMatch?.[1] || gradeMatch?.[2] || 0);

  const hasJuniorRange =
    /\b11\s*(?:and|to|&)\s*12\b/.test(text) ||
    /\b11th\s*(?:and|to|&)\s*12th\b/.test(text);

  // Government SSC must never become Maharashtra SSC.

  const isGovernment =
    book.categoryId === "government-exam" ||
    /\b(?:ssc cgl|ssc chsl|ssc mts|ssc gd|staff selection commission|upsc|mpsc|ibps|banking recruitment|railway recruitment)\b/.test(
      text,
    );

  const isCompetitive =
    book.categoryId === "competitive-exam" ||
    /\b(?:jee main|jee advanced|neet ug|mht cet|competitive exam preparation)\b/.test(
      text,
    );

  const isSchoolCategory = book.categoryId === "school-learning";

  const isMaharashtra =
    /\b(?:maharashtra|state board|msbshse|balbharati)\b/.test(text);

  const hasSSC = /\bssc\b/.test(text);

  const isCBSE = /\bcbse\b/.test(text);

  const isHSC = /\bhsc\b/.test(text);

  // Junior College classification.

  const isJunior =
    !isGovernment &&
    !isCompetitive &&
    (grade === 11 ||
      grade === 12 ||
      hasJuniorRange ||
      (grade === 0 && isHSC && isSchoolCategory));

  // School classification.

  const isSchool =
    !isGovernment &&
    !isCompetitive &&
    !isJunior &&
    ((grade >= 6 && grade <= 10) ||
      (grade === 0 && isSchoolCategory && (hasSSC || isCBSE || isMaharashtra)));

  return {
    text,
    grade,
    hasJuniorRange,
    isSchool,
    isJunior,
    isGovernment,
    isCompetitive,
    isMaharashtra,
    hasSSC,
    isCBSE,
    isHSC,
  };
}

// =====================================================
// EXACT ACADEMIC FILTERING
// =====================================================

function matchesLibraryFilter(book: Book, filter: LibraryFilter): boolean {
  if (filter === "all") {
    return true;
  }

  const info = getAcademicBookInfo(book);

  switch (filter) {
    case "school-books":
      return info.isSchool;

    case "junior-college":
      return info.isJunior;

    case "ssc-maharashtra":
      return (
        info.isSchool &&
        !info.isCBSE &&
        (info.isMaharashtra ||
          (info.hasSSC && book.categoryId === "school-learning"))
      );

    case "cbse-school":
      return info.isSchool && info.isCBSE;

    case "science":
      return (
        info.isJunior &&
        /\b(?:science|physics|chemistry|biology|pcm|pcb)\b/.test(info.text)
      );

    case "commerce":
      return (
        info.isJunior &&
        /\b(?:commerce|accountancy|accounts|economics|business studies|secretarial practice)\b/.test(
          info.text,
        )
      );

    case "arts":
      return (
        info.isJunior &&
        /\b(?:arts|humanities|history|geography|political science|sociology|psychology)\b/.test(
          info.text,
        )
      );

    case "grade-6":
    case "grade-7":
    case "grade-8":
    case "grade-9":
    case "grade-10":
      return (
        info.isSchool && info.grade === Number(filter.replace("grade-", ""))
      );

    case "grade-11":
    case "grade-12":
      return (
        info.isJunior &&
        (info.grade === Number(filter.replace("grade-", "")) ||
          (info.hasJuniorRange && Number(filter.replace("grade-", "")) === 12))
      );

    default:
      return true;
  }
}

// =====================================================
// COMBINED BOOK MATCHING
// =====================================================

// =====================================================
// COMBINED BOOK MATCHING
// =====================================================

function matchesBookSelection(
  book: Book,
  category: string,
  filter: LibraryFilter,
): boolean {
  const categoryIds = getBookCategoryIds(book);

  const matchesCategory = category === "all" || categoryIds.includes(category);

  const matchesAcademicFilter = matchesLibraryFilter(book, filter);

  return matchesCategory && matchesAcademicFilter;
}

// =====================================================
// JSON RESPONSE
// =====================================================

async function readJsonResponse<
  T = {
    success?: boolean;
    message?: string;
    books?: Book[];
    canManage?: boolean;
    isLoggedIn?: boolean;
  },
>(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || "The server returned an invalid response.");
  }
}

// =====================================================
// BOOK THUMBNAIL
// =====================================================

function BookThumbnail({ book }: { book: Book }) {
  if (book.thumbnailUrl) {
    return (
      <img
        src={book.thumbnailUrl}
        alt={`${book.title} thumbnail`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#102d5b] via-[#164477] to-[#081e3c]">
      <div className="text-center text-white">
        <p className="text-4xl">📘</p>

        <p className="mt-2 text-xl font-black">PDF</p>
      </div>
    </div>
  );
}

// =====================================================
// MAIN DIGITAL LIBRARY COMPONENT
// =====================================================

export function DigitalLibraryClient({
  initialBooks = [],
  canManage = false,
  canDelete = false,
  isLoggedIn = false,
}: DigitalLibraryClientProps) {
  const canDeleteBooks = canDelete;

  // ===================================================
  // BOOK STATES
  // ===================================================

  const [books, setBooks] = useState<Book[]>(initialBooks);

  const [allowedToManage, setAllowedToManage] = useState(canManage);

  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  // ===================================================
  // FILTER STATES
  // ===================================================

  const [query, setQuery] = useState("");

  const [activeLibraryCategory, setActiveLibraryCategory] = useState("all");

  const [activeLibraryFilter, setActiveLibraryFilter] =
    useState<LibraryFilter>("all");

  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // ===================================================
  // CUSTOM LIBRARY SECTIONS
  // ===================================================

  const [customLibraryCategories, setCustomLibraryCategories] = useState<
    LibraryCategory[]
  >([]);

  const [librarySectionId, setLibrarySectionId] = useState("school-learning");

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

  const [newSectionName, setNewSectionName] = useState("");

  const [newSectionDescription, setNewSectionDescription] = useState("");

  const [isCreatingSection, setIsCreatingSection] = useState(false);

  const [sectionError, setSectionError] = useState("");

  // ===================================================
  // UPLOAD AND EDIT STATES
  // ===================================================

  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [bookName, setBookName] = useState("");

  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("0");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [uploadStatus, setUploadStatus] = useState("");

  // ===================================================
  // DELETE STATES
  // ===================================================

  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteError, setDeleteError] = useState("");

  // ===================================================
  // TRANSFER PROGRESS
  // ===================================================

  const [transferState, setTransferState] = useState<TransferState>({
    label: "",
    progress: 0,
    visible: false,
  });

  // ===================================================
  // MERGE DEFAULT AND CUSTOM CATEGORIES
  // ===================================================

  const libraryCategories = useMemo(() => {
    const map = new Map<string, LibraryCategory>();

    [...DEFAULT_LIBRARY_CATEGORIES, ...customLibraryCategories].forEach(
      (category) => {
        if (!map.has(category.id)) {
          map.set(category.id, category);
        }
      },
    );

    return Array.from(map.values());
  }, [customLibraryCategories]);

  // ===================================================
  // FILTERED BOOKS
  // ===================================================

  const filteredBooks = useMemo(() => {
    const searchValue = query.trim().toLowerCase();

    return books.filter((book) => {
      const bookSearchText = getBookSearchText(book);

      const info = getAcademicBookInfo(book);

      // =====================================================
      // GOVERNMENT SSC RECRUITMENT
      // =====================================================

      const isGovernmentSSCSelection =
        activeLibraryCategory === "government-exam" &&
        selectedTopic === "SSC Recruitment";

      const sscSearchText = [
        book.title,
        book.description,
        book.fileName,
        book.categoryLabel,
        book.categoryId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/[_-]/g, " ");

      const isSSCBook = /\bssc\b|\bstaff selection commission\b/.test(
        sscSearchText,
      );

      // Prevent Maharashtra SSC school textbooks from appearing
      // in Government SSC Recruitment.

      const isSchoolSSC =
        book.categoryId === "school-learning" ||
        info.isMaharashtra ||
        info.isCBSE ||
        info.isHSC ||
        (info.grade >= 6 && info.grade <= 12);

      const isGovernmentSSCBook = isSSCBook && !isSchoolSSC;

      // =====================================================
      // CATEGORY MATCHING
      // =====================================================

      // =====================================================
      // GOVERNMENT EXAM PARENT COLLECTION
      // =====================================================

      const governmentKeywords =
        /\b(?:government exams?|govt exams?|upsc|mpsc|ssc|staff selection commission|banking|ibps|railway|rrb|bank po|police recruitment)\b/i;

      const governmentSearchText = [
        book.title,
        book.description,
        book.fileName,
        book.categoryId,
        book.categoryLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/[_-]/g, " ");

      const isSchoolMaterial =
        book.categoryId === "school-learning" ||
        (!info.isGovernment &&
          (info.isMaharashtra ||
            info.isCBSE ||
            info.isHSC ||
            info.isSchool ||
            info.isJunior));

      const isGovernmentBook =
        book.categoryId === "government-exam" ||
        (!isSchoolMaterial && governmentKeywords.test(governmentSearchText));

      const isGovernmentSelection = activeLibraryCategory === "government-exam";

      const matchesCategory = isGovernmentSelection
        ? isGovernmentBook
        : matchesBookSelection(
            book,
            activeLibraryCategory,
            activeLibraryFilter,
          );

      // =====================================================
      // BOARD MATCHING
      // =====================================================

      const matchesBoard =
        !selectedBoard ||
        (selectedBoard === "maharashtra"
          ? !info.isCBSE && (info.isMaharashtra || info.hasSSC || info.isHSC)
          : info.isCBSE);

      // =====================================================
      // STANDARD MATCHING
      // =====================================================

      const matchesStandard =
        selectedStandard === null || info.grade === selectedStandard;

      // =====================================================
      // STREAM MATCHING
      // =====================================================

      const streamKeywords: Record<string, RegExp> = {
        Science: /\b(?:science|physics|chemistry|biology|pcm|pcb)\b/,

        Commerce:
          /\b(?:commerce|accountancy|accounts|economics|business studies|secretarial practice)\b/,

        Arts: /\b(?:arts|humanities|history|geography|political science|sociology|psychology)\b/,
      };

      const matchesStream =
        !selectedStream ||
        streamKeywords[selectedStream]?.test(info.text) === true;

      // =====================================================
      // TOPIC MATCHING
      // =====================================================

      const topicOptions = OTHER_SIDEBAR_CATEGORIES.find(
        (category) => category.id === activeLibraryCategory,
      )?.topics;

      const keywords = topicOptions?.find(
        (topic) => topic.label === selectedTopic,
      )?.keywords;

      const matchesTopic = isGovernmentSSCSelection
        ? isGovernmentSSCBook
        : !selectedTopic ||
          !keywords ||
          keywords.some((keyword) => ` ${bookSearchText} `.includes(keyword));

      // =====================================================
      // SEARCH MATCHING
      // =====================================================

      const matchesSearch =
        !searchValue || bookSearchText.includes(searchValue);

      // =====================================================
      // FINAL RESULT
      // =====================================================

      return (
        matchesCategory &&
        matchesBoard &&
        matchesStandard &&
        matchesStream &&
        matchesTopic &&
        matchesSearch
      );
    });
  }, [
    books,
    query,
    activeLibraryCategory,
    activeLibraryFilter,
    selectedBoard,
    selectedStandard,
    selectedStream,
    selectedTopic,
  ]);

  // ===================================================
  // CENTRAL LIBRARY NAVIGATION
  // ===================================================

  function selectLibrary(
    category: string = "all",
    filter: LibraryFilter = "all",
    scroll: boolean = true,
  ) {
    setActiveLibraryCategory(category);

    setActiveLibraryFilter(filter);

    setQuery("");
    setSelectedBoard("");
    setSelectedStandard(null);
    setSelectedStream("");
    setSelectedTopic("");

    if (scroll) {
      requestAnimationFrame(() => {
        document.getElementById("library-files")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  function selectAcademic(
    filter: "school-books" | "junior-college",
    board = "",
    standard: number | null = null,
    stream = "",
  ) {
    setActiveLibraryCategory("all");
    setActiveLibraryFilter(filter);
    setSelectedBoard(board);
    setSelectedStandard(standard);
    setSelectedStream(stream);
    setSelectedTopic("");
    setQuery("");
  }

  function selectTopic(category: string, topic = "") {
    setActiveLibraryCategory(category);
    setActiveLibraryFilter("all");
    setSelectedBoard("");
    setSelectedStandard(null);
    setSelectedStream("");
    setSelectedTopic(topic);
    setQuery("");
  }

  // ===================================================
  // LOAD CUSTOM SECTIONS
  // ===================================================

  async function loadCustomSections() {
    try {
      const response = await fetch("/api/digital-library/sections", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success?: boolean;
        sections?: LibraryCategory[];
      };

      if (response.ok && data.success) {
        setCustomLibraryCategories(data.sections || []);
      }
    } catch (error) {
      console.error("Custom library sections load error:", error);
    }
  }

  // ===================================================
  // CREATE LIBRARY SECTION
  // ===================================================

  async function createLibrarySection() {
    const label = newSectionName.trim();

    if (!label) {
      setSectionError("Please enter a section name.");

      return;
    }

    setIsCreatingSection(true);
    setSectionError("");

    try {
      const response = await fetch("/api/digital-library/sections", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          label,

          description:
            newSectionDescription.trim() || "Custom digital library section.",
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        sections?: LibraryCategory[];
        section?: LibraryCategory;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create section.");
      }

      setCustomLibraryCategories(data.sections || []);

      selectLibrary(data.section?.id || "all", "all");

      setLibrarySectionId(data.section?.id || "school-learning");

      setNewSectionName("");
      setNewSectionDescription("");

      setIsSectionModalOpen(false);
    } catch (error) {
      setSectionError(
        error instanceof Error ? error.message : "Failed to create section.",
      );
    } finally {
      setIsCreatingSection(false);
    }
  }

  useEffect(() => {
    void loadCustomSections();
  }, []);

  // ===================================================
  // LOAD BOOKS
  // ===================================================

  async function loadBooks() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/digital-library", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load library.");
      }

      setBooks(data.books || []);

      if (typeof data.canManage === "boolean") {
        setAllowedToManage(data.canManage);
      }

      if (typeof data.isLoggedIn === "boolean") {
        setLoggedIn(data.isLoggedIn);
      }
    } catch (error) {
      console.error("Library loading error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load digital library.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ===================================================
  // RESET UPLOAD MODAL
  // ===================================================

  function resetModal() {
    setIsModalOpen(false);

    setEditingBook(null);

    setBookName("");
    setDescription("");
    setPrice("0");

    setLibrarySectionId("school-learning");

    setPdfFile(null);
    setThumbnailFile(null);

    setUploadStatus("");

    setTransferState({
      label: "",
      progress: 0,
      visible: false,
    });
  }

  // ===================================================
  // OPEN UPLOAD MODAL
  // ===================================================

  function openUpload() {
    resetModal();

    setIsModalOpen(true);
  }

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  function openEdit(book: Book) {
    setEditingBook(book);

    setBookName(book.title);

    setDescription(book.description || "");

    setPrice(editPriceValue(book.price));

    setLibrarySectionId(book.categoryId || "school-learning");

    setPdfFile(null);
    setThumbnailFile(null);

    setUploadStatus("");

    setTransferState({
      label: "",
      progress: 0,
      visible: false,
    });

    setIsModalOpen(true);
  }

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  function closeModal() {
    if (!isSaving) {
      resetModal();
    }
  }

  // ===================================================
  // UPLOAD PDF
  // ===================================================

  async function uploadPdf(
    pathname: string,
    file: File,
  ): Promise<UploadedBlobInfo> {
    setTransferState({
      label: "Uploading PDF...",
      progress: 0,
      visible: true,
    });

    const blob = await upload(pathname, file, {
      access: "public",

      contentType: "application/pdf",

      handleUploadUrl: "/api/digital-library/upload",

      clientPayload: JSON.stringify({
        assetType: "book",
      }),

      onUploadProgress: ({ percentage }) => {
        setTransferState((current) => ({
          ...current,

          label: "Uploading PDF...",

          progress: Math.round(percentage),

          visible: true,
        }));
      },
    });

    setTransferState({
      label: "PDF uploaded successfully.",

      progress: 100,

      visible: true,
    });

    return {
      pathname: blob.pathname,

      url: blob.url,

      downloadUrl: blob.downloadUrl || blob.url,
    };
  }

  // ===================================================
  // UPLOAD THUMBNAIL
  // ===================================================

  async function uploadThumbnail(
    pathname: string,
    file: File,
  ): Promise<UploadedBlobInfo> {
    const blob = await upload(pathname, file, {
      access: "public",

      contentType: file.type || undefined,

      handleUploadUrl: "/api/digital-library/upload",

      clientPayload: JSON.stringify({
        assetType: "thumbnail",
      }),

      onUploadProgress: ({ percentage }) => {
        setTransferState({
          label: "Uploading thumbnail...",

          progress: Math.round(percentage),

          visible: true,
        });
      },
    });

    return {
      pathname: blob.pathname,

      url: blob.url,

      downloadUrl: blob.downloadUrl || blob.url,
    };
  }

  // ===================================================
  // CREATE OR EDIT MATERIAL
  // ===================================================

  async function submitMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allowedToManage) {
      alert("Only admins and educators can upload or edit materials.");

      return;
    }

    const title = bookName.trim();

    if (!title) {
      alert("Please enter the name of the book.");

      return;
    }

    if (!editingBook && !pdfFile) {
      alert("Please select a PDF file.");

      return;
    }

    if (!editingBook && !thumbnailFile) {
      alert("Please select a thumbnail image.");

      return;
    }

    if (
      pdfFile &&
      pdfFile.type !== "application/pdf" &&
      !pdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Book upload must be a PDF file.");

      return;
    }

    if (thumbnailFile && !/\.(png|jpg|jpeg|webp)$/i.test(thumbnailFile.name)) {
      alert("Thumbnail must be PNG, JPG or WEBP.");

      return;
    }

    const safeTitle = safeBookName(title);

    if (!safeTitle) {
      alert("Invalid book name.");

      return;
    }

    const selectedLibrarySection =
      libraryCategories.find((category) => category.id === librarySectionId) ||
      libraryCategories.find((category) => category.id === "school-learning") ||
      DEFAULT_LIBRARY_CATEGORIES[1];

    const safeSectionId =
      selectedLibrarySection.id === "all"
        ? "school-learning"
        : selectedLibrarySection.id;

    const storedPrice = normalizeStoredPrice(price);

    const storedDescription = safeBookName(
      description ||
        "Access this PDF study material for focused learning and revision",
    ).slice(0, 90);

    const assetKey = `${Date.now()}__${storedPrice}__${safeSectionId}__${storedDescription}__${safeTitle}`;

    setIsSaving(true);

    setTransferState({
      label: "",
      progress: 0,
      visible: false,
    });

    try {
      let uploadedPdf: UploadedBlobInfo | null = null;

      let uploadedThumbnail: UploadedBlobInfo | null = null;

      // Upload PDF if selected.

      if (pdfFile) {
        setUploadStatus("Uploading PDF...");

        uploadedPdf = await uploadPdf(
          `digital-library/books/${assetKey}.pdf`,
          pdfFile,
        );
      }

      // Upload thumbnail if selected.

      if (thumbnailFile) {
        setUploadStatus("Uploading thumbnail...");

        const thumbnailExtension = getExtension(thumbnailFile.name);

        uploadedThumbnail = await uploadThumbnail(
          `digital-library/thumbnails/${assetKey}${thumbnailExtension}`,
          thumbnailFile,
        );
      }

      // Create new material.

      if (!editingBook) {
        setUploadStatus("Saving book metadata...");

        const response = await fetch("/api/digital-library", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            price,
            description,

            categoryId: safeSectionId,

            categoryLabel: selectedLibrarySection.label,

            assetKey,

            uploadedPdf,

            uploadedThumbnail,
          }),
        });

        const result = await readJsonResponse(response);

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to save material.");
        }

        setUploadStatus("Upload completed.");

        resetModal();

        await loadBooks();

        return;
      }

      // Edit existing material.

      if (!editingBook.pathname) {
        throw new Error("Unable to identify the material being edited.");
      }

      setUploadStatus("Saving material changes...");

      const response = await fetch(
        `/api/digital-library/${encodeURIComponent(editingBook.pathname)}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            price,
            description,

            categoryId: safeSectionId,

            categoryLabel: selectedLibrarySection.label,

            assetKey,

            uploadedPdf,

            uploadedThumbnail,
          }),
        },
      );

      const result = await readJsonResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save material.");
      }

      resetModal();

      await loadBooks();
    } catch (error) {
      console.error("Material save error:", error);

      alert(
        error instanceof Error ? error.message : "Unable to save material.",
      );
    } finally {
      setIsSaving(false);

      setUploadStatus("");

      setTransferState({
        label: "",
        progress: 0,
        visible: false,
      });
    }
  }

  // ===================================================
  // REQUEST DELETE
  // ===================================================

  function requestDeleteBook(book: Book) {
    if (!canDeleteBooks) {
      return;
    }

    setDeleteError("");

    setBookToDelete(book);
  }

  // ===================================================
  // CANCEL DELETE
  // ===================================================

  function cancelDeleteBook() {
    if (isDeleting) {
      return;
    }

    setDeleteError("");

    setBookToDelete(null);
  }

  // ===================================================
  // CONFIRM DELETE
  // ===================================================

  async function confirmDeleteBook() {
    if (!canDeleteBooks || !bookToDelete) {
      return;
    }

    if (!bookToDelete.pathname) {
      setDeleteError("Unable to identify this material.");

      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `/api/digital-library/${encodeURIComponent(bookToDelete.pathname)}`,
        {
          method: "DELETE",
        },
      );

      const result = await readJsonResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed.");
      }

      setBookToDelete(null);

      await loadBooks();
    } catch (error) {
      console.error("Delete material error:", error);

      setDeleteError(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  // ===================================================
  // DOWNLOAD BOOK
  // ===================================================

  async function downloadBook(book: Book) {
    const canDownload = await requestLoginIfNeeded("/library");

    if (!canDownload) {
      return;
    }

    const url = book.downloadUrl;

    if (!url) {
      alert("Download is not available for this material.");

      return;
    }

    try {
      const response = await fetch(url, {
        cache: "no-store",
      });

      const result = await readJsonResponse<{
        success?: boolean;
        message?: string;
        redirectUrl?: string;
      }>(response);

      if (!response.ok || !result.success || !result.redirectUrl) {
        throw new Error(
          result.message || "Download is not available for this material.",
        );
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Download failed.");
    }
  }

  // ===================================================
  // PREVIEW BOOK
  // ===================================================

  async function previewBook(book: Book) {
    const canPreview = await requestLoginIfNeeded("/library");

    if (!canPreview) {
      return;
    }

    if (!book.pathname) {
      alert("Preview is not available for this material.");

      return;
    }

    const previewUrl = `/api/digital-library/preview?pathname=${encodeURIComponent(
      book.pathname,
    )}`;

    window.open(previewUrl, "_blank");
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#12213c]">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col items-start lg:flex-row">
        {/* =========================================
            DIGITAL LIBRARY SIDEBAR
        ========================================= */}

        <aside className="w-full shrink-0 self-stretch border-b border-blue-100 bg-white px-3 py-5 lg:w-[265px] lg:border-b-0 lg:border-r">
          {/* ALL LIBRARIES */}

          <button
            type="button"
            onClick={() => selectLibrary("all", "all")}
            className={`
              flex w-full
              items-center gap-3
              rounded-xl
              px-4 py-3
              text-left text-sm
              font-extrabold
              transition

              ${
                activeLibraryCategory === "all" && activeLibraryFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-blue-50"
              }
            `}
          >
            <LibraryBig size={19} />
            All Libraries
          </button>

          {/* COLLAPSIBLE FILTER SECTIONS */}
          <div className="mt-5 space-y-3 px-2">
            <details
              className="group rounded-xl border border-blue-100 bg-white"
              open
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold text-slate-900 hover:bg-blue-50 [&::-webkit-details-marker]:hidden">
                <BookOpen size={18} className="text-blue-600" />
                <span className="flex-1">School Books</span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-open:rotate-90"
                />
              </summary>
              <div className="space-y-2 px-3 pb-3">
                <button
                  type="button"
                  onClick={() => selectAcademic("school-books")}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"
                >
                  All School Books
                </button>
                {[
                  { id: "maharashtra", label: "Maharashtra State Board (SSC)" },
                  { id: "cbse", label: "CBSE" },
                ].map((board) => (
                  <details
                    key={board.id}
                    className="group/board rounded-lg bg-slate-50"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                      <span className="flex-1">{board.label}</span>
                      <ChevronRight
                        size={14}
                        className="transition-transform group-open/board:rotate-90"
                      />
                    </summary>
                    <div className="space-y-1 border-l border-blue-100 pb-2 pl-3 pr-2">
                      <button
                        type="button"
                        onClick={() => selectAcademic("school-books", board.id)}
                        className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-blue-700 hover:bg-blue-100"
                      >
                        All Standards
                      </button>
                      {SCHOOL_STANDARDS.map((standard) => (
                        <button
                          type="button"
                          key={standard}
                          onClick={() =>
                            selectAcademic("school-books", board.id, standard)
                          }
                          className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-blue-100 ${activeLibraryFilter === "school-books" && selectedBoard === board.id && selectedStandard === standard ? "bg-blue-100 font-extrabold text-blue-700" : "text-slate-600"}`}
                        >
                          {standard}th Standard
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>

            <details className="group rounded-xl border border-blue-100 bg-white">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold text-slate-900 hover:bg-blue-50 [&::-webkit-details-marker]:hidden">
                <GraduationCap size={18} className="text-blue-600" />
                <span className="flex-1">Junior College Books</span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-open:rotate-90"
                />
              </summary>
              <div className="space-y-2 px-3 pb-3">
                <button
                  type="button"
                  onClick={() => selectAcademic("junior-college")}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"
                >
                  All Junior College Books
                </button>
                {[
                  { id: "maharashtra", label: "Maharashtra State Board (HSC)" },
                  { id: "cbse", label: "CBSE" },
                ].map((board) => (
                  <details
                    key={board.id}
                    className="group/board rounded-lg bg-slate-50"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                      <span className="flex-1">{board.label}</span>
                      <ChevronRight
                        size={14}
                        className="transition-transform group-open/board:rotate-90"
                      />
                    </summary>
                    <div className="space-y-1 border-l border-blue-100 pb-2 pl-3 pr-2">
                      <button
                        type="button"
                        onClick={() =>
                          selectAcademic("junior-college", board.id)
                        }
                        className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-blue-700 hover:bg-blue-100"
                      >
                        All Standards & Streams
                      </button>
                      {JUNIOR_STANDARDS.map((standard) => (
                        <details
                          key={standard}
                          className="group/standard rounded-lg"
                        >
                          <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
                            <span className="flex-1">
                              {standard}th Standard
                            </span>
                            <ChevronRight
                              size={13}
                              className="transition-transform group-open/standard:rotate-90"
                            />
                          </summary>
                          <div className="space-y-1 pl-2">
                            <button
                              type="button"
                              onClick={() =>
                                selectAcademic(
                                  "junior-college",
                                  board.id,
                                  standard,
                                )
                              }
                              className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-blue-700 hover:bg-blue-100"
                            >
                              All Streams
                            </button>
                            {JUNIOR_STREAMS.map((stream) => (
                              <button
                                type="button"
                                key={stream}
                                onClick={() =>
                                  selectAcademic(
                                    "junior-college",
                                    board.id,
                                    standard,
                                    stream,
                                  )
                                }
                                className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-blue-100 ${activeLibraryFilter === "junior-college" && selectedBoard === board.id && selectedStandard === standard && selectedStream === stream ? "bg-blue-100 font-extrabold text-blue-700" : "text-slate-600"}`}
                              >
                                {stream}
                              </button>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>

            {OTHER_SIDEBAR_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <details
                  key={category.id}
                  className="group rounded-xl border border-blue-100 bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold text-slate-900 hover:bg-blue-50 [&::-webkit-details-marker]:hidden">
                    <Icon size={18} className="text-blue-600" />
                    <span className="flex-1">{category.label}</span>
                    <ChevronRight
                      size={16}
                      className="transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <div className="space-y-1 border-l border-blue-100 pb-3 pl-4 pr-3">
                    <button
                      type="button"
                      onClick={() => selectTopic(category.id)}
                      className="block w-full rounded-lg px-2 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"
                    >
                      All {category.label}
                    </button>
                    {category.topics.map((topic) => (
                      <button
                        type="button"
                        key={topic.label}
                        onClick={() => selectTopic(category.id, topic.label)}
                        className={`block w-full rounded-lg px-2 py-2 text-left text-xs hover:bg-blue-50 ${activeLibraryCategory === category.id && selectedTopic === topic.label ? "bg-blue-100 font-extrabold text-blue-700" : "text-slate-600"}`}
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </details>
              );
            })}

            {/* CUSTOM LIBRARY SECTIONS */}

            {customLibraryCategories.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  More Libraries
                </p>

                {customLibraryCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectLibrary(category.id, "all")}
                    className={`
                          flex w-full
                          items-center gap-2
                          rounded-lg
                          px-2 py-2
                          text-left text-xs
                          font-bold
                          transition

                          ${
                            activeLibraryCategory === category.id &&
                            activeLibraryFilter === "all"
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-blue-50"
                          }
                        `}
                  >
                    <Layers3 size={18} className="shrink-0 text-blue-600" />

                    <span className="flex-1">{category.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}

        <div className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 xl:px-8">
          {/* PAGE HEADING */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <LibraryBig size={15} />
                Library
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0f1e3d] sm:text-4xl">
                Digital <span className="text-blue-600">Library</span>
              </h1>

              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Access study materials, textbooks, notes and reference books for
                your learning needs.
              </p>
            </div>

            {/* SEARCH */}

            <label className="flex h-12 w-full items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 shadow-sm sm:max-w-[400px]">
              <Search size={19} className="shrink-0 text-slate-600" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search books, subjects, chapters..."
                aria-label="Search library"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs font-bold text-blue-600"
                >
                  Clear
                </button>
              )}
            </label>
          </div>

          {/* =====================================
              UPLOAD PROGRESS
          ===================================== */}

          {transferState.visible && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex justify-between gap-4 text-sm font-bold text-blue-700">
                <span>{transferState.label || "Processing..."}</span>

                <span>{transferState.progress}%</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${transferState.progress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* =====================================
              PDF STUDY MATERIALS
          ===================================== */}

          <section
            id="library-files"
            className="mt-9 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
          >
            {/* COLLECTION HEADER */}

            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                  Library Collection
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  PDF Study Materials
                </h2>
              </div>

              {/* ADMIN ACTIONS */}

              <div className="flex flex-wrap gap-2">
                {allowedToManage && (
                  <button
                    type="button"
                    onClick={openUpload}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    + Upload Material
                  </button>
                )}

                {allowedToManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSectionError("");

                      setIsSectionModalOpen(true);
                    }}
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600"
                  >
                    + Create Section
                  </button>
                )}
              </div>
            </div>

            {/* NO DUPLICATE CATEGORY BUTTONS */}

            {/* LOADING */}

            {isLoading ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                Loading library...
              </p>
            ) : filteredBooks.length === 0 ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                No matching PDFs found. Try another board, standard, stream or
                category. Books need their board and class in the title or
                description to appear in these filters.
              </p>
            ) : (
              /* BOOK COLLECTION */

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredBooks.map((book) => {
                  const priceText = displayPrice(book.price);

                  const isFree = priceText === "Free";

                  return (
                    <article
                      key={book.pathname || book.id || book._id || book.title}
                      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* THUMBNAIL */}

                      <div className="h-44 overflow-hidden rounded-xl bg-slate-100">
                        <BookThumbnail book={book} />
                      </div>

                      {/* PRICE BADGES */}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                          PDF
                        </span>

                        <span
                          className={`
                              rounded-md
                              px-2.5 py-1
                              text-[11px]
                              font-bold
                              text-white

                              ${isFree ? "bg-emerald-500" : "bg-blue-600"}
                            `}
                        >
                          {priceText}
                        </span>
                      </div>

                      {/* BOOK TITLE */}

                      <h3 className="mt-3 line-clamp-2 min-h-10 break-words text-base font-extrabold leading-5">
                        {book.title}
                      </h3>

                      {/* DESCRIPTION */}

                      <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-600">
                        {book.description ||
                          "Access this PDF study material for focused learning and revision."}
                      </p>

                      {/* DOWNLOAD AND PREVIEW */}

                      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => void downloadBook(book)}
                          className="rounded-xl bg-blue-600 px-2 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          {isFree ? "Download ↓" : "Buy & Download"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void previewBook(book)}
                          className="rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-bold hover:bg-slate-50"
                        >
                          Preview 👁
                        </button>
                      </div>

                      {/* MANAGEMENT ACTIONS */}

                      {allowedToManage && (
                        <div
                          className={`
                              mt-2 grid
                              gap-2

                              ${canDeleteBooks ? "grid-cols-2" : "grid-cols-1"}
                            `}
                        >
                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() => openEdit(book)}
                            className="rounded-xl border border-blue-200 px-2 py-2 text-xs font-bold text-blue-700"
                          >
                            Edit
                          </button>

                          {/* DELETE */}

                          {canDeleteBooks && (
                            <button
                              type="button"
                              onClick={() => requestDeleteBook(book)}
                              className="rounded-xl border border-red-200 px-2 py-2 text-xs font-bold text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* =========================================
          CREATE SECTION MODAL
      ========================================= */}

      {allowedToManage && isSectionModalOpen && (
        <div
          className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={() => {
            if (!isCreatingSection) {
              setIsSectionModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-500">
              New Library Section
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Create Section
            </h2>

            <div className="mt-6 grid gap-4">
              {/* SECTION NAME */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Section Name
                </span>

                <input
                  value={newSectionName}
                  onChange={(event) => setNewSectionName(event.target.value)}
                  placeholder="Example: Olympiad Library"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-emerald-500"
                />
              </label>

              {/* DESCRIPTION */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Short Description
                </span>

                <textarea
                  value={newSectionDescription}
                  onChange={(event) =>
                    setNewSectionDescription(event.target.value)
                  }
                  placeholder="Write what this section is for"
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold leading-6 outline-none focus:border-emerald-500"
                />
              </label>

              {/* ERROR */}

              {sectionError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600">
                  {sectionError}
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                disabled={isCreatingSection}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void createLibrarySection()}
                disabled={isCreatingSection}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingSection ? "Creating..." : "Create Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          DELETE CONFIRMATION MODAL
      ========================================= */}

      {canDeleteBooks && bookToDelete && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 px-4 py-8 backdrop-blur-[2px]"
          onMouseDown={cancelDeleteBook}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-material-title"
            aria-describedby="delete-material-description"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-2xl sm:p-8"
          >
            {/* DELETE ICON */}

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              🗑️
            </div>

            {/* TITLE */}

            <h2
              id="delete-material-title"
              className="mt-5 text-2xl font-black text-slate-950"
            >
              Delete PDF?
            </h2>

            {/* DESCRIPTION */}

            <p
              id="delete-material-description"
              className="mt-3 text-sm font-medium leading-6 text-slate-600"
            >
              Are you sure you want to delete{" "}
              <span className="font-black text-slate-950">
                “{bookToDelete.title}”
              </span>
              ? This action cannot be undone.
            </p>

            {/* ERROR */}

            {deleteError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600">
                {deleteError}
              </div>
            )}

            {/* BUTTONS */}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelDeleteBook}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDeleteBook()}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          UPLOAD / EDIT MODAL
      ========================================= */}

      {allowedToManage && isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <form
            onSubmit={(event) => void submitMaterial(event)}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  {editingBook ? "Edit Center" : "Upload Center"}
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {editingBook ? "Edit Material" : "Upload New Material"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black"
              >
                ✕
              </button>
            </div>

            {/* FORM FIELDS */}

            <div className="mt-6 grid gap-4">
              {/* BOOK NAME */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Name of the book
                </span>

                <input
                  required
                  value={bookName}
                  onChange={(event) => setBookName(event.target.value)}
                  placeholder="Enter book name"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500"
                />
              </label>

              {/* DESCRIPTION */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Enter description shown on the PDF card"
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold leading-6 outline-none focus:border-blue-500"
                />
              </label>

              {/* LIBRARY SECTION */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Library Section
                </span>

                <select
                  value={librarySectionId}
                  onChange={(event) => setLibrarySectionId(event.target.value)}
                  required
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500"
                >
                  {libraryCategories
                    .filter((category) => category.id !== "all")
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                </select>
              </label>

              {/* PDF UPLOAD */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Book upload (PDF only)
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setPdfFile(event.target.files?.[0] || null)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white"
                />

                {editingBook && (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current PDF.
                  </span>
                )}
              </label>

              {/* THUMBNAIL UPLOAD */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Thumbnail upload
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(event) =>
                    setThumbnailFile(event.target.files?.[0] || null)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white"
                />

                {editingBook && (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current thumbnail.
                  </span>
                )}
              </label>

              {/* PRICE */}

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Price in INR
                </span>

                <input
                  required
                  min="0"
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Enter 0 for Free"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500"
                />

                <span className="text-xs font-bold text-slate-500">
                  Display price: {displayPrice(price)}
                </span>
              </label>

              {/* UPLOAD PROGRESS */}

              {isSaving && transferState.visible && (
                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm font-bold text-blue-600">
                    <span>
                      {transferState.label ||
                        uploadStatus ||
                        "Saving material..."}
                    </span>

                    <span>{transferState.progress}%</span>
                  </div>

                  {transferState.progress > 0 && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${transferState.progress}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FORM ACTIONS */}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? editingBook
                    ? "Saving..."
                    : "Uploading..."
                  : editingBook
                    ? "Save Changes"
                    : "Upload Material"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default DigitalLibraryClient;
