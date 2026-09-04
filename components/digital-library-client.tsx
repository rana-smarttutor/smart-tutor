"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useState } from "react";

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
    description: "English speaking, vocabulary, grammar and fluency improvement.",
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
    description: "Computer science, Python, AI, data analytics and digital skills.",
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
    description: "Interview preparation, resumes, career skills and job readiness.",
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

function safeBookName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
}

function getExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) return "";

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
  return `${book.title || ""} ${book.description || ""} ${book.fileName || ""} ${
    book.price || ""
  }`
    .toLowerCase()
    .replace(/[_-]/g, " ");
}

function getBookCategoryIds(book: Book) {
  const searchText = getBookSearchText(book);

  return DEFAULT_LIBRARY_CATEGORIES.filter((category) => {
    if (category.id === "all") {
      return true;
    }

    return category.keywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase()),
    );
  }).map((category) => category.id);
}

async function readJsonResponse<T = {
  success?: boolean;
  message?: string;
  books?: Book[];
  canManage?: boolean;
  isLoggedIn?: boolean;
}>(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || "The server returned an invalid response.");
  }
}

type TransferState = {
  label: string;
  progress: number;
  visible: boolean;
};

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

export function DigitalLibraryClient({
  initialBooks = [],
  canManage = false,
  canDelete = false,
  isLoggedIn = false,
}: DigitalLibraryClientProps) {
  const canDeleteBooks = canDelete;
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [allowedToManage, setAllowedToManage] = useState(canManage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [query, setQuery] = useState("");
  const [activeLibraryCategory, setActiveLibraryCategory] = useState("all");

  const [customLibraryCategories, setCustomLibraryCategories] = useState<
    LibraryCategory[]
  >([]);
  const [librarySectionId, setLibrarySectionId] = useState("school-learning");
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [sectionError, setSectionError] = useState("");

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
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [transferState, setTransferState] = useState<TransferState>({
    label: "",
    progress: 0,
    visible: false,
  });

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

  const filteredBooks = useMemo(() => {
    const searchValue = query.trim().toLowerCase();

    return books.filter((book) => {
      const bookSearchText = getBookSearchText(book);
      const fallbackCategoryIds = getBookCategoryIds(book);

      const bookCategoryIds = book.categoryId
        ? ["all", book.categoryId]
        : fallbackCategoryIds;

      const matchesCategory =
        activeLibraryCategory === "all" ||
        bookCategoryIds.includes(activeLibraryCategory);

      const matchesSearch = !searchValue || bookSearchText.includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [books, query, activeLibraryCategory]);

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
      setActiveLibraryCategory(data.section?.id || "all");
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

  function openUpload() {
    resetModal();
    setIsModalOpen(true);
  }

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

  function closeModal() {
    if (!isSaving) {
      resetModal();
    }
  }

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
      clientPayload: JSON.stringify({ assetType: "book" }),
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

      if (pdfFile) {
        setUploadStatus("Uploading PDF...");

        uploadedPdf = await uploadPdf(
          `digital-library/books/${assetKey}.pdf`,
          pdfFile,
        );
      }

      if (thumbnailFile) {
        setUploadStatus("Uploading thumbnail...");

        const thumbnailExtension = getExtension(thumbnailFile.name);

        uploadedThumbnail = await uploadThumbnail(
          `digital-library/thumbnails/${assetKey}${thumbnailExtension}`,
          thumbnailFile,
        );
      }

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

      const result = await readJsonResponse<{
        success?: boolean;
        message?: string;
        redirectUrl?: string;
      }>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save material.");
      }

      resetModal();
      await loadBooks();
    } catch (error) {
      console.error("Material save error:", error);

      alert(error instanceof Error ? error.message : "Unable to save material.");
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

function requestDeleteBook(book: Book) {
  if (!canDeleteBooks) {
    return;
  }

  setDeleteError("");
  setBookToDelete(book);
}

  function cancelDeleteBook() {
    if (isDeleting) {
      return;
    }

    setDeleteError("");
    setBookToDelete(null);
  }
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

  async function downloadBook(book: Book) {
    if (!loggedIn && !allowedToManage) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        "/library",
      )}`;
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
        throw new Error(result.message || "Download is not available for this material.");
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Download failed.");
    }
  }

  function previewBook(book: Book) {
    if (!loggedIn && !allowedToManage) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        "/library",
      )}`;
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

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 text-slate-950  sm:px-6">
      <section className="mx-auto max-w-7xl">
        <section className="grid items-center gap-8 py-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600   ">
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              SmartIQ Institute Library
            </span>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-blue-600  sm:text-sm">
              India&apos;s Trusted Smart Learning Platform
            </p>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Digital Library.
              <br />
              Smarter Study Access.
            </h1>

            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-600  sm:text-lg">
              Explore PDF notes and learning materials with clear prices,
              attractive previews and secure download access.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#library-files"
                className="rounded-full bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-500"
              >
                View Library
              </a>

              {allowedToManage && (
                <>
                  <button
                    type="button"
                    onClick={openUpload}
                    className="rounded-full bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-500"
                  >
                    Upload Material
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl   sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 ">
              Library Highlights
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              PDF materials,
              <br />
              clear pricing
            </h2>

            <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-5  ">
              <p className="text-sm font-black text-slate-600 ">
                Total PDFs
              </p>
              <strong className="mt-2 block text-4xl font-black text-blue-600">
                {books.length}
              </strong>
            </div>
          </div>
        </section>

        {transferState.visible && (
          <div className="mt-4">
            <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-4 shadow-sm  ">
              <div className="flex items-center justify-between gap-4 text-sm font-black text-blue-700 ">
                <span>{transferState.label || "Processing..."}</span>
                <span>{transferState.progress}%</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100 ">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${transferState.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <section
          id="library-files"
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl   sm:p-6"
        >
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6  md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600 ">
                Library Collection
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                PDF Study Materials
              </h2>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PDFs..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500    md:max-w-sm"
            />
          </div>

          <div className="mt-6">
            <div className="library-scroll-row flex gap-3 overflow-x-auto pb-3">
              {allowedToManage && (
                <button
                  type="button"
                  onClick={() => {
                    setSectionError("");
                    setIsSectionModalOpen(true);
                  }}
                  className="shrink-0 rounded-full border border-emerald-500 bg-emerald-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                >
                  + Create Section
                </button>
              )}

              {libraryCategories.map((category) => {
                const isActive = activeLibraryCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveLibraryCategory(category.id)}
                    className={`shrink-0 rounded-full border px-5 py-3 text-xs font-black uppercase tracking-widest transition ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600   "
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <p className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center font-bold text-slate-500   ">
              Loading library...
            </p>
          ) : filteredBooks.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center font-bold text-slate-500   ">
              No PDFs found in this library section.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBooks.map((book) => {
                const priceText = displayPrice(book.price);
                const isFree = priceText === "Free";

                return (
                  <article
                    key={book.pathname || book.id || book._id || book.title}
                    className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl  "
                  >
                    <div className="h-[180px] overflow-hidden rounded-[18px] bg-slate-100">
                      <BookThumbnail book={book} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white">
                        PDF
                      </span>

                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold text-white ${
                          isFree ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                      >
                        {priceText}
                      </span>
                    </div>

                    <h3 className="mt-5 line-clamp-2 min-h-[50px] break-words text-lg font-extrabold leading-[1.35]">
                      {book.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[48px] text-sm font-medium leading-6 text-slate-600 ">
                      {book.description ||
                        "Access this PDF study material for focused learning and revision."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => downloadBook(book)}
                        className="rounded-[14px] bg-blue-600 px-2 py-3 text-xs font-extrabold text-white transition hover:bg-blue-500 sm:text-sm"
                      >
                        {isFree ? "Download ↓" : "Buy & Download"}
                      </button>

                      <button
                        type="button"
                        onClick={() => previewBook(book)}
                        className="rounded-[14px] border border-slate-200 px-2 py-3 text-xs font-extrabold transition hover:bg-slate-50   sm:text-sm"
                      >
                        Preview 👁
                      </button>
                    </div>

{allowedToManage && (
  <div
    className={`mt-4 grid gap-3 ${
      canDeleteBooks ? "grid-cols-2" : "grid-cols-1"
    }`}
  >
    <button
      type="button"
      onClick={() => openEdit(book)}
      className="rounded-[14px] border border-blue-400 px-2 py-2.5 text-xs font-extrabold text-blue-500 transition hover:bg-blue-50 sm:text-sm"
    >
      Edit
    </button>

    {canDeleteBooks ? (
      <button
        type="button"
        onClick={() => requestDeleteBook(book)}
        className="rounded-[14px] border border-red-300 px-2 py-2.5 text-xs font-extrabold text-red-500 transition hover:bg-red-50 sm:text-sm"
      >
        Delete
      </button>
    ) : null}
  </div>
)}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

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
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl   sm:p-7"
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-500">
              New Library Section
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950 ">
              Create Section
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Section Name
                </span>

                <input
                  value={newSectionName}
                  onChange={(event) => setNewSectionName(event.target.value)}
                  placeholder="Example: Olympiad Library"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-emerald-500   "
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Short Description
                </span>

                <textarea
                  value={newSectionDescription}
                  onChange={(event) =>
                    setNewSectionDescription(event.target.value)
                  }
                  placeholder="Write what this section is for"
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold leading-6 outline-none focus:border-emerald-500   "
                />
              </label>

              {sectionError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600   ">
                  {sectionError}
                </div>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                disabled={isCreatingSection}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black "
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
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-2xl   sm:p-8"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl ">
              🗑️
            </div>

            <h2
              id="delete-material-title"
              className="mt-5 text-2xl font-black text-slate-950 "
            >
              Delete PDF?
            </h2>

            <p
              id="delete-material-description"
              className="mt-3 text-sm font-medium leading-6 text-slate-600 "
            >
              Are you sure you want to delete{" "}
              <span className="font-black text-slate-950 ">
                “{bookToDelete.title}”
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600   ">
                {deleteError}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelDeleteBook}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60   "
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

      {allowedToManage && isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <form
            onSubmit={(event) => void submitMaterial(event)}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl   sm:p-7"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600 ">
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
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black "
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Name of the book
                </span>

                <input
                  required
                  value={bookName}
                  onChange={(event) => setBookName(event.target.value)}
                  placeholder="Enter book name"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500   "
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Enter description shown on the PDF card"
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold leading-6 outline-none focus:border-blue-500   "
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Library Section
                </span>

                <select
                  value={librarySectionId}
                  onChange={(event) => setLibrarySectionId(event.target.value)}
                  required
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500   "
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

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Book upload (PDF only)
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setPdfFile(event.target.files?.[0] || null)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white   "
                />

                {editingBook && (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current PDF.
                  </span>
                )}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
                  Thumbnail upload
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(event) =>
                    setThumbnailFile(event.target.files?.[0] || null)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white   "
                />

                {editingBook && (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current thumbnail.
                  </span>
                )}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 ">
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500   "
                />

                <span className="text-xs font-bold text-slate-500">
                  Display price: {displayPrice(price)}
                </span>
              </label>

              {isSaving && transferState.visible && (
                <div className="rounded-2xl bg-blue-50 p-4 ">
                  <div className="flex items-center justify-between gap-4 text-sm font-bold text-blue-600 ">
                    <span>{transferState.label || uploadStatus || "Saving material..."}</span>
                    <span>{transferState.progress}%</span>
                  </div>

                  {transferState.progress > 0 && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100 ">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${transferState.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black "
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
